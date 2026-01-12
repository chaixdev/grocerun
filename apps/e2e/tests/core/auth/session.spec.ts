import { test, expect } from '../../fixtures/authenticated';

// AUTH-003: Session Persistence

test.describe('AUTH-003: Session Persistence @tag:auth @tag:p1', () => {
  test('user session persists across page refreshes @tag:auth @tag:p1', async ({ authenticatedPage }) => {
    // Navigate to stores page
    await authenticatedPage.goto('/stores');
    await expect(authenticatedPage).toHaveURL(/\/stores/);
    await expect(authenticatedPage.getByRole('heading', { name: /stores/i })).toBeVisible();

    // Verify user is logged in
    const settingsLink = authenticatedPage.getByRole('link', { name: /settings/i }).first();
    await expect(settingsLink).toBeVisible();

    // Refresh the page
    await authenticatedPage.reload();

    // Should still be on stores page, not redirected to login
    await expect(authenticatedPage).toHaveURL(/\/stores/);
    await expect(authenticatedPage.getByRole('heading', { name: /stores/i })).toBeVisible();
    
    // User should still be logged in after refresh
    await expect(settingsLink).toBeVisible();
  });

  test('session persists when navigating between pages @tag:auth @tag:p1', async ({ authenticatedPage }) => {
    // Start on stores page
    await authenticatedPage.goto('/stores');
    await expect(authenticatedPage).toHaveURL(/\/stores/);

    // Navigate to lists page
    await authenticatedPage.goto('/lists');
    await expect(authenticatedPage).toHaveURL(/\/lists/);
    await expect(authenticatedPage.getByRole('heading', { name: /lists/i })).toBeVisible();

    // Navigate back to stores
    await authenticatedPage.goto('/stores');
    await expect(authenticatedPage).toHaveURL(/\/stores/);
    await expect(authenticatedPage.getByRole('heading', { name: /stores/i })).toBeVisible();

    // Session should remain intact throughout navigation
    const settingsLink = authenticatedPage.getByRole('link', { name: /settings/i }).first();
    await expect(settingsLink).toBeVisible();
  });
});
