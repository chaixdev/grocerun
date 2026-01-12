import { test, expect } from '../../fixtures/authenticated';
import { createStore } from '../../helpers/store-helpers';
import { createList, addItemToList } from '../../helpers/list-helpers';
import { startShopping, checkOffItem, completeShopping } from '../../helpers/shopping-helpers';

// Journey test: First complete shopping experience
// This test follows a user through the entire happy path from creating a store
// to completing their first shopping trip.

test.describe('First Shopping Experience Journey @tag:journey @tag:p0', () => {
  test('complete first shopping trip from start to finish @tag:journey @tag:smoke @tag:p0', async ({ authenticatedPage }) => {
    // This is a journey test - minimal fixture usage, tests the complete flow
    // Fixture provided: only authenticated user (household assumed to exist)
    
    // Step 1: Create a store
    const storeName = `Journey Store ${Date.now()}`;
    const store = await createStore(authenticatedPage, storeName, '789 Journey Blvd');
    
    expect(store.id).toBeTruthy();
    expect(store.name).toBe(storeName);
    
    // Step 2: Create a shopping list for the store
    const list = await createList(authenticatedPage, store.id);
    
    expect(list.id).toBeTruthy();
    expect(list.storeId).toBe(store.id);
    
    // Step 3: Add items to the list
    const items = [
      { name: 'Milk', quantity: 2 },
      { name: 'Eggs', quantity: 1 },
      { name: 'Bread', quantity: 1 },
      { name: 'Apples', quantity: 5 },
    ];
    
    for (const itemData of items) {
      const item = await addItemToList(authenticatedPage, itemData.name, itemData.quantity);
      expect(item.name).toBe(itemData.name);
    }
    
    // Step 4: Start shopping mode
    await startShopping(authenticatedPage);
    
    // Verify shopping mode is active
    const finishButton = authenticatedPage.locator('button:has-text("Finish"), button:has-text("Complete")').first();
    await expect(finishButton).toBeVisible({ timeout: 5000 });
    
    // Step 5: Check off items as shopping
    for (const item of items.slice(0, 3)) {
      await checkOffItem(authenticatedPage, item.name);
      
      // Verify item is checked
      const checkbox = authenticatedPage
        .locator(`text="${item.name}"`)
        .first()
        .locator('..')
        .locator('input[type="checkbox"]')
        .first();
      await expect(checkbox).toBeChecked();
    }
    
    // Step 6: Complete shopping session
    await completeShopping(authenticatedPage);
    
    // Verify redirect back to stores or list page
    const currentUrl = authenticatedPage.url();
    expect(currentUrl).toMatch(/\/(stores|lists)\/.*/);
    
    // Step 7: Verify we can access the store again and see it in the list
    await authenticatedPage.goto('/stores');
    await authenticatedPage.waitForLoadState('networkidle');
    
    const storeCard = authenticatedPage.locator(`text="${storeName}"`);
    await expect(storeCard.first()).toBeVisible({ timeout: 5000 });
    
    // Journey complete - user has successfully:
    // 1. Created a store
    // 2. Created a shopping list
    // 3. Added items to the list
    // 4. Started shopping mode
    // 5. Checked off items
    // 6. Completed shopping
    // 7. Can still access their store
  });
});
