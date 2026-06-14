/**
 * List journey — create a shopping list and add items via the browser.
 *
 * Each test gets a fresh DB (truncated + re-seeded) so no test
 * interferes with another.  The browser drives the real user flows:
 * navigating to the list, typing item names, confirming section
 * selection, and verifying rendering.
 */
import { test, expect } from '@playwright/test';
import { seedPlaywrightFixtures } from '../helpers/test-auth';

const API_BASE = 'http://localhost:3001/api/v1';

/** Create a uniquely-named list via REST API. */
async function createListViaApi(
  token: string,
  storeId: string,
): Promise<string> {
  const name = `pw-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const res = await fetch(`${API_BASE}/lists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ storeId, name }),
  });
  if (!res.ok) throw new Error(`Create list failed: ${res.status}`);
  const list = await res.json();
  return list.id;
}

test.describe('List creation and item addition', () => {
  let testToken: string;
  let storeId: string;

  test.beforeEach(async ({ page }) => {
    const auth = await seedPlaywrightFixtures('http://localhost:3001');
    testToken = auth.token;
    storeId = auth.storeId;

    await page.addInitScript((token: string) => {
      sessionStorage.setItem('__grocerun_test_token__', token);
    }, testToken);
  });

  test('can navigate to stores and see the seeded store', async ({ page }) => {
    await page.goto('/stores');
    await expect(page.getByText('Playwright Test Store'))
      .toBeVisible({ timeout: 15000 });
  });

  test('Start Shopping List button creates a list and navigates to it', async ({ page }) => {
    await page.goto('/stores');
    await page.getByRole('button', { name: 'Start Shopping List' }).click();
    await expect(page).toHaveURL(/\/lists\//, { timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Go Shopping' }))
      .toBeVisible();
  });

  test('adding a new catalog item renders it in the list', async ({ page }) => {
    const listId = await createListViaApi(testToken, storeId);
    await page.goto(`/lists/${listId}`);

    const input = page.getByPlaceholder('Add item...');
    await input.fill('Apples');
    await page.getByRole('button', { name: 'Add' }).click();

    // Section selection dialog appears for new catalog items
    await expect(page.getByTestId('section-selection-dialog'))
      .toBeVisible({ timeout: 5000 });
    await page.getByTestId('section-select').click();
    await page.getByRole('option', { name: 'Playwright Test Section' }).click();
    await page.getByTestId('save-and-add-button').click();

    // Item row appears
    await expect(page.getByTestId('list-item-row-apples'))
      .toBeVisible({ timeout: 10000 });
  });

  test('adding a duplicate item is handled gracefully', async ({ page }) => {
    const listId = await createListViaApi(testToken, storeId);
    await page.goto(`/lists/${listId}`);

    // Add Bananas first time
    const input = page.getByPlaceholder('Add item...');
    await input.fill('Bananas');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByTestId('section-selection-dialog'))
      .toBeVisible({ timeout: 5000 });
    await page.getByTestId('section-select').click();
    await page.getByRole('option', { name: 'Playwright Test Section' }).click();
    await page.getByTestId('save-and-add-button').click();
    await expect(page.getByTestId('list-item-row-bananas'))
      .toBeVisible({ timeout: 10000 });

    // Add Bananas again — app handles ALREADY_EXISTS gracefully
    await input.fill('Bananas');
    await page.getByRole('button', { name: 'Add' }).click();
    // Row count stays at 1 (duplicate rejected or no-oped)
    await expect(page.getByTestId('list-item-row-bananas'))
      .toHaveCount(1, { timeout: 5000 });
  });

  test('Go Shopping button becomes enabled after adding an item', async ({ page }) => {
    const listId = await createListViaApi(testToken, storeId);
    await page.goto(`/lists/${listId}`);

    // Start as disabled (empty list) — but might be enabled if already has items from fixture
    // Add one item via browser
    const input = page.getByPlaceholder('Add item...');
    await input.fill('Milk');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByTestId('section-selection-dialog'))
      .toBeVisible({ timeout: 5000 });
    await page.getByTestId('section-select').click();
    await page.getByRole('option', { name: 'Playwright Test Section' }).click();
    await page.getByTestId('save-and-add-button').click();
    await expect(page.getByTestId('list-item-row-milk'))
      .toBeVisible({ timeout: 10000 });

    // Button should now be enabled
    await expect(page.getByRole('button', { name: 'Go Shopping' }))
      .toBeEnabled({ timeout: 5000 });
  });
});
