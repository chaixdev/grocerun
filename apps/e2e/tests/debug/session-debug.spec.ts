import { test, expect } from '@playwright/test';
import { loginAs } from '../../helpers/auth';
import { testUsers } from '../../fixtures/users';

/**
 * Debug test to verify session injection is working
 */
test.describe('Session Injection Debug', () => {
  test('verify session cookie is set', async ({ page }) => {
    // Login
    await loginAs(page, testUsers.alice.id, testUsers.alice.email);
    
    // Navigate to a page
    await page.goto('/');
    
    // Check cookies
    const cookies = await page.context().cookies();
    console.log('All cookies:', cookies);
    
    const sessionCookie = cookies.find(c => c.name.includes('auth') || c.name.includes('session'));
    console.log('Session cookie:', sessionCookie);
    
    expect(sessionCookie).toBeDefined();
  });

  test('check what page we land on when authenticated', async ({ page }) => {
    await loginAs(page, testUsers.alice.id, testUsers.alice.email);
    
    await page.goto('/');
    
    // Wait a bit and see where we end up
    await page.waitForTimeout(2000);
    
    const url = page.url();
    console.log('Final URL:', url);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/auth-debug.png', fullPage: true });
  });
});
