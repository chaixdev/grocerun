import { test as base } from './with-household';
import { createStore, Store } from '../helpers/store-helpers';

type WithStoreFixtures = {
  store: Store;
};

/**
 * Fixture that provides a store for testing.
 * 
 * This fixture extends withHousehold and creates a new store using the
 * createStore() helper. The store is created fresh for each test.
 * 
 * Usage:
 *   import { test } from '@/fixtures/with-store';
 *   
 *   test('my test', async ({ authenticatedPage, household, store }) => {
 *     // store.id, store.name, store.location are available
 *     // Store is already created and ready to use
 *   });
 */
export const test = base.extend<WithStoreFixtures>({
  store: async ({ authenticatedPage, household }, use) => {
    // Create a test store
    const storeName = `Test Store ${Date.now()}`;
    const storeLocation = '123 Test St';
    
    const store = await createStore(authenticatedPage, storeName, storeLocation);
    
    await use(store);
    
    // Cleanup: Optionally delete the store after the test
    // For now, we'll keep stores to avoid cleanup complexity
    // In the future, you might want to:
    // await deleteStore(authenticatedPage, store.id);
  },
});

export { expect } from '@playwright/test';
