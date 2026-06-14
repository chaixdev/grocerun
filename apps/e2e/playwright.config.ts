import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,

  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  timeout: 30000,

  // Per ADR 008: Chromium only, no multi-browser.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Auto-start dev servers. In CI (playwright-nightly.yml), servers are
  // started separately. Locally, run `npm run dev` first, then e2e tests.
  // webServer: [
  //   {
  //     command: 'cd ../server && npm run start:dev',
  //     url: 'http://localhost:3001/health',
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 30000,
  //   },
  //   {
  //     command: 'cd ../web && npm run dev',
  //     url: 'http://localhost:3000',
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 30000,
  //   },
  // ],
});
