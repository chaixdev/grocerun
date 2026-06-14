/**
 * Smoke tests — verify the app loads and login page renders.
 *
 * No auth seeding required. When unauthenticated, the app redirects
 * to Google OAuth; the local /login page is only reachable by direct
 * navigation (users can manually go there to sign in).
 */
import { test, expect } from '@playwright/test';

test.describe('App smoke', () => {
  test('login page renders heading', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Login' }))
      .toBeVisible({ timeout: 10000 });
  });

  test('login page renders Sign in with Google button', async ({ page }) => {
    await page.goto('/login');
    const btn = page.getByRole('button', { name: 'Sign in with Google' });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('app loads at root without crashing', async ({ page }) => {
    // Unauthenticated root triggers Google OAuth redirect.
    // The app shell should still render something (not crash/white-screen).
    await page.goto('/');
    // Either stays on localhost (loading) or redirects to Google.
    // Just verify the page isn't blank.
    await expect(page.locator('body')).not.toBeEmpty({ timeout: 5000 });
  });
});
