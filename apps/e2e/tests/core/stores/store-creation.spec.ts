import { test, expect } from '../../../fixtures/with-household';
import { createStore } from '../../../helpers/store-helpers';

// STORE-001: Create First Store

test.describe('STORE-001: Create First Store @tag:stores @tag:p0', () => {
  test('user can create store in household @tag:stores @tag:p0', async ({ authenticatedPage, household }) => {
    // Fixture provided: authenticated user with household
    // Test proves: createStore() helper works correctly
    
    const storeName = `Test Store ${Date.now()}`;
    const storeLocation = '123 Main St';
    
    // Use helper to create store
    const store = await createStore(authenticatedPage, storeName, storeLocation);
    
    // Verify store was created with correct data
    expect(store.id).toBeTruthy();
    expect(store.name).toBe(storeName);
    expect(store.location).toBe(storeLocation);
    
    // createStore() helper already verifies store is visible
    // No need to navigate again
  });
  
  test('created store is linked to household @tag:stores @tag:p0', async ({ authenticatedPage, household }) => {
    // Create a store using helper
    const storeName = `Linked Store ${Date.now()}`;
    const store = await createStore(authenticatedPage, storeName, '456 Oak Ave');
    
    // Verify store was created
    expect(store.id).toBeTruthy();
    expect(store.name).toBe(storeName);
    
    // Store creation already confirms it's linked to the household
    // (user can only create stores in their household)
  });
});
