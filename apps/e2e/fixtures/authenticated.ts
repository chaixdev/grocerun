import { test as base, Page } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { seedIsolatedUserWithHousehold } from '../helpers/db-seed';
import { testUsers, TestUser } from './users';

/**
 * Extended test fixture that provides authenticated pages
 */
type AuthenticatedFixtures = {
  /** Page authenticated as Alice */
  authenticatedPage: Page;
  /** Page authenticated as a specific user */
  loginAsUser: (user: TestUser) => Promise<Page>;
};

export const test = base.extend<AuthenticatedFixtures>({
  /**
   * Provides a page authenticated as Alice (default test user).
   * Seeds Alice with an isolated household so store/list operations work
   * without requiring the UI onboarding flow.
   */
  authenticatedPage: async ({ page }, use) => {
    await seedIsolatedUserWithHousehold({
      userId: testUsers.alice.id,
      email: testUsers.alice.email,
      name: testUsers.alice.name,
      householdName: "Alice's Household",
    });
    await loginAs(page, testUsers.alice.id, testUsers.alice.email, testUsers.alice.name);
    await use(page);
  },

  /**
   * Helper to create a page authenticated as any test user.
   * Also seeds the user with an isolated household.
   */
  loginAsUser: async ({ browser }, use) => {
    const loginHelper = async (user: TestUser) => {
      await seedIsolatedUserWithHousehold({
        userId: user.id,
        email: user.email,
        name: user.name,
        householdName: `${user.name}'s Household`,
      });
      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAs(page, user.id, user.email, user.name);
      return page;
    };
    await use(loginHelper);
  },
});

export { expect } from '@playwright/test';
