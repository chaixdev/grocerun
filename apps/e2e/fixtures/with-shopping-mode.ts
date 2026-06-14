import { test as base } from './with-items';
import { startShopping } from '../helpers/shopping-helpers';

/**
 * Fixture that provides a shopping list in SHOPPING mode with items.
 * 
 * This fixture extends withItems and transitions the list to shopping mode.
 * The list has items and is ready for checking off items.
 * 
 * Usage:
 *   import { test } from '@/fixtures/with-shopping-mode';
 *   
 *   test('my test', async ({ authenticatedPage, list, items }) => {
 *     // list is in SHOPPING mode
 *     // items can be checked off
 *     // You're on the list page in shopping mode
 *   });
 */
export const test = base.extend({
  list: async ({ authenticatedPage, store, items }, use) => {
    // Import the list creation helper
    const { createList } = await import('../helpers/list-helpers');
    const list = await createList(authenticatedPage, store.id);
    
    // Items are added by withItems fixture
    // Now transition to shopping mode
    await startShopping(authenticatedPage);
    
    await use(list);
    
    // Cleanup: When test is done, we can complete shopping or leave as-is
    // No explicit cleanup for now
  },
});

export { expect } from '@playwright/test';
