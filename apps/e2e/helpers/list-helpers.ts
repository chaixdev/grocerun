import { Page, expect } from '@playwright/test';

export interface ListItem {
  name: string;
  quantity?: number;
  unit?: string;
}

export interface ShoppingList {
  id: string;
  storeId: string;
  items: ListItem[];
}

/**
 * Creates a new shopping list for a store.
 * If storeId provided: navigates to store detail page and clicks "New List"
 * If no storeId: navigates to /stores and clicks "Start Shopping List" on first store card
 * Returns the list ID extracted from the URL.
 */
export async function createList(page: Page, storeId?: string): Promise<ShoppingList> {
  if (storeId) {
    // Navigate to specific store's detail page
    await page.goto(`/stores/${storeId}`);
    await page.waitForLoadState('domcontentloaded');
    
    // On store detail page, click "New List" button
    const newListButton = page.locator('button:has-text("New List")').first();
    await expect(newListButton).toBeVisible({ timeout: 10000 });
    await newListButton.click();
  } else {
    // Navigate to stores directory and click "Start Shopping List" on first store card
    await page.goto('/stores');
    await page.waitForLoadState('domcontentloaded');
    
    // Click "Start Shopping List" or "Go To List" button on store card
    const startListButton = page.locator('button:has-text("Start Shopping List"), button:has-text("Go To List")').first();
    await expect(startListButton).toBeVisible({ timeout: 10000 });
    await startListButton.click();
  }
  
  // Wait for navigation to list page
  await page.waitForURL(/\/lists\/.+/, { timeout: 10000 });
  
  // Extract list ID from URL
  const currentUrl = page.url();
  const listMatch = currentUrl.match(/\/lists\/([^/]+)/);
  const listId = listMatch ? listMatch[1] : `list-${Date.now()}`;
  
  // Extract store ID from URL if not provided
  const finalStoreId = storeId || '';
  
  return {
    id: listId,
    storeId: finalStoreId,
    items: [],
  };
}

/**
 * Adds an item to the current shopping list.
 * Assumes you're already on a list page.
 * Fills the item input, handles section selection dialog if it appears, and adds the item.
 */
export async function addItemToList(
  page: Page,
  itemName: string,
  quantity?: number
): Promise<ListItem> {
  // Find item input field
  const addItemInput = page.locator('input[placeholder*="add" i], input[placeholder*="item" i]').first();
  await expect(addItemInput).toBeVisible({ timeout: 5000 });
  
  // Fill in item name
  await addItemInput.fill(itemName);
  
  // If quantity is provided, look for quantity controls
  if (quantity && quantity > 1) {
    const quantityInput = page.locator('input[type="number"], input[name="quantity"]').first();
    if (await quantityInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await quantityInput.fill(quantity.toString());
    } else {
      // Try using stepper buttons
      const plusButton = page.locator('button:has-text("+")').first();
      if (await plusButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        for (let i = 1; i < quantity; i++) {
          await plusButton.click();
        }
      }
    }
  }
  
  // Click the Add button
  const addButton = page.locator('button:has-text("Add")').first();
  await addButton.click();
  
  // Check if a section selection dialog appears (for new items that don't exist in the catalog yet).
  // The dialog opens AFTER a server action round-trip (Next.js → NestJS), so we must wait for it.
  // NOTE: locator.isVisible() is an immediate check — use waitFor() to actually wait.
  const sectionDialog = page.locator('[data-testid="section-selection-dialog"]');
  let isDialogVisible = false;
  try {
    await sectionDialog.waitFor({ state: 'visible', timeout: 10000 });
    isDialogVisible = true;
  } catch {
    isDialogVisible = false;
  }
  
  if (isDialogVisible) {
    // Dialog asking for section selection - click "Save & Add" to add with uncategorized section
    const saveButton = page.locator('[data-testid="save-and-add-button"]').first();
    await expect(saveButton).toBeVisible({ timeout: 3000 });
    await saveButton.click();
    
    // Wait for dialog to close — this signals the server action completed
    await expect(sectionDialog).not.toBeVisible({ timeout: 10000 });

    // After dialog closes, router.refresh() is called which triggers a server-side re-fetch.
    // Wait for any in-flight network requests to settle before asserting the item is visible.
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { /* ignore timeout */ });
  }
  
  // Verify item appears in the list.
  // router.refresh() is called after the dialog closes, which triggers a server re-fetch.
  // Give it up to 15s for the page to update.
  const itemInList = page.locator(`text="${itemName}"`);
  await expect(itemInList.first()).toBeVisible({ timeout: 15000 });
  
  return {
    name: itemName,
    quantity,
  };
}

/**
 * Removes an item from the shopping list.
 * Looks for the item and clicks its remove/delete button.
 */
export async function removeItemFromList(page: Page, itemName: string): Promise<void> {
  // Find the item in the list
  const itemElement = page.locator(`text="${itemName}"`).first();
  await expect(itemElement).toBeVisible({ timeout: 5000 });
  
  // Look for remove button near the item
  // Try different selectors for remove button
  const itemContainer = itemElement.locator('..');
  const removeButton = itemContainer.locator('button:has-text("Remove"), button:has-text("Delete"), button[aria-label*="remove" i], button[aria-label*="delete" i]').first();
  
  await removeButton.click();
  await page.waitForTimeout(1000);
  
  // Verify item is removed
  await expect(itemElement).not.toBeVisible({ timeout: 3000 });
}

/**
 * Updates the quantity of an item in the list.
 * Finds the item and adjusts its quantity using stepper or input.
 */
export async function updateItemQuantity(
  page: Page,
  itemName: string,
  newQuantity: number
): Promise<void> {
  // Find the item in the list
  const itemElement = page.locator(`text="${itemName}"`).first();
  await expect(itemElement).toBeVisible({ timeout: 5000 });
  
  // Find quantity controls near the item
  const itemContainer = itemElement.locator('..');
  const quantityInput = itemContainer.locator('input[type="number"]').first();
  
  if (await quantityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    // Direct input
    await quantityInput.fill(newQuantity.toString());
    await page.waitForTimeout(500);
  } else {
    // Use stepper buttons
    // This is simplified - real implementation would need to know current quantity
    const plusButton = itemContainer.locator('button:has-text("+")').first();
    const minusButton = itemContainer.locator('button:has-text("-")').first();
    
    // Simplified: just click plus button newQuantity times
    // In real scenario, you'd read current value and adjust accordingly
    for (let i = 0; i < newQuantity; i++) {
      await plusButton.click();
      await page.waitForTimeout(200);
    }
  }
}

/**
 * Adds multiple items to a list at once.
 * Useful for fixture setup.
 */
export async function addItemsToList(
  page: Page,
  items: Array<{ name: string; quantity?: number }>
): Promise<ListItem[]> {
  const addedItems: ListItem[] = [];
  
  for (const item of items) {
    const addedItem = await addItemToList(page, item.name, item.quantity);
    addedItems.push(addedItem);
  }
  
  return addedItems;
}
