import { test as base } from './with-list';
import { addItemsToList, ListItem, ShoppingList } from '../helpers/list-helpers';

type WithItemsFixtures = {
  list: ShoppingList; // Override to include items
  items: ListItem[];
};

/**
 * Fixture that provides a shopping list with items for testing.
 * 
 * This fixture extends withList and adds default items to the list.
 * By default, adds 3 common grocery items. You can customize the items
 * by providing a custom list in the future.
 * 
 * Usage:
 *   import { test } from '@/fixtures/with-items';
 *   
 *   test('my test', async ({ authenticatedPage, store, list, items }) => {
 *     // list has items already added
 *     // items[] contains the list of items
 *     // You're on the list page ready to test
 *   });
 */
export const test = base.extend<WithItemsFixtures>({
  items: async ({ authenticatedPage, list }, use) => {
    // Define default items for the list
    const defaultItems = [
      { name: 'Milk', quantity: 2 },
      { name: 'Eggs', quantity: 1 },
      { name: 'Bread', quantity: 1 },
    ];
    
    // Add items to the list
    const addedItems = await addItemsToList(authenticatedPage, defaultItems);
    
    await use(addedItems);
    
    // Cleanup: Items are part of the list, cleaned up when list is cleaned up
  },
  
  // Override list fixture to include items
  list: async ({ authenticatedPage, store }, use) => {
    // Import the parent fixture's list creation
    const { createList } = await import('../helpers/list-helpers');
    const list = await createList(authenticatedPage, store.id);
    
    // Items will be added by the items fixture above
    // This just ensures the list object is available
    await use(list);
  },
});

export { expect } from '@playwright/test';
