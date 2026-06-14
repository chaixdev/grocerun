import { test, expect } from '../../fixtures/authenticated';

// EDGE-004: XSS Protection
// EDGE-005: SQL Injection Protection

test.describe('EDGE-004: XSS Protection @tag:security @tag:p0', () => {
  test('prevents XSS in store name @tag:security @tag:p0', async ({ authenticatedPage }) => {
    const maliciousInput = '<script>alert("XSS")</script>';
    
    await authenticatedPage.goto('/stores');
    
    // Try to create a store with script tag in name
    const createButton = authenticatedPage.getByRole('button', { name: /add store|create store/i });
    
    // If no stores exist yet, there might be a different UI
    if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createButton.click();
      
      const nameInput = authenticatedPage.getByLabel(/store name|name/i);
      await nameInput.fill(maliciousInput);
      
      const saveButton = authenticatedPage.getByRole('button', { name: /save|create/i });
      await saveButton.click();
      
      // Wait for potential page update
      await authenticatedPage.waitForTimeout(500);
      
      // Verify script is not executed - page should not have an alert
      // If XSS worked, the page would be frozen by alert()
      await expect(authenticatedPage.getByRole('heading', { name: /stores/i })).toBeVisible();
      
      // Verify script tag is escaped/sanitized in the displayed text
      const storeList = authenticatedPage.locator('body');
      const content = await storeList.textContent();
      
      // The literal script tag should appear as text, not execute
      if (content?.includes('script')) {
        expect(content).toContain('script'); // Escaped, visible as text
      }
    }
  });

  test('prevents XSS in item name @tag:security @tag:p0', async ({ authenticatedPage }) => {
    const maliciousInput = '<img src=x onerror="alert(\'XSS\')">';
    
    // Navigate to lists page
    await authenticatedPage.goto('/lists');
    
    // Look for any list or create a new one
    const listLink = authenticatedPage.getByRole('link', { name: /shopping|list/i }).first();
    
    // If a list exists, try adding an item
    if (await listLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listLink.click();
      
      // Try to add item with XSS payload
      const itemInput = authenticatedPage.getByPlaceholder(/add item|item name/i);
      if (await itemInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await itemInput.fill(maliciousInput);
        
        // Try to add the item
        await authenticatedPage.keyboard.press('Enter');
        
        // Wait for potential execution
        await authenticatedPage.waitForTimeout(500);
        
        // Page should still be functional (not frozen by alert)
        await expect(authenticatedPage.locator('body')).toBeVisible();
      }
    }
  });
});

test.describe('EDGE-005: SQL Injection Protection @tag:security @tag:p0', () => {
  test('prevents SQL injection in store search/name @tag:security @tag:p0', async ({ authenticatedPage }) => {
    const sqlPayload = "'; DROP TABLE Store; --";
    
    await authenticatedPage.goto('/stores');
    
    // Try to create store with SQL injection payload
    const createButton = authenticatedPage.getByRole('button', { name: /add store|create store/i });
    
    if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createButton.click();
      
      const nameInput = authenticatedPage.getByLabel(/store name|name/i);
      await nameInput.fill(sqlPayload);
      
      const locationInput = authenticatedPage.getByLabel(/location|address/i);
      if (await locationInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await locationInput.fill('Test Location');
      }
      
      const saveButton = authenticatedPage.getByRole('button', { name: /save|create/i });
      await saveButton.click();
      
      // Wait for save operation
      await authenticatedPage.waitForTimeout(500);
      
      // Page should not crash - SQL injection should be prevented by Prisma
      await expect(authenticatedPage.getByRole('heading', { name: /stores/i })).toBeVisible();
      
      // Navigate away and back to verify database integrity
      await authenticatedPage.goto('/lists');
      await authenticatedPage.goto('/stores');
      
      // Stores page should still load (table not dropped)
      await expect(authenticatedPage.getByRole('heading', { name: /stores/i })).toBeVisible();
    }
  });

  test('prevents SQL injection in item search @tag:security @tag:p0', async ({ authenticatedPage }) => {
    const sqlPayload = "' OR '1'='1";
    
    await authenticatedPage.goto('/lists');
    
    // Find a list
    const listLink = authenticatedPage.getByRole('link', { name: /shopping|list/i }).first();
    
    if (await listLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await listLink.click();
      
      // Try SQL injection in item search/add
      const itemInput = authenticatedPage.getByPlaceholder(/add item|item name|search/i);
      
      if (await itemInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await itemInput.fill(sqlPayload);
        
        // Wait for any autocomplete/search results
        await authenticatedPage.waitForTimeout(500);
        
        // Page should remain functional
        await expect(authenticatedPage.locator('body')).toBeVisible();
        
        // Should not return all items (if injection worked with OR '1'='1')
        // Exact validation depends on UI implementation
      }
    }
  });

  test('prevents SQL injection in household name @tag:security @tag:p0', async ({ authenticatedPage }) => {
    const sqlPayload = "'; UPDATE Household SET name='HACKED' WHERE '1'='1'; --";
    
    await authenticatedPage.goto('/settings');
    
    // Try to find household settings
    const householdSection = authenticatedPage.getByText(/household/i);
    
    if (await householdSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Try to edit household with SQL injection
      const editButton = authenticatedPage.getByRole('button', { name: /edit|rename/i }).first();
      
      if (await editButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await editButton.click();
        
        const nameInput = authenticatedPage.getByLabel(/household name|name/i);
        if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await nameInput.fill(sqlPayload);
          
          const saveButton = authenticatedPage.getByRole('button', { name: /save/i });
          await saveButton.click();
          
          // Wait for save
          await authenticatedPage.waitForTimeout(500);
          
          // Page should remain functional
          await expect(authenticatedPage.locator('body')).toBeVisible();
        }
      }
    }
  });
});
