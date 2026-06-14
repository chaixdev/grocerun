import { test, expect } from '../../../fixtures/with-household';

// HOUSE-001: First-Time User Onboarding
// DASH-002: Empty State - No Households  
// DASH-003: Empty State - No Stores

test.describe('HOUSE-001: First-Time User Onboarding @tag:onboarding @tag:p0', () => {
  test('user with household can access stores page @tag:onboarding @tag:p0', async ({ authenticatedPage, household }) => {
    // Fixture provided: authenticated user with household
    // Test verifies: stores page is accessible
    
    await authenticatedPage.goto('/stores');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Verify "Add Store" button is visible
    const addStoreButton = authenticatedPage.locator('button:has-text("Add Store"), button:has-text("Create Store")');
    await expect(addStoreButton.first()).toBeVisible({ timeout: 5000 });
    
    // Verify we're on stores page
    expect(authenticatedPage.url()).toContain('/stores');
  });
});

test.describe('DASH-002: Empty State - No Households @tag:onboarding @tag:p1', () => {
  test.skip('new user sees onboarding guidance @tag:onboarding @tag:p1', async ({ authenticatedPage }) => {
    // This test requires a user with NO household
    // Our authenticated fixture always has a household
    // Skipping for now - would need special test user setup
  });
});

test.describe('DASH-003: Empty State - No Stores @tag:onboarding @tag:p1', () => {
  test('household with no stores shows add store option @tag:onboarding @tag:p1', async ({ authenticatedPage, household }) => {
    // Fixture provided: authenticated user with household
    // Test verifies: empty state shows add store button
    
    await authenticatedPage.goto('/stores');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Should see "Add Store" button available
    const addStoreButton = authenticatedPage.locator('button:has-text("Add Store"), button:has-text("Create Store")');
    await expect(addStoreButton.first()).toBeVisible({ timeout: 3000 });
  });
});
