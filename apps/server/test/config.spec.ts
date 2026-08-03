import { describe, it, expect } from 'vitest';
import { envSchema, formatEnvIssues } from '../src/config';

// ---------------------------------------------------------------------------
// Config schema — unit tests
//
// Tests the Zod schema and the boot-time error formatter hermetically by
// passing plain objects to envSchema.safeParse/parse (never touching
// process.env). Under Vitest NODE_ENV=test, so the module-level parse of
// config.ts runs cleanly on import.
// ---------------------------------------------------------------------------

describe('envSchema', () => {
  it('applies defaults for a minimal valid env', () => {
    const parsed = envSchema.parse({ NODE_ENV: 'test' });

    expect(parsed.NODE_ENV).toBe('test');
    expect(parsed.PORT).toBe(3001);
    expect(parsed.DATABASE_URL).toBe('file:dev.db');
    expect(parsed.WEB_URL).toBe('http://localhost:3000');
    expect(parsed.APP_VERSION).toBe('dev');
    expect(parsed.OIDC_ISSUER_URI).toBe('https://accounts.google.com');
    expect(parsed.OIDC_PROVIDER).toBe('google');
    expect(parsed.DB_DRIVER).toBe('sqlite');
    expect(parsed.STORAGE_DRIVER).toBe('local');
  });

  it('coerces string PORT to a number', () => {
    const parsed = envSchema.parse({ NODE_ENV: 'test', PORT: '4000' });
    expect(parsed.PORT).toBe(4000);
  });

  it('rejects a non-numeric PORT', () => {
    const result = envSchema.safeParse({ NODE_ENV: 'test', PORT: 'abc' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'PORT')).toBe(true);
    }
  });

  it('rejects an invalid NODE_ENV', () => {
    const result = envSchema.safeParse({ NODE_ENV: 'staging' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'NODE_ENV')).toBe(true);
    }
  });

  it('rejects an invalid STORAGE_DRIVER', () => {
    const result = envSchema.safeParse({ NODE_ENV: 'test', STORAGE_DRIVER: 'gcs' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'STORAGE_DRIVER')).toBe(
        true,
      );
    }
  });

  it('requires OIDC_AUDIENCE outside NODE_ENV=test', () => {
    const result = envSchema.safeParse({ NODE_ENV: 'prod' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const audienceIssue = result.error.issues.find(
        (issue) => issue.path.join('.') === 'OIDC_AUDIENCE',
      );
      expect(audienceIssue?.message).toBe('is required when NODE_ENV is not "test"');
    }
  });

  it('accepts an explicit OIDC_AUDIENCE in non-test envs', () => {
    const result = envSchema.safeParse({ NODE_ENV: 'prod', OIDC_AUDIENCE: 'client-id' });
    expect(result.success).toBe(true);
  });

  it('exempts NODE_ENV=test from the OIDC_AUDIENCE requirement', () => {
    const result = envSchema.safeParse({ NODE_ENV: 'test' });
    expect(result.success).toBe(true);
  });
});

describe('formatEnvIssues', () => {
  it('renders field name and message per line', () => {
    const result = envSchema.safeParse({ NODE_ENV: 'prod' });
    expect(result.success).toBe(false);
    if (result.success) return;

    const formatted = formatEnvIssues(result.error);
    expect(formatted).toMatch(/ {2}- OIDC_AUDIENCE: is required when NODE_ENV is not "test"/);
    expect(formatted).not.toContain('undefined');
  });

  it('renders multiple issues as separate lines', () => {
    const result = envSchema.safeParse({ NODE_ENV: 'staging', PORT: 'abc' });
    expect(result.success).toBe(false);
    if (result.success) return;

    const lines = formatEnvIssues(result.error).split('\n');
    expect(lines.some((line) => line.startsWith('  - NODE_ENV:'))).toBe(true);
    expect(lines.some((line) => line.startsWith('  - PORT:'))).toBe(true);
  });
});
