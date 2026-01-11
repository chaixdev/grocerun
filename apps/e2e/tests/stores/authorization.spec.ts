import { test, expect } from '../../fixtures/multi-user';

// STORE-005: Store Access - Household Member
// STORE-006: Store Access - Different Household
// Note: These tests must run serially to avoid household membership conflicts

test.describe.serial('Store Authorization @tag:stores @tag:p0', () => {

test.describe('STORE-006: Store Access - Different Household @tag:stores @tag:p0', () => {
  test('users cannot access stores from different households @tag:stores @tag:p0', async ({ userA, userB }) => {
    // Pre-condition: dev-user-1 has "My Household", dev-user-2 needs separate household
    // Goal: Verify dev-user-2 cannot access dev-user-1's store
    
    // Step 1: Ensure User B leaves any households they're a member of (cleanup from previous tests)
    await userB.goto('/settings');
    await userB.waitForLoadState('networkidle');
    
    // Leave ALL households where User B is a member (repeatedly until none left)
    let hasLeaveButton = true;
    let leaveCount = 0;
    while (hasLeaveButton && leaveCount < 10) { // Safety limit of 10
      const leaveButton = userB.locator('button[title="Leave Household"]').first();
      hasLeaveButton = await leaveButton.isVisible({ timeout: 1000 }).catch(() => false);
      
      if (hasLeaveButton) {
        await leaveButton.click();
        await userB.waitForTimeout(500);
        const confirmLeaveButton = userB.locator('button:has-text("Leave")').last();
        await confirmLeaveButton.click();
        await userB.waitForTimeout(2000); // Wait for page reload after leaving
        leaveCount++;
      }
    }
    
    // Step 2: Create User B's own household (as owner)
    const createHouseholdButton = userB.locator('button:has-text("Create New Household")').first();
    if (await createHouseholdButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createHouseholdButton.click();
      await userB.waitForTimeout(500);
      
      const householdNameInput = userB.locator('input[placeholder*="Household Name"]');
      await householdNameInput.fill("Bob's Household");
      
      const createButton = userB.locator('button:has-text("Create")').last();
      await createButton.click();
      await userB.waitForTimeout(2000);
    }
    
    // Step 3: User A creates a private store
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
      
      // Step 4: Get store ID and try to access from User B
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
      
      // Step 5: Verify User B cannot see store in list
      await userB.goto('/stores');
      await userB.waitForLoadState('networkidle');
      await expect(userB.locator(`text="${storeName}"`)).not.toBeVisible({ timeout: 2000 });
    }
  });
});

test.describe('STORE-005: Store Access - Household Member @tag:stores @tag:p0', () => {
  test('all household members can access stores @tag:stores @tag:p0', async ({ userA, userB }) => {
    // Pre-condition: dev-user-1 (alice) has household "My Household"
    // Goal: Add dev-user-2 (bob) to same household, create store, verify both can see it
    
    // Step 1: User A generates an invitation token
    await userA.goto('/settings');
    await userA.waitForLoadState('networkidle');
    
    // Click the Invite button for the first household
    const inviteButton = userA.locator('button:has-text("Invite")').first();
    await inviteButton.click();
    await userA.waitForTimeout(1000);
    
    // Extract the invitation token from the readonly input
    const tokenInput = userA.locator('input[readonly].font-mono').first();
    const inviteToken = await tokenInput.inputValue();
    expect(inviteToken).toBeTruthy();
    
    // Step 2: User B joins the household via invitation code
    await userB.goto('/settings');
    await userB.waitForLoadState('networkidle');
    
    // Fill in the invitation code
    const joinInput = userB.locator('input[placeholder*="invitation code"]');
    await joinInput.fill(inviteToken);
    
    // Click Join Household button
    const joinButton = userB.locator('button:has-text("Join Household")');
    await joinButton.click();
    await userB.waitForTimeout(500);
    
    // Confirm in the dialog
    const confirmButton = userB.locator('button:has-text("Confirm & Join")');
    await confirmButton.click();
    await userB.waitForTimeout(2000);
    
    // Step 3: User A creates a store
    await userA.goto('/stores');
    await userA.waitForLoadState('networkidle');
    
    const createButton = userA.locator('button:has-text("Add Store"), button:has-text("Create Store")').first();
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
  });
});

}); // End of serial describe block
