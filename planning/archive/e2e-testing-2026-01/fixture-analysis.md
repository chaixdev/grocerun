# Fixture Analysis from User Stories

**Date:** January 12, 2026  
**Purpose:** Extract fixture requirements from user stories to guide test implementation

---

## Fixture Dependency Map

### Required Fixtures (by dependency order)

```
Level 1: Authentication
└─→ authenticated
    └─→ Multi-user variants
        ├─→ authenticatedAlice
        ├─→ authenticatedBob
        └─→ withMultipleUsers (Alice + Bob)

Level 2: Household Setup
└─→ withHousehold (extends authenticated)
    └─→ withMultipleHouseholds (user in 2+ households)

Level 3: Store Setup
└─→ withStore (extends withHousehold)
    ├─→ withMultipleStores (3+ stores in household)
    └─→ withStoreSections (store with configured sections)

Level 4: List Setup
└─→ withList (extends withStore)
    └─→ withItems (list + items added)
        └─→ withShoppingMode (list in SHOPPING status)
            └─→ withCheckedItems (some items checked off)

Level 5: Catalog Setup
└─→ withItemCatalog (store with pre-existing items)
    └─→ withPurchaseHistory (items with purchase counts)
```

---

## Analysis by User Story

### 🔴 US-03: Household Collaboration (✅ Implemented)

**Fixtures Needed:**
- ✅ `authenticated` - Base user session
- ✅ `authenticatedAlice` - First test user
- ✅ `authenticatedBob` - Second test user  
- ✅ `withMultipleUsers` - Both users ready for collaboration tests

**Core Tests to Write:**
- [x] STORE-005: Multi-user access (already exists)
- [x] STORE-006: Cross-household isolation (already exists)
- [ ] INV-001: Create invitation
- [ ] INV-002: Join via invitation
- [ ] INV-003: Revoke invitation
- [ ] HOUSE-004: Non-owner cannot rename household
- [ ] HOUSE-005: Member can leave household
- [ ] HOUSE-006: Owner cannot leave household

**Integration Tests:**
- [ ] Two users shopping same list simultaneously
- [ ] Invitation flow end-to-end (create → join → verify access)

**Fixtures This Provides:**
- ✅ `authenticated` (exists: `fixtures/authenticated.ts`)
- ✅ `withMultipleUsers` (exists: `fixtures/multi-user.ts`)
- 🔶 `withHousehold` - Partially exists in tests, needs extraction to fixture

---

### 🔴 US-08: Store Management (⚠️ Partially Implemented)

**Fixtures Needed:**
- ✅ `authenticated`
- 🔶 `withHousehold` - User has household (exists in tests, needs fixture)
- ⏭️ `withStore` - Store exists (not yet created)

**Core Tests to Write:**
- [x] STORE-001: Create first store (exists)
- [ ] STORE-002: Create multiple stores
- [ ] STORE-003: Update store details (rename, location)
- [ ] STORE-004: Delete store (cascade sections/items/lists)
- [ ] SECT-001: Create section
- [ ] SECT-002: Update section name
- [ ] SECT-004: Delete empty section

**Integration Tests:**
- [x] STORE-005: Household member access (exists)
- [x] STORE-006: Cross-household isolation (exists)

**Fixtures This Provides:**
- ⏭️ `withStore` - Store created and ready
- ⏭️ `withMultipleStores` - Household with 3+ stores
- ⏭️ `withStoreSections` - Store with sections configured

**File Locations:**
- Create: `apps/e2e/fixtures/with-household.ts`
- Create: `apps/e2e/fixtures/with-store.ts`
- Tests: `apps/e2e/tests/core/stores/` (move existing + add new)

---

### 🔴 US-09: Shopping Lifecycle (🔲 Planned)

**Fixtures Needed:**
- ✅ `authenticated`
- 🔶 `withHousehold`
- ⏭️ `withStore`
- ⏭️ `withList` - List created
- ⏭️ `withItems` - List with items
- ⏭️ `withShoppingMode` - List in SHOPPING status

