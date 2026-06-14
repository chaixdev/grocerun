import { test as base } from './with-store';
import { createList, ShoppingList } from '../helpers/list-helpers';

type WithListFixtures = {
  list: ShoppingList;
};

/**
 * Fixture that provides a shopping list for testing.
 * 
 * This fixture extends withStore and creates a new shopping list for that store.
 * The list is empty by default (use withItems fixture if you need items).
 * 
 * Usage:
 *   import { test } from '@/fixtures/with-list';
 *   
 *   test('my test', async ({ authenticatedPage, household, store, list }) => {
 *     // list.id, list.storeId, list.items are available
 *     // List is already created and you're on the list page
 *   });
 */
export const test = base.extend<WithListFixtures>({
  list: async ({ authenticatedPage, store }, use) => {
    // Create a shopping list for this store
    const list = await createList(authenticatedPage, store.id);
    
    await use(list);
    
    // Cleanup: Lists can be left for future tests or deleted
    // No explicit cleanup for now
  },
});

export { expect } from '@playwright/test';
