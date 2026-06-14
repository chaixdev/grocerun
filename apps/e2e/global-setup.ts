import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import * as path from 'path';

function removeIfExists(filePath: string) {
  if (existsSync(filePath)) {
    rmSync(filePath, { force: true });
  }
}

async function globalSetup() {
  // The server app owns migrations; point Prisma at apps/server for migrate deploy.
  const serverAppDir = path.resolve(__dirname, '../server');
  const testDbPath = path.resolve(serverAppDir, 'test.db');

  // Clean up any existing DB + SQLite sidecar files.
  removeIfExists(testDbPath);
  removeIfExists(`${testDbPath}-journal`);
  removeIfExists(`${testDbPath}-wal`);
  removeIfExists(`${testDbPath}-shm`);

  // Recreate schema via migrations (apps/server owns the Prisma schema and migrations).
  execSync('npx prisma migrate deploy', {
    cwd: serverAppDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./test.db',
    },
  });
}

export default globalSetup;
