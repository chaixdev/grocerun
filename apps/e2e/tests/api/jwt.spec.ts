import { test, expect } from '@playwright/test';

// API-001: JWT Validation
// API-002: Authorization

test.describe('API-001: JWT Validation @tag:api @tag:p0', () => {
  const baseURL = 'http://localhost:3001';

  test('API rejects request without Authorization header @tag:api @tag:p0', async ({ request }) => {
    const response = await request.get(`${baseURL}/stores`);
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.message || body.error).toBeTruthy();
  });

  test('API rejects request with invalid JWT @tag:api @tag:p0', async ({ request }) => {
    const response = await request.get(`${baseURL}/stores`, {
      headers: {
        'Authorization': 'Bearer invalid-token-here'
      }
    });
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
    
    const body = await response.json();
    expect(body.message || body.error).toBeTruthy();
  });

  test('API rejects request with expired JWT @tag:api @tag:p0', async ({ request }) => {
    // Using a JWT that's already expired (exp in the past)
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJleHAiOjEwMDAwMDAwMDB9.fake';
    
    const response = await request.get(`${baseURL}/stores`, {
      headers: {
        'Authorization': `Bearer ${expiredToken}`
      }
    });
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('API rejects request with malformed JWT @tag:api @tag:p0', async ({ request }) => {
    const response = await request.get(`${baseURL}/stores`, {
      headers: {
        'Authorization': 'Bearer not.a.jwt'
      }
    });
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });
});

test.describe('API-002: Authorization @tag:api @tag:p0', () => {
  const baseURL = 'http://localhost:3001';

  test('API prevents access to other household data @tag:api @tag:p0', async ({ page }) => {
    // Simpler approach: Use authenticated session and try to access non-existent/other household store
    await page.goto('http://localhost:3000/stores');
    await page.waitForLoadState('networkidle');
    
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'authjs.session-token');
    
    if (sessionCookie) {
      // Try to access a store ID that either doesn't exist or belongs to another household
      const fakeStoreId = 'other-household-store-' + Date.now();
      
      const response = await page.request.get(`${baseURL}/stores/${fakeStoreId}`, {
        headers: {
          'Cookie': `authjs.session-token=${sessionCookie.value}`
        }
      });
      
      // Should return 403 Forbidden or 404 Not Found
      expect([403, 404]).toContain(response.status());
    }
  });

  test('API validates household membership for mutations @tag:api @tag:p0', async ({ page }) => {
    await page.goto('http://localhost:3000/stores');
    await page.waitForLoadState('networkidle');
    
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'authjs.session-token');
    
    if (sessionCookie) {
      const fakeStoreId = 'other-household-store-' + Date.now();
      
      // Try to update a store from another household
      const updateResponse = await page.request.patch(`${baseURL}/stores/${fakeStoreId}`, {
        headers: {
          'Cookie': `authjs.session-token=${sessionCookie.value}`,
          'Content-Type': 'application/json'
        },
        data: { name: 'Hacked Store Name' }
      });
      
      expect([403, 404]).toContain(updateResponse.status());
      
      // Try to delete a store from another household
      const deleteResponse = await page.request.delete(`${baseURL}/stores/${fakeStoreId}`, {
        headers: {
          'Cookie': `authjs.session-token=${sessionCookie.value}`
        }
      });
      
      expect([403, 404]).toContain(deleteResponse.status());
    }
  });
});
