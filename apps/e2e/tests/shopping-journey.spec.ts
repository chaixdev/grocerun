/**
 * Shopping journey — end-to-end test of the grocery shopping flow.
 *
 * Each test gets a freshly seeded DB (truncated + re-seeded) and a
 * unique list so no test interferes with another.  The browser drives
 * the real user experience: entering shopping mode, checking items,
 * editing quantities, finishing, and completing the trip.
 */
import { test, expect } from '@playwright/test';
import { seedPlaywrightFixtures } from '../helpers/test-auth';

const API_BASE = 'http://localhost:3001/api/v1';

/** Create a list and add items via API. Each call returns a unique list. */
async function seedShoppingList(
  token: string,
  storeId: string,
  sectionId: string,
  items: string[],
): Promise<{ listId: string }> {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Create list with unique name so server never returns an existing one
  const name = `pw-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const listRes = await fetch(`${API_BASE}/lists`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ storeId, name }),
  });
  if (!listRes.ok) throw new Error(`Create list failed: ${listRes.status}`);
  const list: { id: string } = await listRes.json();
  const listId = list.id;

  for (const itemName of items) {
    // Each test uses unique item names to avoid 409 collisions
    const addRes = await fetch(`${API_BASE}/lists/items/add`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ listId, name: itemName, sectionId }),
    });
    if (!addRes.ok) {
      const err = await addRes.text();
      throw new Error(`Add item "${itemName}" failed: ${addRes.status} ${err}`);
    }
  }
  return { listId };
}

test.describe('Shopping mode', () => {
  let testToken: string;
  let storeId: string;
  let sectionId: string;

  // Re-seed before EVERY test to guarantee isolation
  test.beforeEach(async ({ page }) => {
    const auth = await seedPlaywrightFixtures('http://localhost:3001');
    testToken = auth.token;
    storeId = auth.storeId;
    sectionId = auth.sectionId;

    await page.addInitScript((token: string) => {
      sessionStorage.setItem('__grocerun_test_token__', token);
    }, testToken);
  });

  test('Go Shopping transitions list to shopping mode', async ({ page }) => {
    const { listId } = await seedShoppingList(testToken, storeId, sectionId, ['Milk', 'Bread']);
    await page.goto(`/lists/${listId}`);
    await page.getByRole('button', { name: 'Go Shopping' }).click();

    // Shopping-mode UI: Finish button with counts, Cancel available
    await expect(page.getByRole('button', { name: /Finish/ }))
      .toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Shopping mode activated!'))
      .toBeVisible({ timeout: 5000 });
    // Cancel button present (sr-only text)
    await expect(page.getByRole('button', { name: 'Cancel Shopping' }))
      .toBeVisible();
  });

  test('checking an item updates the checked count', async ({ page }) => {
    const { listId } = await seedShoppingList(testToken, storeId, sectionId, ['Milk', 'Bread', 'Eggs']);
    await page.goto(`/lists/${listId}`);
    await page.getByRole('button', { name: 'Go Shopping' }).click();
    await expect(page.getByRole('button', { name: /Finish/ }))
      .toBeVisible({ timeout: 10000 });

    // Check "Milk" — click the row; debounced toggle
    await page.getByTestId('list-item-row-milk').click();
    await page.waitForTimeout(400);

    await expect(page.getByRole('button', { name: 'Finish (1/3)' }))
      .toBeVisible({ timeout: 5000 });
    // Verify checkbox is checked (state attribute on the role="checkbox" button)
    await expect(
      page.getByTestId('list-item-row-milk').getByRole('checkbox'),
    ).toBeChecked({ timeout: 5000 });
  });

  test('Finish opens trip summary and Complete Trip finalises', async ({ page }) => {
    const { listId } = await seedShoppingList(testToken, storeId, sectionId, ['Milk', 'Bread']);
    await page.goto(`/lists/${listId}`);
    await page.getByRole('button', { name: 'Go Shopping' }).click();
    await expect(page.getByRole('button', { name: /Finish/ }))
      .toBeVisible({ timeout: 10000 });

    // Check all items
    await page.getByTestId('list-item-row-milk').click();
    await page.waitForTimeout(400);
    await page.getByTestId('list-item-row-bread').click();
    await page.waitForTimeout(400);

    await page.getByRole('button', { name: 'Finish (2/2)' }).click();
    await expect(page.getByRole('dialog', { name: 'Trip Summary' }))
      .toBeVisible({ timeout: 5000 });
    await expect(page.getByText('All items checked!')).toBeVisible();

    await page.getByRole('button', { name: 'Complete Trip' }).click();
    await expect(page.getByText('Trip completed!'))
      .toBeVisible({ timeout: 5000 });
  });

  test('Trip Summary shows missing items when some unchecked', async ({ page }) => {
    const { listId } = await seedShoppingList(testToken, storeId, sectionId, ['Milk', 'Bread', 'Eggs']);
    await page.goto(`/lists/${listId}`);
    await page.getByRole('button', { name: 'Go Shopping' }).click();
    await expect(page.getByRole('button', { name: /Finish/ }))
      .toBeVisible({ timeout: 10000 });

    // Check only one of three
    await page.getByTestId('list-item-row-milk').click();
    await page.waitForTimeout(400);

    await page.getByRole('button', { name: 'Finish (1/3)' }).click();
    await expect(page.getByRole('dialog', { name: 'Trip Summary' }))
      .toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/missing/)).toBeVisible();
  });

  test('Resume Shopping returns to shopping mode from summary', async ({ page }) => {
    const { listId } = await seedShoppingList(testToken, storeId, sectionId, ['Milk']);
    await page.goto(`/lists/${listId}`);
    await page.getByRole('button', { name: 'Go Shopping' }).click();
    await expect(page.getByRole('button', { name: /Finish/ }))
      .toBeVisible({ timeout: 10000 });

    // Finish without checking
    await page.getByRole('button', { name: 'Finish (0/1)' }).click();
    await expect(page.getByRole('dialog', { name: 'Trip Summary' }))
      .toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Resume Shopping' }).click();
    // Back in shopping mode
    await expect(page.getByRole('button', { name: /Finish/ }))
      .toBeVisible({ timeout: 5000 });
  });

  test('Cancel Shopping returns list to planning mode', async ({ page }) => {
    const { listId } = await seedShoppingList(testToken, storeId, sectionId, ['Milk']);
    await page.goto(`/lists/${listId}`);
    await page.getByRole('button', { name: 'Go Shopping' }).click();
    await expect(page.getByRole('button', { name: /Finish/ }))
      .toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'Cancel Shopping' }).click();
    await expect(page.getByRole('button', { name: 'Go Shopping' }))
      .toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Shopping Cancelled'))
      .toBeVisible({ timeout: 5000 });
  });
});
