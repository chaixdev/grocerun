import { test, expect } from '../../../fixtures/authenticated';
import { testUsers } from '../../../fixtures/users';

const validUser = testUsers.alice;

// AUTH-001: Valid login flow
// AUTH-002: Invalid login handling

test.describe('AUTH-001: User Login @tag:auth @tag:p0', () => {
  test('redirects to dashboard after valid session @tag:auth @tag:p0', async ({ authenticatedPage }) => {
    // Session injected via fixture; navigating to protected route should succeed
    await authenticatedPage.goto('/stores');

    await expect(authenticatedPage).toHaveURL(/\/stores/);
    await expect(authenticatedPage.getByRole('heading', { name: /stores/i })).toBeVisible();

    // Verify user is logged in - check for Settings link in sidebar/nav
    const settingsLink = authenticatedPage.getByRole('link', { name: /settings/i }).first();
    await expect(settingsLink).toBeVisible();
  });
});

test.describe('AUTH-002: Invalid Login @tag:auth @tag:p0', () => {
  test('rejects invalid session token and stays on login @tag:auth @tag:p0', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'authjs.session-token',
        value: 'invalid-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        expires: Math.floor(Date.now() / 1000) + 300,
      },
    ]);

    await page.goto('/stores');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
  });
});
