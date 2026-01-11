import { test as base, Page } from '@playwright/test';
import { loginAs } from '../helpers/auth';
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
   * Provides a page authenticated as Alice (default test user)
   */
  authenticatedPage: async ({ page }, use) => {
    await loginAs(page, testUsers.alice.id, testUsers.alice.email, testUsers.alice.name);
    await use(page);
  },

  /**
   * Helper to create a page authenticated as any test user
   */
  loginAsUser: async ({ browser }, use) => {
    const loginHelper = async (user: TestUser) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAs(page, user.id, user.email, user.name);
      return page;
    };
    await use(loginHelper);
  },
});

export { expect } from '@playwright/test';
