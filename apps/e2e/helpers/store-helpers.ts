import { Page, expect } from '@playwright/test';

export interface Store {
  id: string;
  name: string;
  location: string;
}

/**
 * Creates a new store in the household.
 * Navigates to /stores, clicks Add Store, fills in the form, and submits.
 * Returns the created store object with id, name, and location.
 */
export async function createStore(
  page: Page,
  name: string,
  location: string = '123 Main St'
): Promise<Store> {
  // Navigate to stores page
  await page.goto('/stores');
  await page.waitForLoadState('domcontentloaded'); // Changed from 'networkidle' to be faster
  
  // Click "Add Store" button
  const addStoreButton = page.locator('button:has-text("Add Store"), button:has-text("Create Store")').first();
  await addStoreButton.click();
  await page.waitForTimeout(500);
  
  // Fill in store details
  await page.locator('input[name="name"], input[placeholder*="name" i]').first().fill(name);
  await page.locator('input[name="location"], input[placeholder*="location" i]').first().fill(location);
  
  // Submit the form
  const submitButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
  await submitButton.click();
  
  // Wait for the store to appear in the list  
  await page.waitForTimeout(2000);
  
  // After creation, we stay on /stores page (store directory)
  // Store should now be visible in the list - find its "View Store Details" button or card
  await expect(page.locator(`text="${name}"`).first()).toBeVisible({ timeout: 5000 });
  
  // Click the eye icon (View Store Details) to navigate to the store page
  const storeCard = page.locator(`text="${name}"`).locator('..').locator('..').locator('..');
  const viewButton = storeCard.locator('button[title="View Store Details"], button:has([class*="eye" i])').first();
  await viewButton.click();
  await page.waitForTimeout(1000);
  
  // Now we should be on /stores/:id - extract the ID
  const currentUrl = page.url();
  const storeMatch = currentUrl.match(/\/stores\/([^/?]+)/);
  const storeId = storeMatch ? storeMatch[1] : `store-${Date.now()}`;
  
  return {
    id: storeId,
    name,
    location,
  };
}

/**
 * Updates an existing store's details.
 * Navigates to the store's page and updates name and/or location.
 */
export async function updateStore(
  page: Page,
  storeId: string,
  data: { name?: string; location?: string }
): Promise<void> {
  await page.goto(`/stores/${storeId}`);
  await page.waitForLoadState('networkidle');
  
  // Look for edit button or form
  const editButton = page.locator('button:has-text("Edit"), button:has-text("Update")').first();
  if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await editButton.click();
    await page.waitForTimeout(500);
  }
  
  // Fill in the fields that are provided
  if (data.name) {
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    await nameInput.fill(data.name);
  }
  
  if (data.location) {
    const locationInput = page.locator('input[name="location"], input[placeholder*="location" i]').first();
    await locationInput.fill(data.location);
  }
  
  // Submit the form
  const submitButton = page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first();
  await submitButton.click();
  await page.waitForTimeout(2000);
}

/**
 * Deletes a store.
 * Navigates to the store page and clicks the delete button.
 */
export async function deleteStore(page: Page, storeId: string): Promise<void> {
  await page.goto(`/stores/${storeId}`);
  await page.waitForLoadState('networkidle');
  
  // Look for delete button
  const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Remove")').first();
  await deleteButton.click();
  await page.waitForTimeout(500);
  
  // Confirm deletion if there's a confirmation dialog
  const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').first();
  if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await confirmButton.click();
  }
  
  await page.waitForTimeout(2000);
}

/**
 * Navigates to a store's list page (shopping list for that store).
 * Clicks "Start Shopping List" or "Go To List" button.
 */
export async function navigateToStoreList(page: Page): Promise<void> {
  // Should already be on /stores page or specific store page
  await page.waitForLoadState('networkidle');
  
  // Click "Start Shopping List" or "Go To List" button
  const startListButton = page.locator('button:has-text("Start Shopping List"), button:has-text("Go To List")').first();
  await startListButton.click();
  await page.waitForTimeout(3000);
  
  // Wait for navigation to list page
  await page.waitForURL(/\/(lists|stores)\/.+/);
}
