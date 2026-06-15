# End-to-End Testing with Playwright

> **⚠️ Deprecation notice:** This document describes NextAuth v5 session injection, which no longer applies after the Vite SPA refactor replaced NextAuth with `oidc-spa` (Google-only OIDC). The `apps/e2e` session helper still imports `next-auth/jwt` and needs to be rewritten to use `oidc-spa` token injection. See `planning/tickets/google-only-auth-cleanup.md`. Until updated, treat this document as historical reference.

## Overview

This project uses Playwright for end-to-end testing. The test suite is located in `apps/e2e` and includes authentication session injection to bypass OAuth flows during testing.

## Architecture

### Session Injection Pattern

Instead of requiring real OAuth authentication during tests, we inject pre-signed session tokens that NextAuth v5 recognizes as valid. This allows us to:

- Test multi-user scenarios without managing multiple Google accounts
- Run tests in CI/CD without interactive authentication
- Speed up test execution by skipping OAuth roundtrips
- Maintain deterministic test data with known user IDs

### How It Works

1. **Test Helper Creates JWT**: Using NextAuth's `encode` function from `next-auth/jwt`, we create encrypted JWTs (JWE) with user credentials
2. **Cookie Injection**: The JWT is injected into the browser context as the `authjs.session-token` cookie
3. **Server Validates**: NextAuth v5 decrypts and validates the token using the shared `AUTH_SECRET`
4. **Test Proceeds**: The test runs as if the user had authenticated normally

**Critical Detail**: NextAuth v5 uses:
- Cookie name: `authjs.session-token` (not `next-auth.session-token` from v4)
- JWT salt: `authjs.session-token` (must match for encryption/decryption)

## Setup

### Prerequisites

- Node.js 20+
- Playwright browsers installed: `npx playwright install`
- Dev server running on `localhost:3000`

### Environment Configuration

Create `apps/e2e/.env.test`:

```bash
# Must match AUTH_SECRET in apps/web/.env
AUTH_SECRET=your-nextauth-secret-here
```

**Important**: The `AUTH_SECRET` must be identical between the web app and tests, or session validation will fail.

### Test User Database Requirements

Session injection requires real user IDs that exist in your database. Update `apps/e2e/fixtures/users.ts` with actual user IDs from your database:

```typescript
export const testUsers = {
  alice: {
    id: 'dev-user-1',           // Must exist in User table
    email: 'dev1@localhost',
    name: 'Dev User 1',
  },
  // ...
}
```

Query your database to get real user IDs:
```bash
cd apps/web
sqlite3 dev.db "SELECT id, email, name FROM User LIMIT 5;"
```

## Writing Tests

### Basic Authenticated Test

```typescript
import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/users';

test.use({ storageState: { cookies: [], origins: [] } });

test('user can view stores', async ({ page, loginAsUser }) => {
  // loginAsUser fixture handles session injection
  await loginAsUser(testUsers.alice.id, testUsers.alice.email, testUsers.alice.name);
  
  await page.goto('/stores');
  await expect(page).toHaveURL(/\/stores/);
});
```

### Multi-User Collaboration Test

```typescript
import { test } from '../fixtures/multi-user';
import { testUsers } from '../fixtures/users';

test('alice and bob can share a household', async ({ userA, userB }) => {
  // userA and userB are separate browser contexts with different sessions
  const alicePage = await userA.createPage(testUsers.alice);
  const bobPage = await userB.createPage(testUsers.bob);
  
  // Both users can now interact independently
  await alicePage.goto('/stores');
  await bobPage.goto('/stores');
  
  // Test collaborative features...
});
```

## Running Tests

```bash
cd apps/e2e

# Run all tests
npm test

# Run specific test file
npx playwright test tests/auth/authenticated.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in UI mode (interactive)
npm run test:ui

# Debug a test
npm run test:debug
```

## Implementation Details

### Session Token Creation

Location: `apps/e2e/helpers/create-session.ts`

```typescript
import { encode } from 'next-auth/jwt';

export async function createTestSession(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  const authSecret = process.env.AUTH_SECRET;
  const now = Math.floor(Date.now() / 1000);
  
  const token = {
    sub: userId,    // User ID - must exist in database
    email,
    name,
    iat: now,
    exp: now + 3600,
  };

  // Uses NextAuth v5's encryption with correct salt
  return await encode({
    token,
    secret: authSecret,
    salt: 'authjs.session-token',
  });
}
```

