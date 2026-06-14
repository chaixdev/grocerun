import { test, expect } from '../../fixtures/multi-user';

test.describe('Multi-user household collaboration', () => {
  test('two users can access the app simultaneously', async ({ userA, userB }) => {
    // Both users navigate to stores
    await userA.goto('/stores');
    await userB.goto('/stores');
    
    // Both should be authenticated and on the stores page
    await expect(userA).toHaveURL(/\/stores/);
    await expect(userB).toHaveURL(/\/stores/);
  });

  test.skip('users in same household see shared lists', async ({ userA, userB }) => {
    // TODO: Implement when household creation is ready
    // This test demonstrates the pattern for multi-user interaction
    
    // User A creates a household
    await userA.goto('/households');
    await userA.getByRole('button', { name: /create household/i }).click();
    // ... get invitation link
    
    // User B joins household
    // ... use invitation link
    
    // User A creates a list
    await userA.goto('/lists');
    // ... create list
    
    // User B should see the list
    await userB.goto('/lists');
    // ... verify list is visible
  });

  test.skip('concurrent edits to shopping list', async ({ userA, userB }) => {
    // TODO: Implement when list editing is ready
    // This demonstrates testing race conditions and real-time updates
    
    // Both users open same list
    await userA.goto('/lists/test-list-id');
    await userB.goto('/lists/test-list-id');
    
    // User A adds item
    await userA.getByRole('button', { name: /add item/i }).click();
    await userA.getByLabel(/item name/i).fill('Milk');
    await userA.getByRole('button', { name: /save/i }).click();
    
    // User B should see the item (after refresh or via WebSocket)
    await userB.reload();
    await expect(userB.getByText('Milk')).toBeVisible();
    
    // User B checks it off
    await userB.getByLabel(/milk/i).check();
    
    // User A should see it checked
    await userA.reload();
    await expect(userA.getByLabel(/milk/i)).toBeChecked();
  });
});
