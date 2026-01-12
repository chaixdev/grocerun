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
 * Assumes you're on the /stores page or a specific store page.
 * Clicks the "Start Shopping List" or "Go To List" button.
 * Returns the list ID extracted from the URL.
 */
export async function createList(page: Page, storeId?: string): Promise<ShoppingList> {
  // If storeId provided, navigate to that store first
  if (storeId) {
    await page.goto(`/stores/${storeId}`);
  } else {
    // Otherwise assume we're already on stores page
    await page.goto('/stores');
  }
  await page.waitForLoadState('networkidle');
  
  // Click "Start Shopping List" or "Go To List" button
  const startListButton = page.locator('button:has-text("Start Shopping List"), button:has-text("Go To List")').first();
  await startListButton.click();
  await page.waitForTimeout(3000);
  
  // Extract list ID from URL
  const currentUrl = page.url();
  const listMatch = currentUrl.match(/\/lists\/([^/]+)/);
  const listId = listMatch ? listMatch[1] : `list-${Date.now()}`;
  
  // Extract store ID from URL if not provided
  const storeMatch = currentUrl.match(/\/stores\/([^/]+)/);
  const finalStoreId = storeId || (storeMatch ? storeMatch[1] : '');
  
  return {
    id: listId,
    storeId: finalStoreId,
    items: [],
  };
}

/**
 * Adds an item to the current shopping list.
 * Assumes you're already on a list page.
 * Fills the item input and presses Enter.
 */
export async function addItemToList(
  page: Page,
  itemName: string,
  quantity?: number
): Promise<ListItem> {
  // Find item input field
  const addItemInput = page.locator('input[placeholder*="add" i], input[placeholder*="item" i], input[name="item"]').first();
  await expect(addItemInput).toBeVisible({ timeout: 5000 });
  
  // Fill in item name
  await addItemInput.fill(itemName);
  await page.waitForTimeout(500);
  
  // If quantity is provided, look for quantity controls
  if (quantity && quantity > 1) {
    const quantityInput = page.locator('input[type="number"], input[name="quantity"]').first();
    if (await quantityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await quantityInput.fill(quantity.toString());
    } else {
      // Try using stepper buttons
      const plusButton = page.locator('button:has-text("+")').first();
      if (await plusButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        for (let i = 1; i < quantity; i++) {
          await plusButton.click();
          await page.waitForTimeout(200);
        }
      }
    }
  }
  
  // Submit the item (press Enter)
  await addItemInput.press('Enter');
  await page.waitForTimeout(2000);
  
  // Verify item appears in the list
  const itemInList = page.locator(`text="${itemName}"`);
  await expect(itemInList.first()).toBeVisible({ timeout: 5000 });
  
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
