import { test, expect } from '../../../fixtures/with-store';
import { createList } from '../../../helpers/list-helpers';

// LIST-001: Create Shopping List

test.describe('LIST-001: Create Shopping List @tag:lists @tag:p0', () => {
  test('can create list for store @tag:lists @tag:p0', async ({ authenticatedPage, store }) => {
    // Fixture provided: authenticated user, household, store
    // Test proves: createList() helper works correctly
    
    const list = await createList(authenticatedPage, store.id);
    
    // Verify list was created
    expect(list.id).toBeTruthy();
    expect(list.storeId).toBe(store.id);
    
    // Verify we're on the list page
    const currentUrl = authenticatedPage.url();
    expect(currentUrl).toMatch(/\/lists\/.+/);
  });
});
