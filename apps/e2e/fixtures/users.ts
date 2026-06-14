/**
 * Test user fixtures
 * 
 * These represent users that should exist in the test database.
 * In real tests, you'd seed these in beforeEach or use a test database.
 */

export const testUsers = {
  alice: {
    id: 'dev-user-1',
    email: 'dev1@localhost',
    name: 'Dev User 1',
  },
  bob: {
    id: 'dev-user-2',
    email: 'dev2@localhost',
    name: 'Dev User 2',
  },
  charlie: {
    id: 'cmk6weehe0000zr1a05jxhcdr',
    email: 'bhagwat.chaitanya@gmail.com',
    name: 'Chaitanya bhagwat',
  },
} as const;

export type TestUser = typeof testUsers[keyof typeof testUsers];
