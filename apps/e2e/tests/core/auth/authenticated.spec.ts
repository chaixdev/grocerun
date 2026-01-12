import { test, expect } from '../../fixtures/authenticated';
import { testUsers } from '../../fixtures/users';

test.describe('Authenticated user flows', () => {
  test('authenticated user can access stores page', async ({ authenticatedPage }) => {
    // User is already logged in via fixture
    await authenticatedPage.goto('/stores');
    
    // Should be on stores page, not redirected to login
    await expect(authenticatedPage).toHaveURL(/\/stores/);
    
    // Should see stores UI (adjust selector based on actual UI)
    // This is just a placeholder - update when you know the actual page structure
    await expect(authenticatedPage.locator('body')).toContainText(/stores|household/i);
  });

  test('authenticated user can access lists page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/lists');
    
    // Should be on lists page
    await expect(authenticatedPage).toHaveURL(/\/lists/);
  });

  test('can login as different users', async ({ loginAsUser }) => {
    // Create pages for different users
    const alicePage = await loginAsUser(testUsers.alice);
    const bobPage = await loginAsUser(testUsers.bob);
    
    // Both can access the app
    await alicePage.goto('/stores');
    await bobPage.goto('/stores');
    
    await expect(alicePage).toHaveURL(/\/stores/);
    await expect(bobPage).toHaveURL(/\/stores/);
    
    // Cleanup
    await alicePage.close();
    await bobPage.close();
  });
});
