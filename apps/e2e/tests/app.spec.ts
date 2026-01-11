import { test, expect } from '@playwright/test';

test.describe('App smoke tests', () => {
  test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    // Adjust this based on the actual application title
    await expect(page).toHaveTitle(/Grocerun|GroceRun|Sign in/i);
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');
    
    // Should see Google sign-in option
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
  });
});
