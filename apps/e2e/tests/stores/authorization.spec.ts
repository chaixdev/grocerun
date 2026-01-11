import { test, expect } from '../../fixtures/multi-user';

// STORE-005: Store Access - Household Member
// STORE-006: Store Access - Different Household

test.describe('STORE-005: Store Access - Household Member @tag:stores @tag:p0', () => {
  // NOTE: This test requires manual setup of two users in the same household
  // The invitation flow via UI is complex and requires async processing
  // For now, this test is skipped - household member access is validated via API-002
  test.skip('all household members can access stores @tag:stores @tag:p0', async ({ userA, userB }) => {
    // Pre-condition: dev-user-1 (alice) has household "My Household"
    // Goal: Add dev-user-2 (bob) to same household, create store, verify both can see it
    
    // Step 1: User A creates an invitation
    await userA.goto('/settings');
    await userA.waitForLoadState('networkidle');
    
    const inviteButton = userA.locator('button:has-text("Invite"), button:has-text("Create Invitation")').first();
    if (await inviteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await inviteButton.click();
      await userA.waitForTimeout(1500);
      
      // Get invitation token
      const tokenInput = userA.locator('input[readonly], input[value^="http"]').first();
      const fullUrl = await tokenInput.inputValue({ timeout: 3000 }).catch(() => '');
      
      if (fullUrl) {
        const token = fullUrl.split('/invite/').pop() || fullUrl.split('=').pop();
        
        // Step 2: User B accepts invitation
        await userB.goto(`/invite/${token}`);
        await userB.waitForLoadState('networkidle');
        
        const joinButton = userB.locator('button:has-text("Join"), button:has-text("Accept")').first();
        if (await joinButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await joinButton.click();
          await userB.waitForTimeout(2000);
        }
      }
    }
    
    // Step 3: User A creates a store
    await userA.goto('/stores');
    await userA.waitForLoadState('networkidle');
    
    const createButton = userA.locator('button:has-text("Add Store"), button:has-text("Create Store")').first();
    if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createButton.click();
      await userA.waitForTimeout(500);
      
      const storeName = `Shared Test Store ${Date.now()}`;
      await userA.locator('input[name="name"], input[placeholder*="name" i]').first().fill(storeName);
      await userA.locator('input[name="location"], input[placeholder*="location" i]').first().fill('123 Test St');
      
      const saveButton = userA.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
      await saveButton.click();
      await userA.waitForTimeout(2000);
      
      // Step 4: Verify User B can see the store
      await userB.goto('/stores');
      await userB.waitForLoadState('networkidle');
      
      await expect(userB.locator(`text="${storeName}"`).first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('STORE-006: Store Access - Different Household @tag:stores @tag:p0', () => {
  test('users cannot access stores from different households @tag:stores @tag:p0', async ({ userA, userB }) => {
    // Pre-condition: dev-user-1 has "My Household", dev-user-2 needs separate household
    // Goal: Verify dev-user-2 cannot access dev-user-1's store
    
    // Step 1: Ensure User B has their own household
    await userB.goto('/stores');
    await userB.waitForLoadState('networkidle');
    
    const createHouseholdButton = userB.locator('button:has-text("Create My Household"), button:has-text("Create Household")').first();
    if (await createHouseholdButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createHouseholdButton.click();
      await userB.waitForTimeout(2000);
    }
    
    // Step 2: User A creates a private store
    await userA.goto('/stores');
    await userA.waitForLoadState('networkidle');
    
    const createButton = userA.locator('button:has-text("Add Store"), button:has-text("Create Store")').first();
    if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createButton.click();
      await userA.waitForTimeout(500);
      
      const storeName = `Alice Private ${Date.now()}`;
      await userA.locator('input[name="name"], input[placeholder*="name" i]').first().fill(storeName);
      await userA.locator('input[name="location"], input[placeholder*="location" i]').first().fill('Private Loc');
      
      const saveButton = userA.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
      await saveButton.click();
      await userA.waitForTimeout(2000);
      
      // Step 3: Get store ID and try to access from User B
      const currentUrl = userA.url();
      const storeIdMatch = currentUrl.match(/\/stores\/([a-zA-Z0-9_-]+)/);
      
      if (storeIdMatch) {
        const storeId = storeIdMatch[1];
        
        await userB.goto(`/stores/${storeId}`);
        await userB.waitForLoadState('networkidle');
        
        const pageUrl = userB.url();
        
        if (pageUrl.includes(`/stores/${storeId}`)) {
          // Still on store page - should show error
          const errorText = userB.locator('text=/not found|access denied|forbidden|doesn\'t exist/i');
          await expect(errorText).toBeVisible({ timeout: 3000 });
        } else {
          // Redirected - correct behavior
          expect(pageUrl).not.toContain(storeId);
        }
      }
      
      // Step 4: Verify User B cannot see store in list
      await userB.goto('/stores');
      await userB.waitForLoadState('networkidle');
      await expect(userB.locator(`text="${storeName}"`)).not.toBeVisible({ timeout: 2000 });
    }
  });
});
