# Regression Test Coverage Analysis

**Date:** January 12, 2026  
**Purpose:** Identify which implemented features need test coverage to prevent regressions

---

## What "Regression Test Coverage" Means

**Definition:** Every feature currently working in production has at least one automated E2E test that will fail if that feature breaks.

**Goal:** If a developer makes a change that breaks existing functionality, tests catch it **before** deployment.

---

## Current Implementation Status by Domain

### ✅ Authentication & Sessions
**Status:** Partially covered by auth tests  
**Implemented Features:**
- OAuth login with Google
- Session creation and persistence
- Protected route access control
- Logout functionality

**Test Coverage:**
- ✅ AUTH-001: Login (exists in `tests/core/auth/`)
- ✅ AUTH-004: Logout (exists)
- ✅ AUTH-006: Protected routes (exists)
- ✅ AUTH-003: Session persistence (exists)

**Coverage:** ~95% ✅ (Auth is well covered)

---

### 🟠 Household Management
**Status:** Implemented, minimal test coverage  
**Implemented Features:**
- Create default household on signup
- Generate invitation tokens
- Join household via invitation code
- View household members
- Leave household (non-owners)
- Delete household (owners only)

**Test Coverage:**
- ✅ HOUSE-001: User has household (basic verification in onboarding test)
- ❌ HOUSE-002: Create additional household - **NO TEST**
- ❌ HOUSE-003: Generate invitation token - **NO TEST**
- ❌ HOUSE-004: Join household via code - **NO TEST**
- ❌ HOUSE-005: View household members - **NO TEST**
- ❌ HOUSE-006: Leave household - **NO TEST**
- ❌ HOUSE-007: Delete household - **NO TEST**

**Coverage:** ~15% ⚠️ **MAJOR GAP**

**Recommendation:** Write 6 core tests for household CRUD operations

---

### 🟡 Store Management
**Status:** Basic CRUD implemented, partial coverage  
**Implemented Features:**
- Create store (name, location)
- View stores by household
- Update store details
- Delete store
- Cross-household isolation (authorization)

**Test Coverage:**
- ✅ STORE-001: Create first store (exists)
- ❌ STORE-002: Create multiple stores - **NO TEST**
- ❌ STORE-003: Update store details - **NO TEST**
- ❌ STORE-004: Delete store - **NO TEST**
- ✅ STORE-005: Household member access (integration test exists)
- ✅ STORE-006: Cross-household isolation (integration test exists)

**Coverage:** ~50% ⚠️ **NEEDS MORE TESTS**

**Recommendation:** Write 3 core tests for update/delete/multiple stores

---

### 🟡 Shopping List Management
**Status:** Core features implemented, basic coverage  
**Implemented Features:**
- Create list for store (auto-names as store name)
- View lists by household (dashboard)
- View active list for store (auto-resume)
- Add items to list
- Update item quantity
- Remove items from list
- Delete list

**Test Coverage:**
- ✅ LIST-001: Create shopping list (exists)
- ❌ LIST-002: Auto-resume existing list - **NO TEST**
- ✅ LIST-003: Add item to list (exists)
- ❌ LIST-004: Update item quantity - **NO TEST**
- ❌ LIST-005: Remove item from list - **NO TEST**
- ❌ LIST-011: Delete list - **NO TEST**

**Coverage:** ~35% ⚠️ **NEEDS MORE TESTS**

**Recommendation:** Write 4 core tests for quantity update, remove, delete, auto-resume

---

### 🟢 Shopping Mode (Lifecycle)
**Status:** Core flow implemented, good coverage  
**Implemented Features:**
- Transition list to SHOPPING mode
- Check off items during shopping
- Uncheck items (mistakes)
- View progress counter (X/Y checked)
- Complete shopping (SHOPPING → COMPLETED)
- Cancel shopping (SHOPPING → PLANNING)

**Test Coverage:**
- ✅ LIST-006: Start shopping (exists)
- ✅ LIST-007: Check off items (exists)
- ✅ LIST-010: Complete shopping (exists)
- ❌ LIST-008: Adjust purchased quantity - **NO TEST**
- ❌ LIST-009: Uncheck item - **NO TEST**
- ❌ Shopping mode: Cancel shopping - **NO TEST**

**Coverage:** ~60% 🟡 **DECENT, BUT GAPS**

**Recommendation:** Write 3 tests for quantity adjustment, uncheck, cancel

---

