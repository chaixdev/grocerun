import { Page, BrowserContext } from '@playwright/test';
import { createTestSession } from './create-session';

/**
 * Injects a test session cookie into a Playwright page/context
 * This bypasses OAuth and logs the user in directly
 * 
 * @param page - Playwright Page or BrowserContext
 * @param userId - User ID
 * @param email - User email
 * @param name - User display name (optional)
 */
export async function loginAs(
  page: Page | BrowserContext,
  userId: string,
  email: string,
  name?: string
): Promise<void> {
  const sessionToken = await createTestSession(userId, email, name);
  
  // Get the context (works for both Page and BrowserContext)
  const context = 'context' in page ? page.context() : page;
  
  // Inject NextAuth v5 session cookie (uses authjs prefix)
  await context.addCookies([
    {
      name: 'authjs.session-token',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    },
  ]);
}

/**
 * Logs out by clearing session cookies
 */
export async function logout(page: Page): Promise<void> {
  await page.context().clearCookies();
}
