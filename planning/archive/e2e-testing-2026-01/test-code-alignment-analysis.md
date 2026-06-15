# Test Code Alignment Analysis

**Date:** January 12, 2026  
**Purpose:** Analyze existing Playwright tests against our fixture-based testing philosophy

---

## Summary

### ✅ What Aligns

1. **Base fixtures exist** - `authenticated`, `multiUser` fixtures working
2. **Proper test isolation** - Tests use `test.describe` blocks
3. **Good tagging** - Tests use `@tag:` for filtering
4. **Multi-user support** - Collaboration tests use proper fixtures

### ⚠️ What Needs Improvement

1. **Missing fixture hierarchy** - No `withHousehold`, `withStore`, `withList` fixtures
2. **Inline setup in tests** - Tests create their own prerequisites instead of using fixtures
3. **Test interdependence** - Tests assume state from previous tests (serial execution)
4. **No helper extraction** - Setup logic duplicated across tests
5. **Wrong test organization** - Tests in domain folders, not core/integration/journeys

---

## Detailed Analysis

### 1. Existing Fixtures ✅

**File:** `apps/e2e/fixtures/authenticated.ts`

```typescript
export const test = base.extend<AuthenticatedFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await loginAs(page, testUsers.alice.id, testUsers.alice.email, testUsers.alice.name);
    await use(page);
  },
});
```

**Status:** ✅ Good - Provides base authentication
**Alignment:** Perfect - This is exactly what we need for the base level

---

**File:** `apps/e2e/fixtures/multi-user.ts`

```typescript
export const test = base.extend<MultiUserFixtures>({
  userA: async ({ contextA }, use) => { ... },
  userB: async ({ contextB }, use) => { ... },
});
```

**Status:** ✅ Good - Supports collaboration tests
**Alignment:** Perfect - Used correctly in authorization tests

---

### 2. Missing Fixtures ⏭️

Based on our fixture analysis, we need to create:

#### **Priority 1: `withHousehold`**

**Current State:** Tests assume household exists (from authenticated user)
**Problem:** Household creation logic buried in onboarding tests
**Solution:** Extract to fixture

```typescript
// apps/e2e/fixtures/with-household.ts (TO CREATE)
import { test as base } from './authenticated';

export const withHousehold = base.extend({
  household: async ({ authenticatedPage }, use) => {
    // Ensure user has household (might already exist from dev setup)
    await authenticatedPage.goto('/stores');
    
    // If no household exists, create one
    const hasHousehold = await checkForHousehold(authenticatedPage);
    if (!hasHousehold) {
      await createHousehold(authenticatedPage, 'Test Household');
    }
    
    const household = await getHousehold(authenticatedPage);
    await use(household);
  },
});
```

**Used by:** All store, list, item tests

---

#### **Priority 2: `withStore`**

**Current State:** STORE-001 test creates store inline
**Problem:** Every test creating stores duplicates this logic

```typescript
// Current (duplicated in many tests):
const addStoreButton = authenticatedPage.locator('button:has-text("Add Store")');
await addStoreButton.click();
await authenticatedPage.locator('input[name="name"]').fill(storeName);
await authenticatedPage.locator('input[name="location"]').fill(location);
await submitButton.click();
```

**Solution:** Create fixture using the createStore() helper

```typescript
// apps/e2e/fixtures/with-store.ts (TO CREATE)
import { withHousehold } from './with-household';
import { createStore } from '../helpers/store-helpers'; // TO CREATE

export const withStore = withHousehold.extend({
  store: async ({ authenticatedPage, household }, use) => {
    const store = await createStore(authenticatedPage, `Test Store ${Date.now()}`);
    await use(store);
    // Optional: cleanup store after test
  },
});
```

**Used by:** All list, item tests

---

#### **Priority 3: `withList`**

**Current State:** LIST-001 navigates to store and creates list
**Problem:** Tests doing this repeatedly:

```typescript
// Current (LIST-003, ITEM-001, LIST-006 all do this):
await authenticatedPage.goto('/stores');
const startListButton = authenticatedPage.locator('button:has-text("Start Shopping List")');
await startListButton.click();
await authenticatedPage.waitForTimeout(3000);
```

**Solution:** Create fixture

```typescript
// apps/e2e/fixtures/with-list.ts (TO CREATE)
import { withStore } from './with-store';
import { createList } from '../helpers/list-helpers'; // TO CREATE

export const withList = withStore.extend({
  list: async ({ authenticatedPage, store }, use) => {
    const list = await createList(authenticatedPage, store.id);
    await use(list);
  },
});
```

