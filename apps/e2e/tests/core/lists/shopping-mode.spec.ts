import { test, expect } from '../../../fixtures/with-items';
import { startShopping, checkOffItem, completeShopping, verifyShoppingModeActive } from '../../../helpers/shopping-helpers';

// LIST-006: Transition to Shopping Mode
// LIST-007: Check Off Item in Shopping Mode
// LIST-010: Complete Shopping Session

test.describe('LIST-006: Transition to Shopping Mode @tag:lists @tag:p0', () => {
  test('can start shopping mode @tag:shopping @tag:lists @tag:p0', async ({ authenticatedPage, list, items }) => {
    // Fixture provided: authenticated user, household, store, list with items
    // Test proves: startShopping() helper works correctly
    
    await startShopping(authenticatedPage);
    
    // Verify shopping mode is active
    await verifyShoppingModeActive(authenticatedPage);
    
    // Verify items are visible with checkboxes
    for (const item of items) {
      const itemElement = authenticatedPage.locator(`text="${item.name}"`);
      await expect(itemElement.first()).toBeVisible();
    }
  });
});

test.describe('LIST-007: Check Off Item in Shopping Mode @tag:shopping @tag:lists @tag:p0', () => {
  test('can check off items during shopping @tag:shopping @tag:lists @tag:p0', async ({ authenticatedPage, list, items }) => {
    // Fixture provided: list with items
    // Test proves: checkOffItem() helper works correctly
    
    // Start shopping mode
    await startShopping(authenticatedPage);
    
    // Check off first item
    const firstItem = items[0];
    await checkOffItem(authenticatedPage, firstItem.name);
    
    // Verify item is checked — the Radix Checkbox uses role="checkbox" + data-state
    const testId = `list-item-row-${firstItem.name.toLowerCase().replace(/\s+/g, '-')}`;
    const itemRow = authenticatedPage.locator(`[data-testid="${testId}"]`);
    const checkbox = itemRow.locator('[role="checkbox"]').first();
    await expect(checkbox).toHaveAttribute('data-state', 'checked');
  });
});

test.describe('LIST-010: Complete Shopping Session @tag:shopping @tag:lists @tag:p0', () => {
  test('can complete shopping session @tag:shopping @tag:lists @tag:p0', async ({ authenticatedPage, list, items }) => {
    // Fixture provided: list with items
    // Test proves: completeShopping() helper works correctly
    
    // Start shopping mode
    await startShopping(authenticatedPage);
    
    // Check off all items
    for (const item of items) {
      await checkOffItem(authenticatedPage, item.name);
    }
    
    // Complete shopping
    await completeShopping(authenticatedPage);
    
    // Verify redirect to stores or list page
    const currentUrl = authenticatedPage.url();
    expect(currentUrl).toMatch(/\/(stores|lists)\/.*/);
  });
});
