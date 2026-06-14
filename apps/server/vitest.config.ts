import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    globalSetup: ['test/setup.ts'],
    // Give integration tests enough headroom — NestJS bootstrap + SQLite migrations.
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run test files serially. Integration tests share a single test.db;
    // parallel file execution would cause SQLite lock contention and cross-test
    // data contamination between NestJS app instances.
    pool: 'forks',
    singleFork: true,
    fileParallelism: false,
  },
});