**Used by:** All item, shopping mode tests

---

### 3. Test Code Issues

#### **Issue 1: Inline Setup Instead of Fixtures**

**File:** `tests/lists/list-creation.spec.ts`

```typescript
// ❌ BAD: Test creates store inline
test('navigate to store and access list', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/stores');
  
  let hasButton = await startListButton.isVisible().catch(() => false);
  
  if (!hasButton) {
    // Creating store inline - should use fixture!
    const addStoreButton = authenticatedPage.locator('button:has-text("Add")');
    await addStoreButton.click();
    // ... 10 more lines of store creation
  }
  
  // Actual test behavior buried at the end
  await startListButton.click();
});
```

**Problem:**
- Mixing ARRANGE (store creation) with ACT (list creation)
- Test title says "access list" but spends 80% creating a store
- Logic duplicated across multiple tests

**Solution:**

```typescript
// ✅ GOOD: Use fixture for prerequisites
import { withStore } from '@/fixtures/with-store';

withStore('can create list for store', async ({ authenticatedPage, store }) => {
  // Fixture provided: user, household, store
  // Test focuses on: creating list
  await authenticatedPage.goto(`/stores/${store.id}`);
  await authenticatedPage.locator('button:has-text("Start Shopping List")').click();
  
  await expect(authenticatedPage).toHaveURL(/\/lists\/.+/);
});
```

---

#### **Issue 2: Test Interdependence**

**File:** `tests/lists/shopping-mode.spec.ts`

```typescript
// ❌ BAD: Assumes items exist
test('transition list to shopping mode', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/stores');
  const startListButton = authenticatedPage.locator('button:has-text("Go To List")');
  await startListButton.click();
  
  // If list is empty, add items - but this assumes list exists!
  const hasInput = await addItemInput.isVisible();
  if (hasInput) {
    // Adding items inline...
  }
  
  // Test actual behavior
  const startShoppingButton = authenticatedPage.locator('button:has-text("Go Shopping")');
  await startShoppingButton.click();
});
```

**Problem:**
- Test assumes list already exists (from previous test?)
- Conditionally adds items if needed
- Unclear what state the test starts in

**Solution:**

```typescript
// ✅ GOOD: Use withItems fixture
import { withItems } from '@/fixtures/with-items';

withItems('can start shopping mode', async ({ authenticatedPage, list, items }) => {
  // Fixture provided: user, household, store, list with 3 items
  // Test focuses on: starting shopping mode
  
  await authenticatedPage.goto(`/lists/${list.id}`);
  await authenticatedPage.locator('button:has-text("Go Shopping")').click();
  
  // Verify shopping mode
  await expect(authenticatedPage.locator('button:has-text("Finish")')).toBeVisible();
  await expect(authenticatedPage.locator('input[type="checkbox"]')).toHaveCount(items.length);
});
```

---

#### **Issue 3: No Helper Functions**

**Current:** Setup logic duplicated everywhere

```typescript
// In store-creation.spec.ts:
await authenticatedPage.locator('input[name="name"]').fill(storeName);
await authenticatedPage.locator('input[name="location"]').fill(storeLocation);
const submitButton = authenticatedPage.locator('button:has-text("Save")');
await submitButton.click();

// In list-creation.spec.ts (different test, same pattern):
await addStoreButton.click();
await authenticatedPage.locator('input[name="name"]').fill('Test List Store');
await authenticatedPage.locator('input[name="location"]').fill('456 List Ave');
const submitButton = authenticatedPage.locator('button[type="submit"]');
await submitButton.click();
```

**Problem:** Same logic copy-pasted across tests

**Solution:** Extract to helpers

```typescript
// apps/e2e/helpers/store-helpers.ts (TO CREATE)
export async function createStore(
  page: Page,
  name: string,
  location: string = '123 Main St'
): Promise<{ id: string; name: string; location: string }> {
  await page.goto('/stores');
  await page.locator('button:has-text("Add Store")').click();
  
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="location"]').fill(location);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/stores\/.+/);
  
  const storeId = page.url().match(/\/stores\/([^/]+)/)?.[1] || '';
  return { id: storeId, name, location };
}
```

**Usage in tests:**

