/**
 * Example Test Scenarios - Ready to Implement
 * 
 * These examples show how to use the session injection fixtures
 * to implement test scenarios from wiki/planning/test-scenarios.md
 */

import { test, expect } from '../../fixtures/authenticated';
import { test as multiTest, expect as multiExpect } from '../../fixtures/multi-user';
import { testUsers } from '../../fixtures/users';

// ============================================================================
// AUTH SCENARIOS (P0)
// ============================================================================

test.describe('AUTH-001: User Login', () => {
  test('authenticated user can access protected routes', async ({ authenticatedPage }) => {
    // Session already injected by fixture
    await authenticatedPage.goto('/stores');
    
    // Should not be redirected to login
    await expect(authenticatedPage).toHaveURL(/\/stores/);
  });
});

// ============================================================================
// HOUSEHOLD SCENARIOS (P0-P1)
// ============================================================================

test.describe.skip('HOUSE-001: First-Time User Onboarding', () => {
  test('new user creates first household', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/stores');
    
    // Should see onboarding prompt
    await expect(authenticatedPage.getByText(/create my household/i)).toBeVisible();
    
    await authenticatedPage.getByRole('button', { name: /create my household/i }).click();
    
    // Household created
    await expect(authenticatedPage).toHaveURL(/\/stores/);
    // Can now create stores
  });
});

// ============================================================================
// INVITATION SCENARIOS (P1)
// ============================================================================

multiTest.describe.skip('INV-002: Join via Invitation', () => {
  multiTest('user B joins user A household', async ({ userA, userB }) => {
    // User A creates household and gets invite link
    await userA.goto('/households');
    await userA.getByRole('button', { name: /create household/i }).click();
    
    await userA.getByRole('button', { name: /invite/i }).click();
    const inviteLink = await userA.getByTestId('invite-link').textContent();
    
    // User B uses invitation link
    await userB.goto(inviteLink!);
    await userB.getByRole('button', { name: /join household/i }).click();
    
    // User B should now have access to household
    await userB.goto('/stores');
    await multiExpect(userB.getByText(/household name/i)).toBeVisible();
  });
});

// ============================================================================
// STORE SCENARIOS (P0-P1)
// ============================================================================

test.describe.skip('STORE-001: Create First Store', () => {
  test('user creates store in household', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/stores');
    
    await authenticatedPage.getByRole('button', { name: /add store/i }).click();
    await authenticatedPage.getByLabel(/store name/i).fill('Walmart');
    await authenticatedPage.getByLabel(/location/i).fill('123 Main St');
    await authenticatedPage.getByRole('button', { name: /save/i }).click();
    
    // Store should be visible
    await expect(authenticatedPage.getByText('Walmart')).toBeVisible();
    await expect(authenticatedPage.getByText('123 Main St')).toBeVisible();
  });
});

multiTest.describe.skip('STORE-005: Store Access - Household Member', () => {
  multiTest('all household members can access stores', async ({ userA, userB }) => {
    // User A creates store
    await userA.goto('/stores');
    await userA.getByRole('button', { name: /add store/i }).click();
    await userA.getByLabel(/store name/i).fill('Target');
    await userA.getByRole('button', { name: /save/i }).click();
    
    // User B (same household) should see it
    await userB.goto('/stores');
    await multiExpect(userB.getByText('Target')).toBeVisible();
  });
});

// ============================================================================
// SHOPPING LIST SCENARIOS (P0)
// ============================================================================

test.describe.skip('LIST-001: Create Shopping List', () => {
  test('user creates new shopping list', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/lists');
    
    await authenticatedPage.getByRole('button', { name: /new list/i }).click();
    await authenticatedPage.getByLabel(/list name/i).fill('Weekly Shopping');
    await authenticatedPage.getByRole('button', { name: /create/i }).click();
    
    await expect(authenticatedPage.getByText('Weekly Shopping')).toBeVisible();
  });
});

