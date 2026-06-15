# E2E Test Organization & Dependency Management Guide

**Date:** January 12, 2026  
**Status:** Active  
**Context:** Early-stage test development - getting the organization right

---

## Table of Contents

1. [Philosophy & Core Concepts](#philosophy--core-concepts)
2. [Current State Analysis](#current-state-analysis)
3. [Industry Best Practices](#industry-best-practices)
4. [Recommended Approach](#recommended-approach)
5. [Specific Recommendations for Grocerun](#specific-recommendations)
6. [Implementation Plan](#implementation-plan)

---

## Philosophy & Core Concepts

### The Mental Model

E2E testing in Playwright is built on three orthogonal concepts:

#### 1. **Tests** - Verify Behavior
- Tests **prove** that a feature works
- Structure: Arrange (setup) → Act (do the thing) → Assert (verify outcome)
- Each test should verify ONE specific behavior
- Tests create evidence that helpers/features work correctly

#### 2. **Fixtures** - Provide Prerequisites (Dependency Injection)
- Fixtures **provide** starting states for tests
- They are reusable setup code that runs before tests
- They are **NOT** tests - they don't verify behavior
- They are a **shared library** separate from test organization
- Fixtures trust that helpers work (based on test coverage)

#### 3. **Test Organization** - Categorize by Purpose
- **Core tests**: Isolated feature tests (80%)
- **Integration tests**: Feature combinations (15%)
- **Journey tests**: End-to-end user flows (5%)
- This is about **what kind of test** it is, not what fixtures it uses

### Key Philosophical Principles

#### **Principle 1: Fixtures Are Infrastructure, Not Organization**

```
Your Project Structure:

apps/e2e/
├── fixtures/           ← SHARED LIBRARY (infrastructure)
│   ├── authenticated.ts
│   ├── with-household.ts
│   ├── with-store.ts
│   └── with-list.ts
│
├── helpers/            ← SHARED UTILITIES
│   └── shopping-helpers.ts
│
└── tests/              ← ORGANIZED BY TEST TYPE
    ├── core/           ← Can use any fixture
    ├── integration/    ← Can use any fixture
    └── journeys/       ← Can use any fixture (or none)
```

**Any test can use any fixture.** The core/integration/journeys organization is about test purpose, not fixture availability.

#### **Principle 2: The Test → Fixture Workflow**

Fixtures don't come first - tests do:

```typescript
// Step 1: Write a test to verify the behavior
test('can add item to list', async ({ authenticatedPage, list }) => {
  await addItem(authenticatedPage, 'Milk');  // Using helper
  expect(await getItemCount(list.id)).toBe(1);
});
// ✅ Test passes → Helper works!

// Step 2: Create fixture using the tested helper
export const withItems = withList.extend({
  listWithItems: async ({ authenticatedPage, list }, use) => {
    await addItem(authenticatedPage, 'Milk');  // Trust this works
    await addItem(authenticatedPage, 'Bread');
    await use({ list, items: ['Milk', 'Bread'] });
  },
});

// Step 3: Use fixture in future tests
withItems('can remove item', async ({ authenticatedPage, listWithItems }) => {
  await removeItem(authenticatedPage, 'Milk');
  expect(await getItemCount(listWithItems.list.id)).toBe(1);
});
```

**Workflow:**
1. Write test to verify behavior
2. Test passes → helper is proven to work
3. Create fixture using that helper
4. Future tests use fixture to skip setup

#### **Principle 3: Tests and Fixtures Serve Different Purposes**

| Aspect | Tests | Fixtures |
|--------|-------|----------|
| **Purpose** | Verify behavior | Provide prerequisites |
| **Contains** | Act + Assert | Arrange only |
| **Proves** | Feature works | Nothing (trusts helpers) |
| **Reusable** | No (specific scenario) | Yes (shared setup) |
| **When it fails** | Feature is broken | Helper is broken |

**Example:**

```typescript
// ✅ TEST: Verifies "add item" behavior
test('can add item to list', async ({ authenticatedPage, list }) => {
  // ARRANGE: List exists (from fixture)
  
  // ACT: Add the item
  await addItem(authenticatedPage, 'Milk');
  
  // ASSERT: Verify it worked
  expect(await getItemCount(list.id)).toBe(1);
});

// ✅ FIXTURE: Provides "list with items" prerequisite
export const withItems = withList.extend({
  listWithItems: async ({ list }, use) => {
    // ARRANGE ONLY: Set up the state
    await addItem(authenticatedPage, 'Milk');
    await addItem(authenticatedPage, 'Bread');
    
    // NO ASSERT: Fixture doesn't verify anything
    await use({ list, items: [...] });
  },
});
```

#### **Principle 4: Playwright Doesn't Check Test Passage**

When you use a fixture, Playwright does NOT check if related tests passed:

```typescript
// This test proves addItem() works
test('can add item', async ({ list }) => {
  await addItem('Milk');
  expect(count).toBe(1);  // ✅ Passes
});

// This fixture TRUSTS addItem() works
// Playwright doesn't verify the test above passed first
const withItems = base.extend({
  items: async ({ list }, use) => {
    await addItem('Milk');  // Trust this works
    await use([...]);
  },
});
```

**The trust chain:**
- Test proves: `addItem()` helper works
- Fixture uses: `addItem()` helper (trusting it works)
- If helper breaks: Both test AND fixtures using it will fail

#### **Principle 5: Journey Tests Should Minimize Fixtures**

Journey tests verify complete user flows - they should test actual behavior, not skip it:

```typescript
// ❌ BAD: Journey test that skips everything
test.describe.serial('Shopping Journey', () => {
  withShoppingMode('just complete it', async ({ list }) => {
    // We skipped: login, create store, create list, add items, start shopping
    await completeShopping();  // Only testing this one action
  });
});

// ✅ GOOD: Journey test that verifies the actual flow
test.describe.serial('Shopping Journey', () => {
  // Only use fixture for boring prerequisites (auth, household)
  withHousehold.beforeAll(async () => { });
  
  withHousehold('create store', async ({ authenticatedPage }) => {
    // Test the actual user behavior
    await createStore(authenticatedPage, 'Walmart');
  });
  
  withHousehold('create list', async ({ authenticatedPage }) => {
    // Test the actual user behavior
    await createList(authenticatedPage);
  });
  
  // ... test each step of the journey
});
```

**Guideline:** Use fixtures to skip **boring setup**, not **behaviors you want to verify**.

---

## Current State Analysis

### What We Have

**Test Structure:**
```
apps/e2e/tests/
├── auth/                  # 5 tests - AUTH-001 to AUTH-006
├── security/              # 3 tests - XSS, SQL injection
├── api/                   # 2 tests - JWT validation
├── stores/                # 4 tests - STORE-001, STORE-005, STORE-006
├── onboarding/            # 3 tests - HOUSE-001, DASH-002, DASH-003
├── lists/                 # 5 tests - LIST-001, LIST-003, LIST-006, LIST-007, LIST-010
├── items/                 # 1 test - ITEM-001
└── households/            # 1 test - Collaboration
```

**Current Issues:**
1. ⚠️ **Test interdependence unclear** - Tests create their own data but don't clean up
2. ⚠️ **No explicit ordering** - Tests run in parallel by default
3. ⚠️ **Implicit prerequisites** - LIST-006 assumes items exist, but no guaranteed setup
4. ⚠️ **Duplicate setup logic** - Every test creates stores/lists independently
5. ⚠️ **No test data strategy** - Tests use timestamp-based names, potential conflicts

### What's Working Well

✅ **Good domain separation** - Tests grouped by feature area  
✅ **Tag-based filtering** - `@tag:p0`, `@tag:auth` for selective runs  
✅ **Authenticated fixtures** - Consistent user session handling  
✅ **Multi-user fixtures** - Support for collaboration tests  

---

## Industry Best Practices

### 1. **Test Isolation Patterns**

Teams tackle E2E test interdependence using several approaches:

#### **A. Full Isolation (Recommended for most tests)**
- Each test is completely independent
- Tests can run in any order
- Slower but more reliable

```typescript
test('user completes shopping flow', async ({ authenticatedPage }) => {
  // 1. Setup: Create all prerequisites
  const store = await createStore(authenticatedPage, 'Test Store');
  const list = await createList(store.id);
  await addItemToList(list.id, 'Milk');
  
  // 2. Execute: Test the actual behavior
  await startShopping(list.id);
  await checkOffItem('Milk');
  await completeShopping();
  
  // 3. Assert: Verify outcome
  expect(list.status).toBe('COMPLETED');
  
  // 4. Cleanup: Handled by afterEach or database reset
});
```

**Pros:**
- ✅ No flakiness from test order
- ✅ Clear what each test needs
- ✅ Easy to parallelize

**Cons:**
- ❌ Slower execution
- ❌ More setup code
- ❌ Can be verbose

---

#### **B. Serial Tests with Shared State (Use sparingly)**
- Tests run in sequence
- Each test builds on previous state
- Faster but fragile

```typescript
test.describe.serial('Shopping Journey', () => {
  let storeId: string;
  let listId: string;
  
  test('1. Create store', async ({ page }) => {
    storeId = await createStore(page);
  });
  
  test('2. Create list', async ({ page }) => {
    listId = await createList(page, storeId);
  });
  
  test('3. Add items', async ({ page }) => {
    await addItem(page, listId, 'Milk');
  });
  
  test('4. Complete shopping', async ({ page }) => {
    await completeShopping(page, listId);
  });
});
```

**Pros:**
- ✅ Fast execution
- ✅ Mirrors user journey
- ✅ Minimal setup

**Cons:**
- ❌ First failure stops all tests
- ❌ Cannot run in parallel
- ❌ Hard to debug individual tests

---

#### **C. Hybrid: Test Levels**
- **Unit-level E2E:** Test single feature in isolation
- **Integration E2E:** Test feature combinations
- **Journey E2E:** Test complete user flows

```typescript
// Level 1: Isolated feature tests
test('can create store', async ({ page }) => { /* ... */ });
test('can add item to list', async ({ page }) => { /* ... */ });

// Level 2: Integration tests (depends on fixtures, not tests)
test('store items appear in list', async ({ page, store, list }) => { /* ... */ });

// Level 3: Journey tests (uses helpers, fully independent)
test('complete shopping journey', async ({ page }) => {
  // Full flow from store creation to shopping completion
});
```

---

### 2. **Fixture-Based Prerequisites**

Instead of test interdependence, use **fixtures** to provide prerequisites:

```typescript
// fixtures/with-store.ts
export const storeFixture = base.extend({
  store: async ({ authenticatedPage }, use) => {
    const store = await createStore(authenticatedPage, 'Fixture Store');
    await use(store);
    // Cleanup happens automatically
  },
});

// Usage
test('can create list in store', async ({ authenticatedPage, store }) => {
  // 'store' already exists, created by fixture
  await createList(authenticatedPage, store.id);
});
```

**Benefits:**
- ✅ Tests get prerequisites automatically
- ✅ No test interdependence
- ✅ Reusable across tests
- ✅ Automatic cleanup

---

### 3. **Test Data Builders**

Create reusable helpers for common setup patterns:

```typescript
// helpers/test-builders.ts
export class ShoppingListBuilder {
  private page: Page;
  private storeName = 'Test Store';
  private items: string[] = [];
  
  constructor(page: Page) {
    this.page = page;
  }
  
  withStore(name: string) {
    this.storeName = name;
    return this;
  }
  
  withItems(...items: string[]) {
    this.items = items;
    return this;
  }
  
  async build() {
    const store = await createStore(this.page, this.storeName);
    const list = await createList(this.page, store.id);
    
    for (const item of this.items) {
      await addItemToList(this.page, list.id, item);
    }
    
    return { store, list };
  }
}

// Usage
test('can check off items', async ({ page }) => {
  const { list } = await new ShoppingListBuilder(page)
    .withStore('Walmart')
    .withItems('Milk', 'Bread', 'Eggs')
    .build();
  
  // Test the actual behavior
  await checkOffItem(page, list.id, 'Milk');
});
```

---

### 4. **Database Management Strategies**

#### **Option A: Database Reset Per Test (Slowest, Most Reliable)**
```typescript
test.beforeEach(async () => {
  await resetDatabase();
});
```

#### **Option B: Database Reset Per File (Faster)**
```typescript
test.describe('Shopping Lists', () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });
  
  // Tests run sequentially in this file
  test.describe.serial('List lifecycle', () => {
    // ...
  });
});
```

#### **Option C: Test Isolation via Tenancy (Fastest)**
```typescript
test.beforeEach(async () => {
  // Create unique household per test
  const householdId = await createHousehold(`test-${randomUUID()}`);
  // All test data scoped to this household
});
```

---

## Recommended Approach

### **For Grocerun's Current Stage**

Given that you're early in development with evolving features, I recommend a **hybrid approach**:

### **1. Organize Tests by Stability**

```
tests/
├── core/                    # Stable, isolated feature tests
│   ├── auth/
│   ├── stores/
│   └── security/
├── integration/             # Feature combination tests
│   ├── store-to-list/
│   └── multi-user/
└── journeys/                # End-to-end user flows
    ├── first-shopping.spec.ts
    └── household-collaboration.spec.ts
```

### **2. Test Levels**

#### **Level 1: Core Feature Tests (80% of tests)**
- **Purpose**: Verify individual features work in isolation
- **Fixture Usage**: Heavy - skip all prerequisites, focus on the feature
- **Example**: Testing "add item" assumes list exists (fixture provides it)
- **Execution**: Fully parallel, any order
- **Speed**: Fast (minimal setup)

```typescript
// Core test: Focus on ONE behavior, fixture provides everything else
import { withList } from '@/fixtures/with-list';

withList('can add item @tag:items @tag:p0', async ({ authenticatedPage, list }) => {
  // Fixture provided: user, household, store, list
  // Test focuses on: adding item
  await addItem(authenticatedPage, 'Milk');
  expect(await getItemCount(list.id)).toBe(1);
});
```

#### **Level 2: Integration Tests (15% of tests)**
- **Purpose**: Verify features work together correctly
- **Fixture Usage**: Moderate - provide base state, test the interaction
- **Example**: Testing shopping flow uses list fixture, tests the workflow
- **Execution**: Parallel with proper fixtures
- **Speed**: Medium (some setup in test body)

```typescript
// Integration test: Test feature combination
import { withList } from '@/fixtures/with-list';

withList('complete shopping flow @tag:shopping @tag:p1', async ({ authenticatedPage, list }) => {
  // Fixture provided: user, household, store, list
  // Test focuses on: the workflow of shopping
  await addItem(authenticatedPage, 'Milk');
  await startShopping(authenticatedPage);
  await checkOffItem(authenticatedPage, 'Milk');
  await completeShopping(authenticatedPage);
  
  expect(await getListStatus(list.id)).toBe('COMPLETED');
});
```

#### **Level 3: Journey Tests (5% of tests)**
- **Purpose**: Verify complete user experience end-to-end
- **Fixture Usage**: Minimal - only skip boring prerequisites (auth, household)
- **Example**: First-time user flow from login through first shopping trip
- **Execution**: Sequential (test.describe.serial)
- **Speed**: Slower (tests full flow)

```typescript
// Journey test: Verify the COMPLETE user experience
import { withHousehold } from '@/fixtures/with-household';

test.describe.serial('First Shopping Journey @tag:journey @tag:p0', () => {
  // Fixture: Only skip household creation (boring prerequisite)
  // Everything else is tested to verify the actual user flow
  
  let storeId: string;
  
  withHousehold('create first store', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/stores');
    await authenticatedPage.locator('button:has-text("Add Store")').click();
    await authenticatedPage.locator('input[name="name"]').fill('Walmart');
    await authenticatedPage.locator('button[type="submit"]').click();
    storeId = await captureStoreId(authenticatedPage);
  });
  
  withHousehold('create shopping list', async ({ authenticatedPage }) => {
    // Test the actual user behavior - don't use fixture
    await authenticatedPage.goto(`/stores/${storeId}`);
    await authenticatedPage.locator('button:has-text("Start Shopping List")').click();
    await authenticatedPage.waitForURL(/\/lists\//);
  });
  
  // ... test each step of the journey
});
```

**Fixture Usage Decision Tree:**

```
For each test, ask:
"Am I trying to VERIFY this behavior or just NEED it as setup?"

├─ VERIFY this behavior
│  └─ Test it directly (don't use fixture)
│     Example: Testing "add item" → Write code to add item
│
└─ NEED it as setup
   └─ Use a fixture
      Example: Testing "remove item" → Use fixture to have item already added
```

---

### **3. Fixture Strategy**

Fixtures form a **shared library** that all tests can use, regardless of organization:

```typescript
// fixtures/authenticated.ts
export const authenticated = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Login and provide authenticated session
    await use(page);
  }
});

// fixtures/with-household.ts
export const withHousehold = authenticated.extend({
  household: async ({ authenticatedPage }, use) => {
    const household = await createHousehold(authenticatedPage);
    await use(household);
  }
});

// fixtures/with-store.ts
export const withStore = withHousehold.extend({
  store: async ({ authenticatedPage, household }, use) => {
    const store = await createStore(authenticatedPage, 'Test Store');
    await use(store);
  }
});

// fixtures/with-list.ts
export const withList = withStore.extend({
  list: async ({ authenticatedPage, store }, use) => {
    const list = await createList(authenticatedPage, store.id);
    await use(list);
  }
});
```

**Usage Across Test Types:**
```typescript
// CORE TEST - Uses fixtures
import { withList } from '@/fixtures/with-list';
withList('can add item', async ({ authenticatedPage, list }) => {
  await addItem(authenticatedPage, 'Milk');
  expect(await getItemCount(list.id)).toBe(1);
});

// INTEGRATION TEST - Uses same fixtures
import { withList } from '@/fixtures/with-list';
withList('shopping flow', async ({ authenticatedPage, list }) => {
  await addItem(authenticatedPage, 'Milk');
  await startShopping(authenticatedPage);
  await completeShopping(authenticatedPage);
});

// JOURNEY TEST - Minimal fixture use
import { withHousehold } from '@/fixtures/with-household';
test.describe.serial('First Shopping Journey', () => {
  // Only skip household creation (boring prerequisite)
  // Test everything else to verify the actual user flow
  withHousehold('create store', async ({ authenticatedPage }) => {
    await createStore(authenticatedPage, 'Walmart');
  });
});
```

**Key Points:**
- Fixtures are infrastructure, not organization
- Any test type can use any fixture
- Choose fixtures based on what you want to skip vs. verify

---

## Specific Recommendations for Grocerun

### **1. Reorganize Current Tests**

#### **Current Problems:**

Your current tests have implicit dependencies:
- `LIST-006` (Start Shopping) assumes list has items
- `LIST-007` (Check Off Items) assumes shopping mode is active
- Tests use `waitForTimeout` and hope previous actions completed

#### **Solution: Make Dependencies Explicit**

**Bad (current):**
```typescript
test('check off items', async ({ page }) => {
  // Assumes we're already in shopping mode... but how did we get here?
  const checkboxes = page.locator('input[type="checkbox"]');
  await checkboxes.nth(0).check();
});
```

**Good (explicit setup):**
```typescript
test('check off items', async ({ authenticatedPage }) => {
  // 1. Setup: Create complete shopping context
  const { list } = await new ShoppingListBuilder(authenticatedPage)
    .withItems('Milk', 'Bread')
    .inShoppingMode()
    .build();
  
  // 2. Test: The actual behavior
  await checkOffItem(authenticatedPage, 'Milk');
  
  // 3. Assert: Verify outcome
  const item = await getItem(list.id, 'Milk');
  expect(item.isChecked).toBe(true);
});
```

---

### **2. Create Test Helpers**

Build a library of composable helpers:

```typescript
// helpers/shopping-helpers.ts

/** Navigate to a store's shopping list */
export async function openShoppingList(page: Page, storeId: string) {
  await page.goto(`/stores/${storeId}`);
  const button = page.locator('button:has-text("Start Shopping List")');
  await button.click();
  await page.waitForURL(/\/lists\//);
}

/** Add item to current list */
export async function addItem(page: Page, itemName: string) {
  const input = page.locator('input[placeholder*="add"]');
  await input.fill(itemName);
  await input.press('Enter');
  await page.waitForTimeout(500); // Debounce
}

/** Start shopping mode */
export async function startShopping(page: Page) {
  const button = page.locator('button:has-text("Go Shopping")');
  await button.click();
  // Wait for mode transition
  await page.locator('button:has-text("Finish")').waitFor();
}

/** Complete shopping flow (start to finish) */
export async function prepareShoppingList(
  page: Page,
  items: string[]
): Promise<string> {
  // Create store
  const storeId = await createStore(page, 'Test Store');
  
  // Open list
  await openShoppingList(page, storeId);
  
  // Add items
  for (const item of items) {
    await addItem(page, item);
  }
  
  return storeId;
}
```

**Usage:**
```typescript
test('can complete shopping', async ({ authenticatedPage }) => {
  // Setup is one line
  await prepareShoppingList(authenticatedPage, ['Milk', 'Bread']);
  
  // Test the actual behavior
  await startShopping(authenticatedPage);
  await checkOffItem(authenticatedPage, 'Milk');
  await completeShopping(authenticatedPage);
  
  // Verify outcome
  expect(await isListCompleted(authenticatedPage)).toBe(true);
});
```

---

### **3. Implement Database Reset Strategy**

**Short-term (current phase):**
- Reset database before each test file
- Use `test.describe.serial` for related tests in same file

```typescript
// At top of each spec file
test.describe.serial('Shopping Lists @tag:lists', () => {
  test.beforeAll(async () => {
    await resetTestDatabase();
  });
  
  // Tests run in order within this file
  test('create list', async ({ authenticatedPage }) => { /* ... */ });
  test('add items', async ({ authenticatedPage }) => { /* ... */ });
  test('start shopping', async ({ authenticatedPage }) => { /* ... */ });
});
```

**Long-term (when stable):**
- Implement fixture-based isolation
- Use separate households per test (tenancy-based isolation)
- Faster parallel execution

---

### **4. Define Test Execution Order**

Create a clear test execution plan:

#### **Run Order 1: Critical Path (P0 - Sequential)**
Tests that verify core functionality in the order users experience it:

```typescript
// tests/journeys/first-shopping-journey.spec.ts
test.describe.serial('First Shopping Journey @tag:p0 @tag:journey', () => {
  test.beforeAll(async () => {
    await resetTestDatabase();
  });
  
  test('1. User logs in', async ({ page }) => { /* ... */ });
  test('2. User creates household (onboarding)', async ({ authenticatedPage }) => { /* ... */ });
  test('3. User creates first store', async ({ authenticatedPage }) => { /* ... */ });
  test('4. User creates shopping list', async ({ authenticatedPage }) => { /* ... */ });
  test('5. User adds items', async ({ authenticatedPage }) => { /* ... */ });
  test('6. User starts shopping', async ({ authenticatedPage }) => { /* ... */ });
  test('7. User checks off items', async ({ authenticatedPage }) => { /* ... */ });
  test('8. User completes shopping', async ({ authenticatedPage }) => { /* ... */ });
});
```

This becomes your **smoke test** - if this passes, the app works.

#### **Run Order 2: Feature Tests (P0 + P1 - Parallel)**
Isolated tests for specific features:

```typescript
// Can run in any order
npx playwright test tests/core --grep @tag:p0
```

#### **Run Order 3: Integration Tests (P1 - Parallel)**
```typescript
npx playwright test tests/integration --grep @tag:p1
```

---

### **5. Tag Strategy**

Extend your current tagging:

```typescript
test.describe('Store Creation @tag:stores @tag:p0 @tag:isolated', () => {
  // @tag:isolated = can run in parallel, fully independent
});

test.describe('Shopping Flow @tag:lists @tag:p0 @tag:journey', () => {
  // @tag:journey = sequential user flow
});

test.describe('Multi-user Collaboration @tag:collaboration @tag:p1 @tag:integration', () => {
  // @tag:integration = tests feature interactions
});
```

**Run commands:**
```bash
# Smoke test (critical path)
npx playwright test --grep "@tag:journey.*@tag:p0"

# All P0 tests (parallel)
npx playwright test --grep "@tag:p0.*@tag:isolated"

# Full suite
npx playwright test
```

---

## Implementation Plan

### **Phase 1: Stabilize Current Tests (1-2 days)**

1. **Add explicit setup to failing tests**
   - LIST-006, LIST-007, LIST-010 should create their own prerequisites
   - Remove assumptions about existing state

2. **Create helper functions**
   - `prepareShoppingList(page, items)`
   - `startShoppingMode(page)`
   - `completeShopping(page)`

3. **Add database reset**
   - Reset before each test file
   - Use `test.describe.serial` within files

**Example refactor:**

```typescript
// BEFORE (brittle)
test('check off items', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/stores');
  const startListButton = authenticatedPage.locator('button:has-text("Go To List")');
  await startListButton.click();
  // ... 20 more lines of setup
  
  const checkboxes = authenticatedPage.locator('input[type="checkbox"]');
  await checkboxes.nth(0).check();
});

// AFTER (clear)
test('check off items', async ({ authenticatedPage }) => {
  // Setup
  await prepareShoppingList(authenticatedPage, ['Milk', 'Bread']);
  await startShopping(authenticatedPage);
  
  // Test
  await checkOffItem(authenticatedPage, 'Milk');
  
  // Assert
  expect(await isItemChecked(authenticatedPage, 'Milk')).toBe(true);
});
```

---

### **Phase 2: Create Fixture Hierarchy (2-3 days)**

1. **Build fixtures**
   - `fixtures/with-store.ts`
   - `fixtures/with-list.ts`
   - `fixtures/with-shopping-mode.ts`

2. **Refactor tests to use fixtures**
   - Convert helper-based setup to fixtures
   - Enable parallel execution

3. **Create test builders**
   - `ShoppingListBuilder`
   - `StoreBuilder`
   - `HouseholdBuilder`

---

### **Phase 3: Reorganize Test Structure (1 day)**

```
tests/
├── core/                              # Isolated feature tests
│   ├── auth/                          # Already isolated ✓
│   ├── stores/
│   │   ├── creation.spec.ts          # Isolated store CRUD
│   │   └── authorization.spec.ts     # Already good ✓
│   ├── lists/
│   │   ├── creation.spec.ts          # List CRUD (isolated)
│   │   └── items.spec.ts             # Item management (isolated)
│   └── security/                      # Already isolated ✓
│
├── integration/                       # Feature combinations
│   ├── shopping-mode.spec.ts         # List → Shopping → Complete
│   └── multi-user.spec.ts            # Collaboration features
│
└── journeys/                          # End-to-end flows
    ├── first-shopping.spec.ts        # Complete first-time flow
    └── household-collaboration.spec.ts # Multi-user journey
```

---

### **Phase 4: Add Journey Tests (1-2 days)**

Create comprehensive user journey tests:

```typescript
// tests/journeys/complete-shopping-journey.spec.ts
test.describe.serial('Complete Shopping Journey @tag:journey @tag:p0', () => {
  test.beforeAll(async () => {
    await resetTestDatabase();
  });
  
  let storeId: string;
  let listId: string;
  
  test('1. Create store', async ({ authenticatedPage }) => {
    storeId = await createStore(authenticatedPage, 'Weekly Groceries Store');
    expect(storeId).toBeTruthy();
  });
  
  test('2. Navigate to store and create list', async ({ authenticatedPage }) => {
    listId = await createListForStore(authenticatedPage, storeId);
    expect(listId).toBeTruthy();
  });
  
  test('3. Add items to list', async ({ authenticatedPage }) => {
    await addItemToList(authenticatedPage, listId, 'Milk');
    await addItemToList(authenticatedPage, listId, 'Bread');
    await addItemToList(authenticatedPage, listId, 'Eggs');
    
    const itemCount = await getListItemCount(authenticatedPage, listId);
    expect(itemCount).toBe(3);
  });
  
  test('4. Start shopping mode', async ({ authenticatedPage }) => {
    await startShoppingMode(authenticatedPage, listId);
    expect(await isInShoppingMode(authenticatedPage)).toBe(true);
  });
  
  test('5. Check off items', async ({ authenticatedPage }) => {
    await checkOffItem(authenticatedPage, 'Milk');
    await checkOffItem(authenticatedPage, 'Bread');
    
    const checkedCount = await getCheckedItemCount(authenticatedPage);
    expect(checkedCount).toBe(2);
  });
  
  test('6. Complete shopping', async ({ authenticatedPage }) => {
    await completeShopping(authenticatedPage);
    expect(await isListCompleted(authenticatedPage)).toBe(true);
  });
});
```

---

## Summary: E2E Testing Philosophy & Best Practices

### **Core Philosophy**

1. **Tests Verify, Fixtures Provide**
   - Tests prove behaviors work (Act + Assert)
   - Fixtures provide starting states (Arrange only)
   - Write tests first, then extract fixtures from proven helpers

2. **Fixtures Are Shared Infrastructure**
   - Fixtures live separately from test organization
   - Any test (core/integration/journey) can use any fixture
   - Choose fixtures based on what you want to skip vs. verify

3. **Test Organization Reflects Purpose**
   - Core: Isolated feature verification (heavy fixture usage)
   - Integration: Feature combination verification (moderate fixtures)
   - Journey: Complete user flow verification (minimal fixtures)

4. **Trust Chain, Not Enforcement**
   - Tests prove helpers work
   - Fixtures trust helpers work (based on test coverage)
   - Playwright doesn't check if tests passed before running fixtures
   - If helper breaks, both tests and fixtures fail

### **Decision Framework**

**When creating a test, ask:**

```
1. What behavior am I verifying?
   → This is what goes in the test body (Act + Assert)

2. What prerequisites does this need?
   → Use existing fixtures OR create setup in test

3. Will other tests need this same setup?
   → Create a fixture for reuse (after test proves helper works)

4. What type of test is this?
   ├─ Testing ONE feature? → Core test (use fixtures heavily)
   ├─ Testing features working together? → Integration test (moderate fixtures)
   └─ Testing complete user flow? → Journey test (minimal fixtures)
```

### **The Test → Fixture Development Cycle**

```typescript
// Phase 1: Write test to verify behavior
test('can add item to list', async ({ list }) => {
  await addItem('Milk');           // Using helper
  expect(await getItemCount()).toBe(1);
});
// ✅ Test passes → Helper is proven to work

// Phase 2: Create fixture using proven helper
export const withItems = base.extend({
  listWithItems: async ({ list }, use) => {
    await addItem('Milk');         // Trust this works
    await use({ items: [...] });
  },
});

// Phase 3: Future tests use fixture
withItems('can remove item', async ({ listWithItems }) => {
  await removeItem('Milk');        // Test focuses on removal
  expect(await getItemCount()).toBe(0);
});
```

### **Target Structure**

```
apps/e2e/
├── fixtures/              # Shared library (the code IS the documentation)
│   ├── authenticated.ts   # Base: logged-in user
│   ├── with-household.ts  # Skip onboarding
│   ├── with-store.ts      # Skip store creation
│   └── with-list.ts       # Skip list creation
│
├── helpers/               # Shared utilities
│   └── shopping-helpers.ts
│
└── tests/
    ├── core/              # 80% - Heavy fixture usage
    │   ├── stores/
    │   ├── lists/
    │   └── items/
    │
    ├── integration/       # 15% - Moderate fixture usage
    │   └── shopping-flow.spec.ts
    │
    └── journeys/          # 5% - Minimal fixture usage
        └── first-shopping.spec.ts
```

### **Fixture Dependency Hierarchy**

```
authenticated (base)
  │
  └─→ withHousehold
        │
        └─→ withStore
              │
              ├─→ withList
              │     │
              │     └─→ withItems
              │           │
              │           └─→ withShoppingMode
              │
              └─→ withStoreSection

withMultipleUsers (separate branch from authenticated)
```

**Check the `fixtures/` folder to see what's actually implemented.**

### **Development Workflow**

1. **Identify behavior** to test (from user story or test scenario)
2. **Write helper function** for that behavior
3. **Write core test** using the helper (proves it works)
4. **Test passes** → Helper is proven
5. **Create fixture** using that helper (if reusable)
6. **Future tests** use fixture to skip setup

**The filesystem shows progress - no tracking tables needed.**

---

## Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Fixtures Pattern](https://playwright.dev/docs/test-fixtures)
- [Effective E2E Testing by Kent C. Dodds](https://kentcdodds.com/blog/effective-snapshot-testing)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

---

**Next Steps:** See [Implementation Plan](#implementation-plan) for detailed roadmap.
