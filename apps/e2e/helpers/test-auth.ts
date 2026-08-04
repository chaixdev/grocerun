/**
 * Playwright test auth helpers.
 *
 * Generates JWTs compatible with the server's AuthGuard test bypass
 * (NODE_ENV=test + TEST_SECRET signing) and seeds test fixtures via API.
 */
import * as jwt from 'jsonwebtoken';
import { execFileSync } from 'child_process';
import * as path from 'path';

const TEST_SECRET = 'grocerun-test-secret-do-not-use-in-production';
const TEST_DATABASE_URL = 'file:./test.db';

interface PlaywrightTestUser {
  userId: string;
  email: string;
  name: string;
}

const PRIMARY_TEST_USER: PlaywrightTestUser = {
  userId: 'test-playwright-user',
  email: 'test@playwright.dev',
  name: 'Playwright Test User',
};

const SECOND_TEST_USER: PlaywrightTestUser = {
  userId: 'test-playwright-user-2',
  email: 'test2@playwright.dev',
  name: 'Playwright Test User 2',
};

const serverDir = path.resolve(__dirname, '../../server');

export interface TestUserIdentity {
  token: string;
  userId: string;
}

export interface TestAuth {
  token: string;
  userId: string;
  householdId: string;
  storeId: string;
  sectionId: string;
  secondUser: TestUserIdentity;
}

export function makePlaywrightToken(user: PlaywrightTestUser = PRIMARY_TEST_USER): string {
  return jwt.sign(
    { sub: user.userId, email: user.email },
    TEST_SECRET,
    { expiresIn: '1h' },
  );
}

function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'stderr' in error) {
    const stderr = (error as { stderr?: unknown }).stderr;
    if (Buffer.isBuffer(stderr)) return stderr.toString();
    if (typeof stderr === 'string') return stderr;
  }
  return error instanceof Error ? error.message : String(error);
}

function executeSql(sql: string, operation: string): void {
  try {
    execFileSync('npx', ['prisma', 'db', 'execute', '--stdin'], {
      cwd: serverDir,
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      input: sql,
      stdio: 'pipe',
    });
  } catch (error: unknown) {
    console.error(`[seed] ${operation} FAILED: ${errorMessage(error)}`);
    throw error;
  }
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function upsertTestUsers(): void {
  // Use raw SQL via prisma db execute — avoids PrismaClient module resolution issues.
  // Always use test.db (not server-test.db) — this is the Playwright database.
  const sql = `
INSERT OR IGNORE INTO User (id, email, name)
VALUES
  (${sqlString(PRIMARY_TEST_USER.userId)}, ${sqlString(PRIMARY_TEST_USER.email)}, ${sqlString(PRIMARY_TEST_USER.name)}),
  (${sqlString(SECOND_TEST_USER.userId)}, ${sqlString(SECOND_TEST_USER.email)}, ${sqlString(SECOND_TEST_USER.name)});
`;
  executeSql(sql, 'upsertTestUsers');
}

function addUserToHousehold(householdId: string, userId: string): void {
  const sql = `
INSERT OR IGNORE INTO "_HouseholdToUser" ("A", "B")
VALUES (${sqlString(householdId)}, ${sqlString(userId)});
`;
  executeSql(sql, 'addUserToHousehold');
}

/**
 * Seed test fixtures (user + household + store + section).
 * Idempotent — safe to call before each run.
 */
function truncateAll(): void {
  const tables = ['Section', 'Store', 'Household', 'User'];
  for (const table of tables) {
    executeSql(`DELETE FROM ${table};`, 'truncation');
  }
}

export async function seedPlaywrightFixtures(baseURL: string): Promise<TestAuth> {
  truncateAll();
  upsertTestUsers();

  const token = makePlaywrightToken();
  const secondToken = makePlaywrightToken(SECOND_TEST_USER);
  const authHeader = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 1. Create household via API
  const hhRes = await fetch(`${baseURL}/api/v1/households`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({ name: 'Playwright Test Household' }),
  });
  if (!hhRes.ok) {
    const errBody = await hhRes.text();
    console.error(`[seed] Household creation FAILED: ${hhRes.status} ${errBody}`);
    throw new Error(`Failed to create household: ${hhRes.status}`);
  }
  const household: { id: string } = await hhRes.json();
  const householdId = household.id;

  // Prisma's implicit User ↔ Household relation is stored in _HouseholdToUser.
  addUserToHousehold(householdId, SECOND_TEST_USER.userId);

  // 2. Create store via API
  const storeRes = await fetch(`${baseURL}/api/v1/stores`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({ name: 'Playwright Test Store', householdId }),
  });
  if (!storeRes.ok) {
    const errBody = await storeRes.text();
    console.error(`[seed] Store creation FAILED: ${storeRes.status} ${errBody}`);
    throw new Error(`Failed to create store: ${storeRes.status}`);
  }
  const store: { id: string } = await storeRes.json();
  const storeId = store.id;

  // 3. Create section via API
  const sectionRes = await fetch(`${baseURL}/api/v1/sections`, {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({ name: 'Playwright Test Section', storeId }),
  });
  if (!sectionRes.ok) {
    const errBody = await sectionRes.text();
    console.error(`[seed] Section creation FAILED: ${sectionRes.status} ${errBody}`);
    throw new Error(`Failed to create section: ${sectionRes.status}`);
  }
  const section: { id: string } = await sectionRes.json();

  return {
    token,
    userId: PRIMARY_TEST_USER.userId,
    householdId,
    storeId,
    sectionId: section.id,
    secondUser: { token: secondToken, userId: SECOND_TEST_USER.userId },
  };
}
