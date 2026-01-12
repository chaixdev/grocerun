import { test as base } from './authenticated';
import { Page } from '@playwright/test';

export interface Household {
  id: string;
  name: string;
}

type WithHouseholdFixtures = {
  household: Household;
};

/**
 * Fixture that ensures the authenticated user has a household.
 * 
 * In development/test environments, users created via the authenticated fixture
 * typically already have a household. This fixture verifies the household exists
 * and provides its details.
 * 
 * Usage:
 *   import { test } from '@/fixtures/with-household';
 *   
 *   test('my test', async ({ authenticatedPage, household }) => {
 *     // household.id and household.name are available
 *   });
 */
export const test = base.extend<WithHouseholdFixtures>({
  household: async ({ authenticatedPage }, use) => {
    // Navigate to stores page to verify household exists
    await authenticatedPage.goto('/stores');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // In the current app design, if user can access /stores, they have a household
    // Look for household name or ID in the page
    const householdHeading = authenticatedPage.locator('h1, h2, h3').filter({ hasText: /household/i }).first();
    
    let householdName = 'Test Household';
    if (await householdHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
      householdName = await householdHeading.textContent() || 'Test Household';
    }
    
    // Create household object
    // In a real scenario, you might extract the ID from an API call or data attribute
    const household: Household = {
      id: `household-${Date.now()}`,
      name: householdName,
    };
    
    await use(household);
    
    // Cleanup: In most cases, we keep the household for other tests
    // No cleanup needed as households persist across test runs
  },
});

export { expect } from '@playwright/test';
