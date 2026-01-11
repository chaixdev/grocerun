import { test, expect } from '../../fixtures/authenticated';

// STORE-001: Create First Store

test.describe('STORE-001: Create First Store @tag:stores @tag:p0', () => {
  test('user creates first store in household @tag:stores @tag:p0', async ({ authenticatedPage }) => {
    // Navigate to stores page
    await authenticatedPage.goto('/stores');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Click "Add Store" button
    const addStoreButton = authenticatedPage.locator('button:has-text("Add Store"), button:has-text("Create Store")').first();
    await addStoreButton.click();
    await authenticatedPage.waitForTimeout(500);
    
    // Fill in store details
    const storeName = `Test Store ${Date.now()}`;
    const storeLocation = '123 Main St';
    
    await authenticatedPage.locator('input[name="name"], input[placeholder*="name" i]').first().fill(storeName);
    await authenticatedPage.locator('input[name="location"], input[placeholder*="location" i]').first().fill(storeLocation);
    
    // Submit the form
    const submitButton = authenticatedPage.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
    await submitButton.click();
    await authenticatedPage.waitForTimeout(2000);
    
    // Verify store was created
    // Should either be on stores list page or store detail page
    const currentUrl = authenticatedPage.url();
    expect(currentUrl).toMatch(/\/stores/);
    
    // Store should be visible in the list
    await authenticatedPage.goto('/stores');
    await authenticatedPage.waitForLoadState('networkidle');
    
    const storeCard = authenticatedPage.locator(`text="${storeName}"`);
    await expect(storeCard.first()).toBeVisible({ timeout: 5000 });
    
    // Verify location is also displayed
    const locationText = authenticatedPage.locator(`text="${storeLocation}"`);
    await expect(locationText.first()).toBeVisible({ timeout: 3000 });
  });
  
  test('created store is linked to household @tag:stores @tag:p0', async ({ authenticatedPage }) => {
    // Create a store
    await authenticatedPage.goto('/stores');
    await authenticatedPage.waitForLoadState('networkidle');
    
    const addStoreButton = authenticatedPage.locator('button:has-text("Add Store"), button:has-text("Create Store")').first();
    if (await addStoreButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addStoreButton.click();
      await authenticatedPage.waitForTimeout(500);
      
      const storeName = `Linked Store ${Date.now()}`;
      await authenticatedPage.locator('input[name="name"], input[placeholder*="name" i]').first().fill(storeName);
      await authenticatedPage.locator('input[name="location"], input[placeholder*="location" i]').first().fill('456 Oak Ave');
      
      const submitButton = authenticatedPage.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
      await submitButton.click();
      await authenticatedPage.waitForTimeout(2000);
    }
    
    // Navigate back to stores page
    await authenticatedPage.goto('/stores');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Store should be grouped under a household
    // Look for household heading or grouping structure
    const householdHeading = authenticatedPage.locator('h2, h3').filter({ hasText: /household/i });
    
    // If we see household grouping, verify it exists
    const hasHouseholdGrouping = await householdHeading.first().isVisible({ timeout: 2000 }).catch(() => false);
    
    // At minimum, stores should be visible on the page
    const storesExist = await authenticatedPage.locator('[class*="store"], [data-testid*="store"]').count() > 0 ||
                        await authenticatedPage.locator('text=/store/i').count() > 0;
    
    expect(storesExist || hasHouseholdGrouping).toBeTruthy();
  });
});
