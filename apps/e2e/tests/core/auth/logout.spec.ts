import { test, expect } from '../../fixtures/authenticated';

// AUTH-004: Logout

test.describe('AUTH-004: Logout @tag:auth @tag:p1', () => {
  test('user can log out successfully @tag:auth @tag:p1', async ({ authenticatedPage }) => {
    // Navigate to settings page
    await authenticatedPage.goto('/settings');
    await expect(authenticatedPage).toHaveURL(/\/settings/);

    // Click logout button
    const logoutButton = authenticatedPage.getByRole('button', { name: /log out|sign out/i });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Should be redirected to login page
    await expect(authenticatedPage).toHaveURL(/\/login/);
    await expect(authenticatedPage.getByRole('heading', { name: /login/i })).toBeVisible();

    // Should see sign-in option
    await expect(authenticatedPage.getByRole('button', { name: /sign in with google/i })).toBeVisible();
  });

  test('cannot access protected routes after logout @tag:auth @tag:p1', async ({ authenticatedPage }) => {
    // Log in and navigate to stores
    await authenticatedPage.goto('/stores');
    await expect(authenticatedPage).toHaveURL(/\/stores/);

    // Go to settings and log out
    await authenticatedPage.goto('/settings');
    const logoutButton = authenticatedPage.getByRole('button', { name: /log out|sign out/i });
    await logoutButton.click();

    // Should be on login page
    await expect(authenticatedPage).toHaveURL(/\/login/);

    // Try to access protected route
    await authenticatedPage.goto('/stores');

    // Should be redirected back to login
    await expect(authenticatedPage).toHaveURL(/\/login/);
    await expect(authenticatedPage.getByRole('heading', { name: /login/i })).toBeVisible();
  });
});
