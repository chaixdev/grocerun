import * as path from 'path';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

/**
 * Vitest globalSetup — runs once before all test suites.
 *
 * Vitest globalSetup exports named `setup` and optionally `teardown`,
 * unlike Jest which uses a default export.
 *
 * Responsibilities:
 *  1. Load .env.test so every module that reads process.env gets test values.
 *  2. Apply Prisma migrations to test.db so the schema is always up-to-date.
 */
export async function setup() {
  // 1. Load test env vars into the current process.
  const envPath = path.resolve(__dirname, '../.env.test');
  dotenv.config({ path: envPath });

  // 2. Ensure DATABASE_URL is set (CI may not have .env.test).
  //    SQLite is a file-based DB — CI can use it without any services.
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./test.db';
  }

  // 3. Run `prisma migrate deploy` against the test DB.
  //    `migrate deploy` applies pending migrations without prompting — safe for CI.
  //    It's a no-op if the DB is already up-to-date.
  const serverDir = path.resolve(__dirname, '..');
  execSync('npx prisma migrate deploy', {
    cwd: serverDir,
    env: { ...process.env },
    stdio: 'pipe',
  });
}