**Core Tests to Write:**
- [ ] LIST-001: Create shopping list
- [ ] LIST-002: Auto-resume existing list
- [ ] LIST-003: Add item to list
- [ ] LIST-004: Update item quantity
- [ ] LIST-005: Remove item from list
- [ ] LIST-006: Start shopping (PLANNING → SHOPPING)
- [ ] LIST-007: Check off items
- [ ] LIST-008: Adjust purchased quantity
- [ ] LIST-009: Uncheck item
- [ ] LIST-010: Complete shopping (SHOPPING → COMPLETED)

**Integration Tests:**
- [ ] Complete shopping flow (create → add items → shop → complete)
- [ ] Cancel shopping (SHOPPING → PLANNING)
- [ ] Wake lock during shopping mode

**Journey Tests:**
- [ ] First shopping experience (full flow from store creation)

**Fixtures This Provides:**
- ⏭️ `withList` - List in PLANNING status
- ⏭️ `withItems` - List with 3-5 items added
- ⏭️ `withShoppingMode` - List in SHOPPING status with items
- ⏭️ `withCheckedItems` - Some items checked off

**File Locations:**
- Create: `apps/e2e/fixtures/with-list.ts`
- Create: `apps/e2e/fixtures/with-items.ts`
- Create: `apps/e2e/fixtures/with-shopping-mode.ts`
- Tests: `apps/e2e/tests/core/lists/`, `apps/e2e/tests/integration/shopping-flow.spec.ts`

---

### 🟡 US-01: Autocomplete (🔲 Planned)

**Fixtures Needed:**
- ✅ `authenticated`
- 🔶 `withHousehold`
- ⏭️ `withStore`
- ⏭️ `withItemCatalog` - Store with 10+ existing items
- ⏭️ `withPurchaseHistory` - Items with varied purchase counts

**Core Tests to Write:**
- [ ] ITEM-005: Item search/autocomplete
- [ ] Search with typos (fuzzy matching)
- [ ] Empty state shows frequent items
- [ ] Results sorted by purchase frequency
- [ ] Keyboard navigation (arrow keys, enter)

**Integration Tests:**
- [ ] Autocomplete → Add to list flow
- [ ] Performance test (< 100ms response)

**Fixtures This Provides:**
- ⏭️ `withItemCatalog` - Store with 10-20 pre-existing items
- ⏭️ `withPurchaseHistory` - Items with realistic purchase counts

**File Locations:**
- Create: `apps/e2e/fixtures/with-item-catalog.ts`
- Tests: `apps/e2e/tests/core/items/autocomplete.spec.ts`

---

### 🟡 US-07: Dashboard (⚠️ Partially Implemented)

**Fixtures Needed:**
- ✅ `authenticated`
- 🔶 `withHousehold`
- ⏭️ `withStore`
- ⏭️ `withMultipleStores` - Multiple stores for grouping test
- ⏭️ `withList`
- ⏭️ `withMultipleHouseholds` - User in 2+ households
- ⏭️ `withCompletedLists` - Some lists in COMPLETED status

**Core Tests to Write:**
- [x] DASH-001: Household overview (basic version exists)
- [x] DASH-002: Empty state - no households (exists: onboarding test)
- [x] DASH-003: Empty state - no stores (exists)
- [ ] List grouping by household
- [ ] List status indicators (planning/shopping/completed)
- [ ] Navigation to lists

**Integration Tests:**
- [ ] Multi-household dashboard view
- [ ] Archived lists section
- [ ] "Shop Again" from archived list

**Fixtures This Provides:**
- ⏭️ `withMultipleHouseholds` - User member of 2+ households
- ⏭️ `withCompletedLists` - Mix of active and completed lists

**File Locations:**
- Tests: `apps/e2e/tests/core/dashboard/` (move existing onboarding tests)

---

## Item Management Tests (from test-scenarios.md)

**Fixtures Needed:**
- ⏭️ `withList`
- ⏭️ `withItemCatalog`

