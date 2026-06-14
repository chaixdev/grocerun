import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

/**
 * Global setup - runs once before all tests
 */
async function globalSetup() {
  const testDbPath = join(__dirname, '../../server/test.db');
  
  // Remove existing test database
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
    console.log('🗑️  Removed existing test database');
  }
  
  // Create fresh test database with migrations
  try {
    console.log('🔨 Creating test database...');
    execSync('npx prisma migrate deploy', {
      cwd: join(__dirname, '../../server'),
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: 'file:./test.db' }
    });
    console.log('✅ Test database ready');
  } catch (error) {
    console.error('❌ Failed to create test database:', error);
    throw error;
  }
  
  // Start the test server with test database
  console.log('🚀 Starting test server on port 3001...');
  // Note: The server should be started separately with DATABASE_URL=file:./test.db
}

export default globalSetup;

/**
 * Database setup for E2E tests
 * Creates a fresh test database before tests run
 */
export async function setupTestDatabase() {
  const testDbPath = join(__dirname, '../../server/test.db');
  
  // Remove existing test database
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
  }
  
  // Create fresh test database with migrations
  try {
    execSync('npx prisma migrate deploy', {
      cwd: join(__dirname, '../../server'),
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: 'file:./test.db' }
    });
  } catch (error) {
    console.error('Failed to create test database:', error);
    throw error;
  }
}

/**
 * Tear down test database
 */
export async function teardownTestDatabase() {
  const testDbPath = join(__dirname, '../../server/test.db');
  
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath);
  }
}

/**
 * Reset database to clean state between tests
 */
export async function resetTestDatabase() {
  try {
    // Truncate all tables while preserving schema
    execSync('npx prisma migrate reset --force --skip-seed', {
      cwd: join(__dirname, '../../server'),
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: 'file:./test.db' }
    });
  } catch (error) {
    // If reset fails, recreate from scratch
    await setupTestDatabase();
  }
}