```typescript
// Core test proves helper works
test('can create store', async ({ authenticatedPage }) => {
  const store = await createStore(authenticatedPage, 'Walmart');
  expect(store.id).toBeTruthy();
  expect(store.name).toBe('Walmart');
});

// Fixture uses proven helper
export const withStore = base.extend({
  store: async ({ authenticatedPage }, use) => {
    const store = await createStore(authenticatedPage, 'Test Store');
    await use(store);
  },
});
```

---

#### **Issue 4: Wrong Test Organization**

**Current Structure:**
```
tests/
├── auth/
├── stores/
├── lists/
├── items/
└── onboarding/
```

**Problem:** Organized by domain, not by test type

**Correct Structure (per our philosophy):**
```
tests/
├── core/              # Isolated feature tests
│   ├── auth/
│   ├── stores/
│   ├── lists/
│   └── items/
├── integration/       # Feature combination tests
│   ├── shopping-flow.spec.ts
│   └── multi-user-collaboration.spec.ts
└── journeys/          # End-to-end user flows
    └── first-shopping-experience.spec.ts
```

---

### 4. Specific Test Alignment

#### ✅ GOOD: `tests/stores/authorization.spec.ts`

```typescript
import { test } from '../../fixtures/multi-user';

test('users cannot access stores from different households', async ({ userA, userB }) => {
  // Uses proper fixture
  // Tests one specific behavior
  // Good isolation
});
```

**Alignment:** Perfect - This is a good example of:
- Using the right fixture (`multiUser`)
- Testing one behavior (cross-household isolation)
- Clear test intent

**Type:** Integration test (should move to `tests/integration/`)

---

#### ⚠️ NEEDS REFACTOR: `tests/stores/store-creation.spec.ts`

```typescript
test('user creates first store in household', async ({ authenticatedPage }) => {
  // ❌ Problem: Assumes household exists (no explicit fixture)
  await authenticatedPage.goto('/stores');
  const addStoreButton = authenticatedPage.locator('button:has-text("Add Store")');
  // ... creates store inline
});
```

