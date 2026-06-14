import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import * as path from 'path';

function removeIfExists(filePath: string) {
  if (existsSync(filePath)) {
    rmSync(filePath, { force: true });
  }
}

async function globalSetup() {
  // Both web and server are configured (via playwright.config.ts webServer) to point at
  // the same SQLite file under apps/web.
  const webAppDir = path.resolve(__dirname, '../web');
  const testDbPath = path.resolve(webAppDir, 'test.db');

  // Clean up any existing DB + SQLite sidecar files.
  removeIfExists(testDbPath);
  removeIfExists(`${testDbPath}-journal`);
  removeIfExists(`${testDbPath}-wal`);
  removeIfExists(`${testDbPath}-shm`);

  // Recreate schema via migrations (apps/web is the package that owns migrations).
  execSync('npx prisma migrate deploy', {
    cwd: webAppDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./test.db',
    },
  });
}

export default globalSetup;
