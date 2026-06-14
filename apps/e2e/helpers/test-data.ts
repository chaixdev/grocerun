import { Page } from '@playwright/test';

/**
 * Helper to create a household via UI
 */
export async function createHousehold(page: Page, householdName: string): Promise<string | null> {
  await page.goto('/settings');
  
  // Look for create household button
  const createButton = page.getByRole('button', { name: /create household|add household/i });
  
  if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await createButton.click();
    
    const nameInput = page.getByLabel(/household name|name/i);
    await nameInput.fill(householdName);
    
    const saveButton = page.getByRole('button', { name: /create|save/i });
    await saveButton.click();
    
    // Wait for creation
    await page.waitForTimeout(1000);
    
    // Try to extract household ID from URL or page state
    // This might need adjustment based on actual UI
    return householdName; // Return name for now
  }
  
  return null;
}

/**
 * Helper to create a store in a household
 */
export async function createStore(
  page: Page,
  storeName: string,
  location: string = 'Test Location'
): Promise<string | null> {
  await page.goto('/stores');
  
  const createButton = page.getByRole('button', { name: /add store|create store/i });
  
  if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await createButton.click();
    
    const nameInput = page.getByLabel(/store name|name/i);
    await nameInput.fill(storeName);
    
    const locationInput = page.getByLabel(/location|address/i);
    if (await locationInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await locationInput.fill(location);
    }
    
    const saveButton = page.getByRole('button', { name: /save|create/i });
    await saveButton.click();
    
    // Wait for creation
    await page.waitForTimeout(1000);
    
    // Try to extract store ID from URL if redirected
    const url = page.url();
    const match = url.match(/\/stores\/([^\/]+)/);
    return match ? match[1] : storeName;
  }
  
  return null;
}

/**
 * Helper to create and join via invitation
 */
export async function createAndJoinViaInvitation(
  inviterPage: Page,
  joinerPage: Page
): Promise<string | null> {
  await inviterPage.goto('/settings');
  
  // Create invitation
  const inviteButton = inviterPage.getByRole('button', { name: /invite|create invitation/i });
  
  if (await inviteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await inviteButton.click();
    
    // Wait for invitation to be created
    await inviterPage.waitForTimeout(1000);
    
    // Get invitation link/token
    const inviteLink = inviterPage.getByTestId('invitation-link');
    const link = await inviteLink.textContent({ timeout: 2000 }).catch(() => null);
    
    if (link) {
      // Joiner uses the link
      await joinerPage.goto(link);
      
      const joinButton = joinerPage.getByRole('button', { name: /join|accept/i });
      if (await joinButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await joinButton.click();
        await joinerPage.waitForTimeout(1000);
        return link;
      }
    }
  }
  
  return null;
}

/**
 * Get store ID from page URL or element
 */
export async function getStoreIdFromPage(page: Page): Promise<string | null> {
  const url = page.url();
  const match = url.match(/\/stores\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}
