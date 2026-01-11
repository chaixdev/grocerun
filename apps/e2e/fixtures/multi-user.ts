import { test as base, Page, BrowserContext } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { testUsers } from './users';

/**
 * Multi-user test fixture for household collaboration tests
 * Provides two authenticated browser contexts for testing multi-user scenarios
 */
type MultiUserFixtures = {
  /** User A's page (Alice) */
  userA: Page;
  /** User B's page (Bob) */
  userB: Page;
  /** User A's browser context */
  contextA: BrowserContext;
  /** User B's browser context */
  contextB: BrowserContext;
};

export const test = base.extend<MultiUserFixtures>({
  contextA: async ({ browser }, use) => {
    const context = await browser.newContext();
    await loginAs(context, testUsers.alice.id, testUsers.alice.email, testUsers.alice.name);
    await use(context);
    await context.close();
  },

  contextB: async ({ browser }, use) => {
    const context = await browser.newContext();
    await loginAs(context, testUsers.bob.id, testUsers.bob.email, testUsers.bob.name);
    await use(context);
    await context.close();
  },

  userA: async ({ contextA }, use) => {
    const page = await contextA.newPage();
    await use(page);
  },

  userB: async ({ contextB }, use) => {
    const page = await contextB.newPage();
    await use(page);
  },
});

export { expect } from '@playwright/test';
