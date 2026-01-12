import { test, expect } from '@playwright/test';

// AUTH-006: Protected Route Access

test.describe('AUTH-006: Protected Route Access @tag:auth @tag:p0', () => {
  // Clear any existing session for these tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test('unauthenticated user redirected from /stores @tag:auth @tag:p0', async ({ page }) => {
    await page.goto('/stores');

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });

  test('unauthenticated user redirected from /lists @tag:auth @tag:p0', async ({ page }) => {
    await page.goto('/lists');

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });

  test('unauthenticated user redirected from /settings @tag:auth @tag:p0', async ({ page }) => {
    await page.goto('/settings');

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });

  test('login page is accessible without authentication @tag:auth @tag:p0', async ({ page }) => {
    await page.goto('/login');

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
  });
});