### Cookie Injection

Location: `apps/e2e/helpers/auth.ts`

```typescript
export async function loginAs(
  page: Page | BrowserContext,
  userId: string,
  email: string,
  name?: string
): Promise<void> {
  const sessionToken = await createTestSession(userId, email, name);
  const context = 'context' in page ? page.context() : page;
  
  await context.addCookies([{
    name: 'authjs.session-token',  // NextAuth v5 cookie name
    value: sessionToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    expires: Math.floor(Date.now() / 1000) + 3600,
  }]);
}
```

### Fixtures

**Single User** (`fixtures/authenticated.ts`):
```typescript
export const test = base.extend({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, testUsers.alice.id, testUsers.alice.email, testUsers.alice.name);
    await use(page);
    await context.close();
  },
});
```

**Multi-User** (`fixtures/multi-user.ts`):
```typescript
export const test = base.extend({
  userA: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use({
      createPage: async (user: TestUser) => {
        const page = await context.newPage();
        await loginAs(page, user.id, user.email, user.name);
        return page;
      }
    });
    await context.close();
  },
  userB: // similar setup for second user
});
```

## Troubleshooting

### Tests Redirect to /login

**Symptom**: Tests navigate to protected pages but get redirected to `/login`.

**Common Causes**:

1. **AUTH_SECRET Mismatch**
   ```bash
   # Check both files have identical values
   grep AUTH_SECRET apps/web/.env apps/e2e/.env.test
   ```

2. **Server Not Restarted After Env Change**
   - Next.js loads `AUTH_SECRET` at startup
   - After changing `.env`, restart: `npm run dev`

3. **Wrong Cookie Name**
   - NextAuth v4 uses `next-auth.session-token`
   - NextAuth v5 uses `authjs.session-token`
   - Verify your version: `grep "next-auth" apps/web/package.json`

4. **User Doesn't Exist in Database**
   ```bash
   cd apps/web
   sqlite3 dev.db "SELECT * FROM User WHERE id='dev-user-1';"
   ```

### Session API Returns null

**Debug Steps**:

1. Create a test that calls `/api/auth/session`:
   ```typescript
   const response = await page.goto('http://localhost:3000/api/auth/session');
   const session = await response?.json();
   console.log('Session:', session);
   ```

2. Check cookie is set:
   ```typescript
   const cookies = await page.context().cookies();
   console.log('Cookies:', cookies);
   ```

3. Verify the JWT can be decoded:
   ```typescript
   import { decode } from 'next-auth/jwt';
   const decoded = await decode({
     token: sessionToken,
     secret: process.env.AUTH_SECRET!,
     salt: 'authjs.session-token'
   });
   console.log('Decoded:', decoded);
   ```

## NextAuth v4 vs v5 Compatibility

This setup requires **NextAuth v5** (5.0.0-beta.30+) because:

- Next.js 16 is not compatible with NextAuth v4
- v4 only supports Next.js ≤14
- v5 uses different cookie naming (`authjs.*` prefix)
- v5 defaults to encrypted JWTs (JWE) vs v4's signed JWTs (JWS)

If you're on Next.js 14 or below, you could use v4 with:
- Cookie: `next-auth.session-token`
- Salt: `next-auth.session-token`
- Simple JWT signing with `jsonwebtoken` library (no encryption)

## Best Practices

1. **Keep AUTH_SECRET in sync**: Use the same secret in `.env` and `.env.test`
2. **Use real user IDs**: Don't rely on fake IDs that don't exist in the database
3. **Clean up contexts**: Always close browser contexts in tests to avoid leaks
4. **Isolate tests**: Each test should be independent and not rely on previous test state
5. **Seed data carefully**: Consider creating dedicated test users vs using dev/production data
6. **Version pin NextAuth**: Pin the exact beta version to avoid breaking changes

## Further Reading

- [NextAuth v5 Documentation](https://authjs.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [JWT RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)
- [Test Scenarios](../../wiki/planning/test-scenarios.md)