### 🔴 Dashboard / List Overview
**Status:** Basic view implemented, minimal coverage  
**Implemented Features:**
- View all active lists grouped by household
- Display store name and item count per list
- Navigate to list from card
- Empty states (no households, no lists)
- List status indicators (planning/shopping)

**Test Coverage:**
- ✅ DASH-002: Empty state - no households (exists, skipped)
- ✅ DASH-003: Empty state - no stores (exists)
- ❌ DASH-001: Household overview with lists - **NO TEST**
- ❌ List grouping by household - **NO TEST**
- ❌ List status indicators - **NO TEST**
- ❌ Navigation to list from dashboard - **NO TEST**

**Coverage:** ~20% ⚠️ **MAJOR GAP**

**Recommendation:** Write 4 core tests for dashboard display, grouping, navigation, status

---

### ❌ Section Management (Store Layouts)
**Status:** Backend implemented, frontend TODO  
**Implemented Features:**
- Create sections for store
- Update section name
- Reorder sections (sortOrder)
- Delete sections
- Items can be assigned to sections

**Test Coverage:**
- ❌ SECT-001: Create section - **NO TEST**
- ❌ SECT-002: Update section - **NO TEST**
- ❌ SECT-003: Reorder sections - **NO TEST**
- ❌ SECT-004: Delete section - **NO TEST**

**Coverage:** 0% ❌ **NOT IMPLEMENTED IN UI YET**

**Recommendation:** Skip until frontend is built (Phase 3)

---

### ❌ Item Catalog / History
**Status:** Not yet implemented  
**Implemented Features:** None

**Test Coverage:** N/A

**Recommendation:** Skip (future feature)

---

### ❌ Real-Time Sync
**Status:** Not yet implemented  
**Implemented Features:** None (requires page refresh)

**Test Coverage:** N/A

**Recommendation:** Skip (future feature)

---

## Summary by Coverage Level

| Domain | Implemented | Tests Exist | Coverage | Priority |
|--------|-------------|-------------|----------|----------|
| **Authentication** | ✅ Yes | ✅ 4 tests | 95% | ✅ Good |
| **Household Management** | ✅ Yes | ⚠️ 1 test | 15% | 🔴 Critical |
| **Store Management** | ✅ Yes | 🟡 3 tests | 50% | 🟠 High |
| **List Management** | ✅ Yes | 🟡 2 tests | 35% | 🟠 High |
| **Shopping Mode** | ✅ Yes | 🟢 3 tests | 60% | 🟡 Medium |
| **Dashboard** | ✅ Yes | ⚠️ 2 tests | 20% | 🔴 Critical |
| **Sections** | 🔲 Backend only | ❌ 0 tests | 0% | ⏭️ Skip |
| **Item Catalog** | ❌ No | ❌ 0 tests | 0% | ⏭️ Skip |

---

## Tests Needed for Full Regression Coverage

### 🔴 Critical Priority (15 tests)

#### Household Management (6 tests)
1. **HOUSE-002:** Create additional household
2. **HOUSE-003:** Generate invitation token
3. **HOUSE-004:** Join household via invitation code
4. **HOUSE-005:** View household members
5. **HOUSE-006:** Leave household (member)
6. **HOUSE-007:** Delete household (owner)

#### Dashboard (4 tests)
1. **DASH-001:** View lists grouped by household
2. **DASH-004:** Navigate to list from dashboard card
3. **DASH-005:** List status indicators (planning/shopping/completed)
4. **DASH-006:** Item count display on list cards

#### Store Management (3 tests)
1. **STORE-002:** Create multiple stores in household
2. **STORE-003:** Update store name and location
3. **STORE-004:** Delete store (with cascade warning)

#### List Management (2 tests)
1. **LIST-002:** Auto-resume existing list for store
2. **LIST-011:** Delete list

---

### 🟠 High Priority (6 tests)

#### List Management (3 tests)
1. **LIST-004:** Update item quantity (stepper controls)
2. **LIST-005:** Remove item from list
3. **LIST-012:** View items grouped by section (when sections exist)

#### Shopping Mode (3 tests)
1. **LIST-008:** Adjust quantity during shopping
2. **LIST-009:** Uncheck item (undo mistake)
3. **LIST-013:** Cancel shopping (back to planning)

---

### 🟡 Medium Priority (Integration Tests)