**Problems:**
1. Should use `withHousehold` fixture (household is prerequisite, not what's being tested)
2. Setup logic should be extracted to `createStore()` helper
3. After test passes, should create `withStore` fixture

**Refactor:**

```typescript
import { withHousehold } from '@/fixtures/with-household';
import { createStore } from '@/helpers/store-helpers';

withHousehold('can create store', async ({ authenticatedPage, household }) => {
  // Fixture provided: user + household
  // Test proves: createStore() helper works
  
  const store = await createStore(authenticatedPage, 'Walmart', '123 Main St');
  
  // Verify store was created
  await authenticatedPage.goto('/stores');
  await expect(authenticatedPage.locator(`text="${store.name}"`)).toBeVisible();
});

// THEN create withStore fixture using createStore() helper
```

**Type:** Core test (stays in `tests/core/stores/`)

---

#### ⚠️ NEEDS REFACTOR: `tests/lists/shopping-mode.spec.ts`

```typescript
test('transition list to shopping mode', async ({ authenticatedPage }) => {
  // ❌ Problem 1: Navigates to stores, assumes list exists
  await authenticatedPage.goto('/stores');
  const startListButton = authenticatedPage.locator('button:has-text("Go To List")');
  
  // ❌ Problem 2: Conditionally adds items inline
  if (hasInput) {
    await addItemInput.fill(itemName);
    await addItemInput.press('Enter');
  }
  
  // The actual test behavior
  const startShoppingButton = authenticatedPage.locator('button:has-text("Go Shopping")');
  await startShoppingButton.click();
});
```

**Problems:**
1. No fixtures - assumes list and items exist
2. Conditionally creating test data inline
3. 70% of test is setup, 30% is actual test

**Refactor:**

```typescript
import { withItems } from '@/fixtures/with-items';
import { startShopping } from '@/helpers/shopping-helpers';

withItems('can start shopping mode', async ({ authenticatedPage, list, items }) => {
  // Fixture provided: user, household, store, list with items
  // Test proves: startShopping() helper works
  
  await authenticatedPage.goto(`/lists/${list.id}`);
  await startShopping(authenticatedPage);
  
  // Verify shopping mode active
  await expect(authenticatedPage.locator('button:has-text("Finish")')).toBeVisible();
});

// THEN create withShoppingMode fixture using startShopping() helper
```

**Type:** Core test (moves to `tests/core/lists/`)

---

## Migration Plan

### Phase 1: Extract Helpers (1-2 days)

**Create helper functions:**

1. `apps/e2e/helpers/store-helpers.ts`:
   - `createStore(page, name, location)`
   - `updateStore(page, storeId, data)`
   - `deleteStore(page, storeId)`

2. `apps/e2e/helpers/list-helpers.ts`:
   - `createList(page, storeId)`
   - `addItemToList(page, itemName)`
   - `removeItemFromList(page, itemName)`

3. `apps/e2e/helpers/shopping-helpers.ts`:
   - `startShopping(page)`
   - `checkOffItem(page, itemName)`
   - `completeShopping(page)`

**Test helpers work:**
- Write core tests using helpers
- Verify all helpers pass

---

### Phase 2: Create Fixture Hierarchy (2-3 days)

**Create fixtures (in order):**

1. `fixtures/with-household.ts`
   - Depends on: `authenticated`
   - Provides: `household`

2. `fixtures/with-store.ts`
   - Depends on: `withHousehold`
   - Uses: `createStore()` helper
   - Provides: `store`

3. `fixtures/with-list.ts`
   - Depends on: `withStore`
   - Uses: `createList()` helper
   - Provides: `list`

4. `fixtures/with-items.ts`
   - Depends on: `withList`
   - Uses: `addItemToList()` helper
   - Provides: `list` with `items`

5. `fixtures/with-shopping-mode.ts`
   - Depends on: `withItems`
   - Uses: `startShopping()` helper
   - Provides: `list` in SHOPPING mode

---

### Phase 3: Refactor Tests (2-3 days)

**Reorganize test files:**

```bash
# Move and refactor tests
mkdir -p tests/core/{auth,stores,lists,items}
mkdir -p tests/integration
mkdir -p tests/journeys

# Core tests (use fixtures heavily)
mv tests/auth/* tests/core/auth/
# Refactor tests/stores/* → tests/core/stores/ (use withHousehold)
# Refactor tests/lists/* → tests/core/lists/ (use withStore, withList)
# Refactor tests/items/* → tests/core/items/ (use withList)

# Integration tests
mv tests/stores/authorization.spec.ts tests/integration/
# Create tests/integration/shopping-flow.spec.ts

# Journey tests (minimal fixtures)
# Create tests/journeys/first-shopping-experience.spec.ts
```

**Refactor test content:**
1. Import correct fixtures
2. Remove inline setup
3. Use helpers for test actions
4. Focus tests on single behavior

---

### Phase 4: Add Missing Tests (2-3 days)

Based on test-scenarios.md, add:

**Store tests:**
- STORE-002: Create multiple stores
- STORE-003: Update store details
- STORE-004: Delete store

**List tests:**
- LIST-002: Auto-resume existing list
- LIST-004: Update item quantity
- LIST-005: Remove item from list
- LIST-009: Uncheck item

**Journey test:**
- First shopping experience (complete flow)

---

## Summary of Changes Needed

### ✅ Keep as-is
- `fixtures/authenticated.ts`
- `fixtures/multi-user.ts`
- `fixtures/users.ts`
- `helpers/auth.ts`
- Test tagging strategy
- Multi-user test patterns

### 🔧 Refactor
- All test files (use fixtures + helpers)
- Test organization (domain → core/integration/journeys)
- Inline setup → extract to helpers

### ➕ Create New
- `fixtures/with-household.ts`
- `fixtures/with-store.ts`
- `fixtures/with-list.ts`
- `fixtures/with-items.ts`
- `fixtures/with-shopping-mode.ts`
- `helpers/store-helpers.ts`
- `helpers/list-helpers.ts`
- `helpers/shopping-helpers.ts`
- Missing core tests (STORE-002, 003, 004, LIST-002, 004, 005, 009)
- Integration tests (`shopping-flow.spec.ts`)
- Journey test (`first-shopping-experience.spec.ts`)

---

## Quick Wins

**These can be done immediately:**

1. **Extract `createStore()` helper** (30 min)
   - Used in 5+ tests already
   - Immediate deduplication

2. **Create `withHousehold` fixture** (1 hour)
   - Simple fixture, big impact
   - Unblocks `withStore` fixture

3. **Reorganize one domain** (1-2 hours)
   - Move `tests/auth/` → `tests/core/auth/`
   - Prove the pattern works

4. **Create journey test** (2 hours)
   - Tests/journeys/first-shopping-experience.spec.ts`
   - Smoke test for entire app
   - Validates the happy path

---

**Next Steps:**
1. Review this analysis
2. Start with Quick Wins
3. Follow migration plan phases
4. Update tests incrementally

