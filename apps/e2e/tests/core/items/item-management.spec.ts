import { test, expect } from '../../../fixtures/with-list';
import { addItemToList } from '../../../helpers/list-helpers';

// ITEM-001: Add Item to List (Basic Flow)
// LIST-003: Add Item with Quantity

test.describe('ITEM-001: Add Item to List @tag:items @tag:p0', () => {
  test('can add item to list @tag:items @tag:p0', async ({ authenticatedPage, list }) => {
    // Fixture provided: authenticated user, household, store, empty list
    // Test proves: addItemToList() helper works correctly
    
    const itemName = `Milk ${Date.now()}`;
    const item = await addItemToList(authenticatedPage, itemName);
    
    // Verify item was added
    expect(item.name).toBe(itemName);
    
    // Verify item appears in the list
    const itemInList = authenticatedPage.locator(`text="${itemName}"`);
    await expect(itemInList.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('LIST-003: Add Item with Quantity @tag:lists @tag:p0', () => {
  test('can add item with quantity to list @tag:lists @tag:p0', async ({ authenticatedPage, list }) => {
    // Fixture provided: authenticated user, household, store, empty list
    // Test verifies: items can be added with quantity
    
    const itemName = `Eggs ${Date.now()}`;
    const quantity = 2;
    
    const item = await addItemToList(authenticatedPage, itemName, quantity);
    
    // Verify item was added with quantity
    expect(item.name).toBe(itemName);
    expect(item.quantity).toBe(quantity);
    
    // Verify item appears in the list
    const itemInList = authenticatedPage.locator(`text="${itemName}"`);
    await expect(itemInList.first()).toBeVisible({ timeout: 5000 });
  });
});