1. **Multi-household workflow:** User in 2+ households sees correct grouping
2. **Concurrent shopping:** Two users shopping same list (check-off sync)
3. **Cross-household item isolation:** Items don't leak between households
4. **Store deletion cascade:** Deleting store deletes lists and items
5. **Household leave cleanup:** Leaving household removes access to stores/lists

---

## Test Implementation Roadmap

### Phase 1: Fill Critical Gaps (15 tests, ~2-3 days)
**Target:** Cover all basic CRUD operations that users can currently perform

1. **Day 1:** Household management tests (6 tests)
   - Create: `tests/core/households/household-management.spec.ts`
   - Tests: HOUSE-002 through HOUSE-007
   - Fixtures: Use `authenticated`, create `withMultipleHouseholds` if needed

2. **Day 2:** Dashboard tests (4 tests)
   - Create: `tests/core/dashboard/list-overview.spec.ts`
   - Tests: DASH-001, 004, 005, 006
   - Fixtures: Create `withMultipleListsAndStatuses` for testing

3. **Day 3:** Store/List CRUD (5 tests)
   - Add to: `tests/core/stores/store-creation.spec.ts`
   - Add to: `tests/core/lists/list-management.spec.ts`
   - Tests: STORE-002, 003, 004, LIST-002, 011

---

### Phase 2: High Priority Coverage (6 tests, ~1-2 days)
**Target:** Cover all item manipulation scenarios

1. **Day 4:** Item management tests (6 tests)
   - Add to: `tests/core/items/item-management.spec.ts`
   - Add to: `tests/core/lists/shopping-mode.spec.ts`
   - Tests: LIST-004, 005, 008, 009, 012, 013

---

### Phase 3: Integration Tests (5 tests, ~1 day)
**Target:** Test feature combinations and edge cases

1. **Day 5:** Cross-cutting scenarios
   - Create: `tests/integration/multi-household-workflow.spec.ts`
   - Create: `tests/integration/concurrent-shopping.spec.ts`
   - Create: `tests/integration/deletion-cascades.spec.ts`

---

## Expected Outcomes After Full Coverage

### Metrics
- **Total tests:** ~50 (current: 20)
- **Overall coverage:** ~90% (current: ~40%)
- **Test execution time:** ~2-3 minutes for full suite
- **Confidence level:** High - all user-facing features covered

### What This Prevents
1. ❌ Breaking household invitations during auth refactor
2. ❌ Breaking list display during dashboard redesign
3. ❌ Breaking item deletion during database migration
4. ❌ Breaking shopping mode during state management refactor
5. ❌ Breaking multi-household access during permission changes

### What This Enables
1. ✅ Safe refactoring (tests catch regressions)
2. ✅ Confident deployments (all features verified)
3. ✅ Fast onboarding (new devs run tests to understand features)
4. ✅ Documentation (tests show how features work)
5. ✅ Feature expansion (fixtures make adding new tests easy)

---

## Quick Reference: Missing Tests Checklist

```markdown
### Household Management
- [ ] HOUSE-002: Create additional household
- [ ] HOUSE-003: Generate invitation token
- [ ] HOUSE-004: Join household via code
- [ ] HOUSE-005: View household members
- [ ] HOUSE-006: Leave household
- [ ] HOUSE-007: Delete household

### Store Management
- [ ] STORE-002: Create multiple stores
- [ ] STORE-003: Update store details
- [ ] STORE-004: Delete store

### List Management
- [ ] LIST-002: Auto-resume existing list
- [ ] LIST-004: Update item quantity
- [ ] LIST-005: Remove item from list
- [ ] LIST-011: Delete list

### Shopping Mode
- [ ] LIST-008: Adjust quantity during shopping
- [ ] LIST-009: Uncheck item
- [ ] LIST-013: Cancel shopping

### Dashboard
- [ ] DASH-001: List overview by household
- [ ] DASH-004: Navigate to list from card
- [ ] DASH-005: List status indicators
- [ ] DASH-006: Item count display

### Integration
- [ ] Multi-household workflow
- [ ] Concurrent shopping sync
- [ ] Cross-household isolation
- [ ] Store deletion cascade
- [ ] Household leave cleanup
```

---

## Next Steps

1. **Immediate:** Start with Phase 1 (household tests) - biggest gap
2. **This week:** Complete critical gaps (15 tests)
3. **Next week:** Add high priority tests (6 tests)
4. **Following week:** Integration tests (5 tests)

**Total time estimate:** 5-7 working days for complete regression coverage

---

**Last Updated:** January 12, 2026
