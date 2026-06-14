import { execSync } from 'child_process';
import * as path from 'path';

async function globalSetup() {
  const serverAppDir = path.resolve(__dirname, '../server');

  // Run migrations (creates test.db if it doesn't exist) without deleting
  // the file first. This avoids breaking the server's live Prisma connection.
  // Tables are truncated in the test seed instead.
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