multiTest.describe.skip('LIST-010: Multi-User Shopping', () => {
  multiTest('two users check off items simultaneously', async ({ userA, userB }) => {
    const listUrl = '/lists/shared-list-id';
    
    // Both users open same list
    await userA.goto(listUrl);
    await userB.goto(listUrl);
    
    // User A checks off "Milk"
    await userA.getByLabel(/milk/i).check();
    
    // User B should see it checked (real-time or after refresh)
    await userB.reload();
    await multiExpect(userB.getByLabel(/milk/i)).toBeChecked();
    
    // User B checks off "Bread"
    await userB.getByLabel(/bread/i).check();
    
    // User A should see it
    await userA.reload();
    await multiExpect(userA.getByLabel(/bread/i)).toBeChecked();
  });
});

// ============================================================================
// PHASE 4: LOCAL-FIRST / OFFLINE SCENARIOS
// ============================================================================

test.describe.skip('OFFLINE-001: Offline Shopping', () => {
  test('user can shop while offline', async ({ authenticatedPage, context }) => {
    // Load list while online
    await authenticatedPage.goto('/lists/123');
    
    // Go offline
    await context.setOffline(true);
    
    // Should still work (cached + RxDB)
    await authenticatedPage.getByLabel(/milk/i).check();
    await authenticatedPage.getByLabel(/bread/i).check();
    
    // Go back online
    await context.setOffline(false);
    
    // Changes should sync
    await authenticatedPage.waitForTimeout(1000);
    
    // Verify sync (check backend or reload)
    await authenticatedPage.reload();
    await expect(authenticatedPage.getByLabel(/milk/i)).toBeChecked();
  });
});

multiTest.describe.skip('SYNC-001: Cross-Device Sync', () => {
  multiTest('changes on device A appear on device B', async ({ userA, userB, contextA, contextB }) => {
    const listUrl = '/lists/shared-list-id';
    
    // Both users load list
    await userA.goto(listUrl);
    await userB.goto(listUrl);
    
    // User A goes offline and makes changes
    await contextA.setOffline(true);
    await userA.getByLabel(/milk/i).check();
    
    // User B shouldn't see it yet
    await userB.reload();
    await multiExpect(userB.getByLabel(/milk/i)).not.toBeChecked();
    
    // User A comes back online
    await contextA.setOffline(false);
    
    // Wait for sync
    await userA.waitForTimeout(2000);
    
    // User B should now see the change
    await userB.reload();
    await multiExpect(userB.getByLabel(/milk/i)).toBeChecked();
  });
});

// ============================================================================
// EDGE CASE SCENARIOS
// ============================================================================

test.describe.skip('EDGE-001: Concurrent Edits', () => {
  test('last write wins for conflicting edits', async ({ page, context }) => {
    // Open list in two tabs
    const page1 = page;
    const page2 = await context.newPage();
    
    await page1.goto('/lists/123');
    await page2.goto('/lists/123');
    
    // Both edit same item quantity simultaneously
    await Promise.all([
      page1.getByLabel(/milk quantity/i).fill('2'),
      page2.getByLabel(/milk quantity/i).fill('3'),
    ]);
    
    await Promise.all([
      page1.getByRole('button', { name: /save/i }).click(),
      page2.getByRole('button', { name: /save/i }).click(),
    ]);
    
    // Reload both and verify conflict resolution
    await page1.reload();
    await page2.reload();
    
    // Should have consistent state (last write wins)
    const qty1 = await page1.getByLabel(/milk quantity/i).inputValue();
    const qty2 = await page2.getByLabel(/milk quantity/i).inputValue();
    
    expect(qty1).toBe(qty2);
  });
});

/**
 * HOW TO USE THIS FILE:
 * 
 * 1. Remove .skip from a test you want to implement
 * 2. Update selectors to match your actual UI
 * 3. Add proper data setup (create households, stores, etc.)
 * 4. Run: npm test
 * 
 * The fixtures handle authentication automatically!
 */
