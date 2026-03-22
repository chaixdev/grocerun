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
 * The row div has the onClick toggle handler. The Checkbox's onCheckedChange is a no-op.
 * We click the item name span (which bubbles to the row) using the data-testid on the row.
 */
export async function checkOffItem(page: Page, itemName: string): Promise<void> {
  const testId = `list-item-row-${itemName.toLowerCase().replace(/\s+/g, '-')}`;
  const itemRow = page.locator(`[data-testid="${testId}"]`);
  await expect(itemRow).toBeVisible({ timeout: 5000 });
  
  // Click the item name span — it's inside a flex-1 div without stopPropagation, so click bubbles to row
  const nameSpan = itemRow.locator('[data-testid="item-name"]');
  await nameSpan.click();
  await page.waitForTimeout(500);
  
  // Verify the Radix checkbox inside the row is now in checked state
  const checkbox = itemRow.locator('[role="checkbox"]').first();
  await expect(checkbox).toHaveAttribute('data-state', 'checked', { timeout: 5000 });
}

/**
 * Unchecks an item in shopping mode.
 * Useful for when user unchecks an accidentally checked item.
 */
export async function uncheckItem(page: Page, itemName: string): Promise<void> {
  const testId = `list-item-row-${itemName.toLowerCase().replace(/\s+/g, '-')}`;
  const itemRow = page.locator(`[data-testid="${testId}"]`);
  await expect(itemRow).toBeVisible({ timeout: 5000 });
  
  const nameSpan = itemRow.locator('[data-testid="item-name"]');
  await nameSpan.click();
  
  await page.waitForTimeout(500);
  
  // Verify checkbox is unchecked
  const checkbox = itemRow.locator('[role="checkbox"]').first();
  await expect(checkbox).toHaveAttribute('data-state', 'unchecked', { timeout: 5000 });
}

/**
 * Completes the shopping session.
 * Clicks the "Finish" button, then confirms in the TripSummary dialog.
 */
export async function completeShopping(page: Page): Promise<void> {
  // Click "Finish" button — this opens the TripSummary confirmation dialog
  const finishButton = page.locator('button:has-text("Finish")').first();
  await expect(finishButton).toBeVisible({ timeout: 5000 });
  await finishButton.click();
  
  // The TripSummary dialog appears — click "Complete Trip" to confirm
  const completeTripButton = page.locator('button:has-text("Complete Trip")').first();
  await expect(completeTripButton).toBeVisible({ timeout: 5000 });
  await completeTripButton.click();
  
  // Should redirect to the store page after completion
  await page.waitForURL(/\/stores\/.*/, { timeout: 10000 });
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
  
  // Should see Radix checkboxes (role="checkbox") for items — shadcn Checkbox renders as button, not input
  const checkboxes = page.locator('[role="checkbox"]');
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
