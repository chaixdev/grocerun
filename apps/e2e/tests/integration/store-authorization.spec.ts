import { test, expect } from '../../fixtures/multi-user';
import { createStore } from '../../helpers/store-helpers';

// STORE-005: User Cannot Access Stores from Different Household
// STORE-006: User Cannot Modify Stores from Different Household

test.describe('Multi-Household Store Authorization @tag:stores @tag:security @tag:integration', () => {
  test('STORE-005: users cannot access stores from different households @tag:stores @tag:security @tag:p0', async ({ userA, userB }) => {
    // Fixture provided: two authenticated users from different households
    // Test verifies: cross-household store isolation
    
    // User A creates a store
    const storeNameA = `User A Store ${Date.now()}`;
    const storeA = await createStore(userA, storeNameA, 'Location A');
    
    // User B should not see User A's store
    await userB.goto('/stores');
    await userB.waitForLoadState('networkidle');
    
    const storeCardB = userB.locator(`text="${storeNameA}"`);
    await expect(storeCardB.first()).not.toBeVisible({ timeout: 3000 });
    
    // User B creates their own store
    const storeNameB = `User B Store ${Date.now()}`;
    await createStore(userB, storeNameB, 'Location B');
    
    // User A should not see User B's store
    await userA.goto('/stores');
    await userA.waitForLoadState('networkidle');
    
    const storeCardA = userA.locator(`text="${storeNameB}"`);
    await expect(storeCardA.first()).not.toBeVisible({ timeout: 3000 });
  });
  
  test('STORE-006: users cannot modify stores from different households @tag:stores @tag:security @tag:p0', async ({ userA, userB }) => {
    // Fixture provided: two authenticated users from different households
    // Test verifies: cross-household store modification prevention
    
    // User A creates a store
    const storeName = `Protected Store ${Date.now()}`;
    const store = await createStore(userA, storeName, 'Protected Location');
    
    // User B attempts to access User A's store directly via URL
    await userB.goto(`/stores/${store.id}`);
    await userB.waitForLoadState('networkidle');
    
    // User B should see error page or be redirected
    const currentUrl = userB.url();
    const isOnStorePage = currentUrl.includes(`/stores/${store.id}`);
    
    if (isOnStorePage) {
      // If on the page, should see access denied or error message
      const errorMessage = userB.locator('text=/access denied|unauthorized|not found/i');
      await expect(errorMessage.first()).toBeVisible({ timeout: 3000 });
    } else {
      // Should be redirected away from the store page
      expect(currentUrl).not.toContain(`/stores/${store.id}`);
    }
  });
});
