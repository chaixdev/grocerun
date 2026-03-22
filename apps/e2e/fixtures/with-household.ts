import { test as base } from './authenticated';
import { seedIsolatedUserWithHousehold } from '../helpers/db-seed';
import { testUsers } from './users';
import { Page } from '@playwright/test';

export interface Household {
  id: string;
  name: string;
}

type WithHouseholdFixtures = {
  household: Household;
};

/**
 * Fixture that ensures the authenticated user has a household and exposes it.
 *
 * The authenticated fixture already seeds Alice with a household; this fixture
 * re-runs the upsert (idempotent) to retrieve the household id reliably.
 */
export const test = base.extend<WithHouseholdFixtures>({
  household: async ({ authenticatedPage }, use) => {
    // Re-seed (idempotent) so we get the household back with its real id.
    const { household } = await seedIsolatedUserWithHousehold({
      userId: testUsers.alice.id,
      email: testUsers.alice.email,
      name: testUsers.alice.name,
      householdName: "Alice's Household",
    });

    await use(household);
  },
});

export { expect } from '@playwright/test';
