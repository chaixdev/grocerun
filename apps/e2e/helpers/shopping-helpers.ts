import { Page, expect } from '@playwright/test';

/**
 * Transitions a list from PLANNING mode to SHOPPING mode.
 * Clicks the "Go Shopping" or "Start Shopping" button.
 */
export async function startShopping(page: Page): Promise<void> {
  // Look for "Go Shopping" or "Start Shopping" button
  const startShoppingButton = page.locator('button:has-text("Go Shopping"), button:has-text("Start Shopping")').first();
  await expect(startShoppingButton).toBeVisible({ timeout: 5000 });
  
  await startShoppingButton.click();
  await page.waitForTimeout(2000);
  
  // Verify we're in shopping mode
  // Look for "Finish" button or checkboxes for items
  const finishButton = page.locator('button:has-text("Finish"), button:has-text("Complete")').first();
  await expect(finishButton).toBeVisible({ timeout: 5000 });
}

/**
 * Checks off (completes) an item in shopping mode.
 * Finds the item and clicks its checkbox.
 */
export async function checkOffItem(page: Page, itemName: string): Promise<void> {
  // Find the item in the list
  const itemElement = page.locator(`text="${itemName}"`).first();
  await expect(itemElement).toBeVisible({ timeout: 5000 });
  
  // Find the checkbox for this item
  const itemContainer = itemElement.locator('..');
  const checkbox = itemContainer.locator('input[type="checkbox"]').first();
  
  await checkbox.check();
  await page.waitForTimeout(500);
  
  // Verify checkbox is checked
  await expect(checkbox).toBeChecked();
}

/**
 * Unchecks an item in shopping mode.
 * Useful for when user unchecks an accidentally checked item.
 */
export async function uncheckItem(page: Page, itemName: string): Promise<void> {
  // Find the item in the list
  const itemElement = page.locator(`text="${itemName}"`).first();
  await expect(itemElement).toBeVisible({ timeout: 5000 });
  
  // Find the checkbox for this item
  const itemContainer = itemElement.locator('..');
  const checkbox = itemContainer.locator('input[type="checkbox"]').first();
  
  await checkbox.uncheck();
  await page.waitForTimeout(500);
  
  // Verify checkbox is unchecked
  await expect(checkbox).not.toBeChecked();
}

/**
 * Completes the shopping session.
 * Clicks the "Finish" or "Complete Shopping" button.
 */
export async function completeShopping(page: Page): Promise<void> {
  // Click "Finish" or "Complete" button
  const finishButton = page.locator('button:has-text("Finish"), button:has-text("Complete")').first();
  await finishButton.click();
  await page.waitForTimeout(2000);
  
  // Should redirect back to stores page or list page in PLANNING mode
  await page.waitForURL(/\/(stores|lists)\/.*/);
}

/**
 * Checks off multiple items at once.
 * Useful for testing bulk operations.
 */
export async function checkOffItems(page: Page, itemNames: string[]): Promise<void> {
  for (const itemName of itemNames) {
    await checkOffItem(page, itemName);
  }
}

/**
 * Verifies shopping mode is active.
 * Checks for presence of shopping mode UI elements.
 */
export async function verifyShoppingModeActive(page: Page): Promise<void> {
  // Should see "Finish" button
  const finishButton = page.locator('button:has-text("Finish"), button:has-text("Complete")').first();
  await expect(finishButton).toBeVisible({ timeout: 5000 });
  
  // Should see checkboxes for items
  const checkboxes = page.locator('input[type="checkbox"]');
  const checkboxCount = await checkboxes.count();
  expect(checkboxCount).toBeGreaterThan(0);
}

/**
 * Verifies planning mode is active.
 * Checks for presence of planning mode UI elements (item input, Go Shopping button).
 */
export async function verifyPlanningModeActive(page: Page): Promise<void> {
  // Should see item input field
  const addItemInput = page.locator('input[placeholder*="add" i], input[placeholder*="item" i]').first();
  await expect(addItemInput).toBeVisible({ timeout: 5000 });
  
  // Should see "Go Shopping" button
  const startShoppingButton = page.locator('button:has-text("Go Shopping"), button:has-text("Start Shopping")').first();
  await expect(startShoppingButton).toBeVisible({ timeout: 5000 });
}