**Core Tests to Write:**
- [ ] ITEM-001: Add item to list (basic flow)
- [ ] ITEM-002: Add item with section
- [ ] ITEM-003: Add existing item (autocomplete)
- [ ] ITEM-004: Prevent duplicate items on same list
- [ ] ITEM-006: Update item details (name, section)

**File Locations:**
- Tests: `apps/e2e/tests/core/items/item-management.spec.ts`

---

## Authentication Tests (from test-scenarios.md)

**Fixtures Needed:**
- None (base level tests)

**Core Tests to Write:**
- [x] AUTH-001: User login (exists)
- [x] AUTH-002: Invalid login (exists)
- [x] AUTH-003: Session persistence (exists)
- [x] AUTH-004: Logout (exists)
- [x] AUTH-006: Protected route access (exists)

**Status:** ✅ Complete - All auth tests implemented

**File Locations:**
- Tests: `apps/e2e/tests/auth/`

---

## Security Tests (from test-scenarios.md)

**Fixtures Needed:**
- ✅ `authenticated`
- 🔶 `withHousehold`
- ⏭️ `withStore`

**Core Tests to Write:**
- [x] EDGE-004: XSS protection (exists)
- [x] EDGE-005: SQL injection protection (exists)
- [x] API-001: JWT validation (exists)
- [x] API-002: Cross-household authorization (exists)
- [ ] EDGE-003: 404 for non-existent store
- [ ] API-003: Error response format consistency

**File Locations:**
- Tests: `apps/e2e/tests/security/`, `apps/e2e/tests/api/`

---

## Summary: Fixture Creation Priority

### Phase 1: Foundation (Immediate) 🔴
Create these fixtures first - they're needed by most tests:

1. **`withHousehold`** (extract from existing test code)
   - Used by: All store, list, item tests
   - Complexity: Low (already exists inline in tests)
   - File: `apps/e2e/fixtures/with-household.ts`

2. **`withStore`** (new)
   - Used by: All list, item, section tests
   - Complexity: Low
   - File: `apps/e2e/fixtures/with-store.ts`

### Phase 2: List Management (Next) 🟠
Enable shopping flow tests:

3. **`withList`** (new)
   - Used by: All item, shopping mode tests
   - Complexity: Low
   - File: `apps/e2e/fixtures/with-list.ts`

4. **`withItems`** (new)
   - Used by: Shopping mode, check-off tests
   - Complexity: Medium (needs to add items using helpers)
   - File: `apps/e2e/fixtures/with-items.ts`

### Phase 3: Shopping Flow (Then) 🟡
Complete the shopping lifecycle:

5. **`withShoppingMode`** (new)
   - Used by: Check-off, complete shopping tests
   - Complexity: Medium
   - File: `apps/e2e/fixtures/with-shopping-mode.ts`

### Phase 4: Advanced Features (Later) 🟢
Nice-to-have fixtures for edge cases:

6. **`withMultipleStores`** - Household with 3+ stores
7. **`withMultipleHouseholds`** - User in 2+ households
8. **`withItemCatalog`** - Store with pre-existing items
9. **`withPurchaseHistory`** - Items with purchase counts
10. **`withStoreSections`** - Store with sections configured
11. **`withCompletedLists`** - Mix of active/completed lists

---

## Next Steps

**Immediate Actions:**
1. ✅ Review this analysis
2. Create `withHousehold` fixture (extract from tests)
3. Create `withStore` fixture
4. Reorganize existing tests into core/integration/journeys structure
5. Write missing core tests for STORE-002, STORE-003, STORE-004

**Test Development Workflow:**
```bash
# For each fixture to create:
1. Identify the helper function needed (e.g., createStore())
2. Write a core test that proves the helper works
3. Test passes → Extract helper to fixtures/
4. Refactor existing tests to use the fixture
5. Write new tests using the fixture
```

**Reference Files:**
- Fixture philosophy: [E2E Test Organization Guide](./e2e-test-organization-guide.md)
- Test scenarios: [Test Scenarios](../planning/test-scenarios.md)
- User stories: [User Stories](../planning/user-stories/)
