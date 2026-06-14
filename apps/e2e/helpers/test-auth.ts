/**
 * Playwright test auth helpers.
 *
 * Generates JWTs compatible with the server's AuthGuard test bypass
 * (NODE_ENV=test + TEST_SECRET signing) and seeds test fixtures via API.
 */
import * as jwt from 'jsonwebtoken';
import { execSync } from 'child_process';
import * as path from 'path';

const TEST_SECRET = 'grocerun-test-secret-do-not-use-in-production';
const TEST_USER_ID = 'test-playwright-user';
const TEST_USER_EMAIL = 'test@playwright.dev';

const serverDir = path.resolve(__dirname, '../../server');

export interface TestAuth {
  token: string;
  userId: string;
  householdId: string;
  storeId: string;
  sectionId: string;
}

export function makePlaywrightToken(): string {
  return jwt.sign(
    { sub: TEST_USER_ID, email: TEST_USER_EMAIL },
    TEST_SECRET,
    { expiresIn: '1h' },
  );
}

function upsertTestUser(): void {
  // Use raw SQL via prisma db execute — avoids PrismaClient module resolution issues.
  // Always use test.db (not server-test.db) — this is the Playwright database.
  const dbUrl = 'file:./test.db';
  const sql = `
INSERT OR IGNORE INTO User (id, email, name)
VALUES ('${TEST_USER_ID}', '${TEST_USER_EMAIL}', 'Playwright Test User');
`;
  try {
    execSync(`echo "${sql}" | npx prisma db execute --stdin`, {
      cwd: serverDir,
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: 'pipe',
    });
  } catch (e: any) {
    console.error('[seed] upsertTestUser FAILED:', e.stderr?.toString() || e.message);
    throw e;
  }
}

/**
 * Seed test fixtures (user + household + store + section).
 * Idempotent — safe to call before each run.
 */
function truncateAll(): void {
  const dbUrl = 'file:./test.db';
  const tables = ['Section', 'Store', 'Household', 'User'];
  try {
    for (const table of tables) {
      execSync(`echo "DELETE FROM ${table};" | npx prisma db execute --stdin`, {
        cwd: serverDir,
        env: { ...process.env, DATABASE_URL: dbUrl },
        stdio: 'pipe',
      });
    }
  } catch (e: any) {
    console.error('[seed] Truncation FAILED:', e.stderr?.toString() || e.message);
    throw e;
  }
}

export async function seedPlaywrightFixtures(baseURL: string): Promise<TestAuth> {
  truncateAll();
  upsertTestUser();

  const token = makePlaywrightToken();
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
  const household = await hhRes.json();
  const householdId = household.id;

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
  const store = await storeRes.json();
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
  const section = await sectionRes.json();

  return { token, userId: TEST_USER_ID, householdId, storeId, sectionId: section.id };
}
