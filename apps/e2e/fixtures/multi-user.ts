import { test as base, Page, BrowserContext } from '@playwright/test';
import { loginAs } from '../helpers/auth';
import { seedIsolatedUserWithHousehold } from '../helpers/db-seed';
import { testUsers } from './users';

/**
 * Multi-user test fixture for household collaboration tests
 * Provides two authenticated browser contexts for testing multi-user scenarios.
 *
 * Each user is seeded with their own isolated household so that store-isolation
 * and authorization tests can reliably verify cross-household security boundaries.
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
    // Seed Alice with her own isolated household before setting up the browser context
    await seedIsolatedUserWithHousehold({
      userId: testUsers.alice.id,
      email: testUsers.alice.email,
      name: testUsers.alice.name,
      householdName: "Alice's Household",
    });
    const context = await browser.newContext();
    await loginAs(context, testUsers.alice.id, testUsers.alice.email, testUsers.alice.name);
    await use(context);
    await context.close();
  },

  contextB: async ({ browser }, use) => {
    // Seed Bob with his own isolated household before setting up the browser context
    await seedIsolatedUserWithHousehold({
      userId: testUsers.bob.id,
      email: testUsers.bob.email,
      name: testUsers.bob.name,
      householdName: "Bob's Household",
    });
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
