# Testing Approach Audit

> 2026-06-10 — Deep audit of the Grocerun monorepo testing strategy, coverage, quality, and CI integration.

---

## Current State

| Layer | Framework | Files | Status |
|-------|-----------|-------|--------|
| Server | Vitest | 2 spec files | Thin — soft-delete smoke + section sync only |
| Web | Vitest + Testing Library | 0 files | Configured but zero tests exist |
| E2E | Playwright | 20 spec files | Dead — last run March 2026, 87 failures |
| CI | GitHub Actions | 2 workflows | Neither runs tests |

---

## Findings

### 🔴 CRITICAL

#### 1. Zero web unit/component tests — entire layer untested

**Files**: `apps/web/vitest.config.ts` (configured), `apps/web/src/test/setup.ts` (1 line), `apps/web/package.json`

Vitest + Testing Library + jsdom are fully wired up but **zero test files exist**. No coverage for:

- React components (ShoppingMode, Lists, Stores, item management, onboarding)
- Custom hooks (useRxDb, useSync, etc.)
- Utility/helper functions
- RxDB integration (Phase 4: local-first shopping)
- Form/validation logic

**Risk**: Any refactor of UI components or hooks has zero safety net. Bug detection is entirely manual.

**Remediation**: Start with highest-risk areas:
1. ShoppingMode component (check-off logic, TripSummary dialog, cancel flow)
2. RxDB hooks (useRxDb, useSync)
3. Form validation and error states
4. Set coverage thresholds in `vitest.config.ts`

---

#### 2. No CI runs any tests

**Files**: `.github/workflows/docker-build.yml`, `.github/workflows/codeql.yml`, `turbo.json`

Neither CI workflow executes `npm test` or `npx playwright test`. Broken tests on `main` can go undetected indefinitely. PRs merge with no automated quality gate.

**Remediation**:
1. Add a `test` job to CI running `npm test`
2. Add a Playwright smoke job for critical journeys
3. Gate PR merges on test pass
4. Add branch protection rule requiring the test check

---

#### 3. Security tests pass by accident

**File**: `apps/e2e/tests/security/xss.spec.ts`

Every assertion is wrapped in a conditional `if (await button.isVisible({ timeout: 2000 }).catch(() => false))`. If the UI element doesn't exist (button renamed, page not loaded), the test body is silently skipped — **the test passes green without exercising any security check**.

```typescript
// Pattern found throughout xss.spec.ts
if (await createButton.isVisible({ timeout: 2000 }).catch(() => false)) {
  await createButton.click();
  // ... test logic ...
}
// If button isn't visible, test just ends. Green.
```

**Remediation**:
1. Create preconditions via DB seed so test state is deterministic
2. Remove all `if` guards — if a selector isn't found, the test should fail
3. Consider API-level security testing via Supertest instead

---

### 🟠 HIGH

#### 4. Server test coverage is extremely thin

**Files**: `apps/server/test/smoke/soft-delete.spec.ts`, `apps/server/test/sync/section-sync.spec.ts`

**What's tested**: Soft-delete behavior + section sync pull/SSE.

**Completely untested**:
- Lists CRUD (10 endpoints, complex state machine: planning → shopping → completed)
- Stores, items, sections, households, invitations CRUD
- Sync push for all 6 collections
- Sync pull for items, lists, listItems, stores, households
- Auth guard, SSE broadcast service, health controller, household overview
- Cross-household authorization (403 vs 404)
- Input validation rejection (400/422)

**Remediation**: Prioritize by business risk:
1. Lists CRUD — core domain, most complex state machine
2. Sync protocol (all collections, push + pull) — Phase 4's biggest risk
3. Stores/items CRUD
4. Invitations — security-critical
5. Auth guard — unit test in isolation

---

#### 5. E2E fixture setup via full UI flows is slow and fragile

**Files**: `apps/e2e/fixtures/with-store.ts`, `with-list.ts`, `with-items.ts`, `with-shopping-mode.ts`

The composable fixture chain builds all test state through real browser interactions:

```
authenticated → with-household → with-store → with-list → with-items → with-shopping-mode
```

A test using `with-shopping-mode` runs **20+ browser interactions before the first assertion**. Each step performs real UI navigation and form filling with fixed delays.

**Risk**:
1. Tests are extremely slow (10-30 seconds per test, compounds across 18+ spec files × 3 browsers)
2. Any UI layout change breaks the fixture chain across all dependent tests
3. Selectors like `input[placeholder*="add" i]` are very fragile

**Remediation**: For prerequisite fixtures (user, household, store), use DB seeding via `db-seed.ts`:
1. Extend `seedIsolatedUserWithHousehold` to optionally create stores, lists, and items directly in SQLite
2. Reserve UI-driven setup only for tests that specifically test the creation flow
3. Hybrid approach: DB-seed user/household/store, UI-create the list

---

#### 6. `waitForTimeout()` everywhere — inherently flaky

**Files**: `helpers/shopping-helpers.ts`, `helpers/store-helpers.ts`, `helpers/list-helpers.ts`, multiple spec files

Pattern found extensively:
- `await page.waitForTimeout(2000)` — `shopping-helpers.ts:13, 34`
- `await page.waitForTimeout(500)` — `store-helpers.ts:26, 47, 108`
- `await page.waitForTimeout(1000)` — `store-helpers.ts:47`
- `await page.waitForTimeout(3000)` — `store-helpers.ts:130`
- `await page.waitForTimeout(15000)` — max timeout in `addItemToList`
- `startShopping()` uses `waitForTimeout(2000)` instead of proper assertions

Fixed delays are timing-dependent — too slow on CI, wasted time locally. Guarantees flakiness at scale.

**Remediation**: Replace every `waitForTimeout(N)` with behavior-driven waits:
- `await expect(someElement).toBeVisible({ timeout: N })`
- `page.waitForResponse()` for API calls
- `page.waitForURL()` for navigation
- Avoid `page.waitForLoadState('networkidle')` — hangs on SSE connections

---

### 🟡 MEDIUM

#### 7. Serial-only server tests will become a bottleneck

**File**: `apps/server/vitest.config.ts`

Configuration enforces `singleFork: true`, `fileParallelism: false` due to shared `test.db` SQLite file. With 2 spec files this is fine; at 20+ the suite runtime grows linearly.

**Remediation** (pick one before reaching 5+ spec files):
1. Switch to `:memory:` SQLite with migrations applied per-file — simplest
2. Template database: copy `test.db` per worker — moderate complexity
3. Dockerized Postgres per test file — highest fidelity, slower setup

---

#### 8. Fragile selectors, inconsistent `data-testid` strategy

**Files**: All e2e helpers and spec files

Only 3-4 `data-testid` values exist. Everything else uses fragile locators:

| Locator pattern | Risk |
|----------------|------|
| `[data-testid="..."]` | ✅ Good (but rare) |
| `button:has-text("...")` | Fragile to text changes |
| `input[placeholder*="add" i]` | Extremely fragile |
| `locator('..').locator('..')` parent traversal | Extremely fragile |
| `getByRole('link', { name: /settings/i })` | ✅ Good |

**Remediation**:
1. Define `data-testid` on every interactive element
2. Create a `testids.ts` constants file
3. Refactor helpers to use `[data-testid]` exclusively
4. Ban `locator('..')` parent traversal

---

#### 9. Cross-test data leaks

**Files**: `apps/e2e/helpers/db-seed.ts`, `apps/e2e/fixtures/multi-user.ts`

`seedIsolatedUserWithHousehold` hard-deletes all households owned by the test user before creating new ones. Fine with `workers: 1` but prevents parallel execution. No `afterEach` cleanup. Tests use hardcoded user IDs (`dev-user-1`).

**Remediation**:
1. Add `afterEach` cleanup in fixture definitions
2. Use unique UUIDs per test run
3. Consider schema-per-test or transaction-rollback for stronger isolation

---

#### 10. Brittle time-based logic in server tests

**File**: `apps/server/test/sync/section-sync.spec.ts`

```typescript
await new Promise((r) => setTimeout(r, 2)); // ensure distinct updatedAt
```

Tests rely on real-time delay to guarantee distinct `updatedAt` values for checkpoint assertions. Fragile on overloaded CI.

**Remediation**: Use fake timers (`vi.useFakeTimers()`) or insert rows with explicit timestamps via direct DB manipulation.

---

#### 11. SSE test uses raw `http` module, bypassing supertest

**File**: `apps/server/test/sync/section-sync.spec.ts`

Manually starts an HTTP server listener, uses raw `require('http').get()`, manually parses event-stream data. Requires manual port allocation, hardcoded `setTimeout(reject, 3000)`. Cannot easily test multiple events or reconnection.

**Remediation**: Use `supertest` with streaming support or `eventsource` package. Wrap in a helper that properly parses SSE.

---

#### 12. Debug spec file in production test suite

**File**: `apps/e2e/tests/debug/session-debug.spec.ts`

Contains `console.log()` statements, takes screenshots to `test-results/auth-debug.png`. A development debugging aid in the test suite.

**Remediation**: Delete or move to a `playwright/sandbox/` directory outside `tests/`.

---

### 🟢 LOW

#### 13. No performance/degradation/snapshot tests

No test coverage for API response time thresholds, large-list rendering (100+ items), concurrent shopping, memory leaks in SSE, or visual regression.

**Remediation**: Low priority. Plan for Lighthouse CI, Playwright visual snapshots, and `k6`/`artillery` load tests later.

---

#### 14. Skipped tests with no tracking

**Files**: `collaboration.spec.ts` (2 skipped), `first-time-user.spec.ts` (1 skipped)

Three `test.skip()` calls with TODO comments but no issue references. Will silently rot.

**Remediation**: Delete and create tracked tickets, or convert to `test.fixme()` with issue links.

---

#### 15. `with-items` fixture duplicates list creation

**File**: `apps/e2e/fixtures/with-items.ts`

The `with-items` fixture overrides the parent's `list`, re-creating a list the parent already made. Wastes a full browser interaction.

**Remediation**: Don't override `list` — use the parent's list and add items to it. Or restructure to extend `with-store` directly.

---

#### 16. Missing negative/error-path tests at all layers

Only `jwt.spec.ts` tests 401s and `soft-delete.spec.ts` tests upsert edge cases. No:
- 404 for non-existent resources
- 403 for cross-household access
- 400/422 for invalid inputs
- Concurrent modification conflicts
- Network failure recovery
- RxDB sync conflict resolution

**Remediation**: Add validation rejection tests, cross-household authorization tests, and error recovery tests.

---

#### 17. Real email in test fixtures

**File**: `apps/e2e/fixtures/users.ts`

```typescript
charlie: {
  email: 'bhagwat.chaitanya@gmail.com', // real email
}
```

**Remediation**: Replace with a fake test email or remove the unused fixture.

---

## Strategic Recommendation

### Kill Playwright. Build Vitest. Keep 3 Playwright smokes.

**Rationale**: For a local-first sync app in Phase 4/5, 80% of real risks (sync corruption, soft-delete cascades, state machine edge cases, auth bypass) live at the API/data layer — where Playwright doesn't reach. Playwright tests the 20% you can mostly cover with component tests.

### The Healthy Testing Pyramid

```
         ┌──┐
         │PW│     2-3 smoke specs (critical user journeys)
         └──┘     Run nightly on CI, 1 browser only
        ┌────┐
        │Web │    15-25 component tests
        └────┘    ShoppingList, TripSummary, ItemSearch, form validation
       ┌──────┐
       │Server│   50-80 integration tests ← THE BULK
       └──────┘   API CRUD, sync protocol, auth, soft-delete cascade, state machines
      ┌────────┐
      │  Unit  │  20-30 unit tests
      └────────┘  DTO validation (Zod schemas), pure util functions, state transitions
```

### Build Priority

| Priority | Layer | What | Effort |
|----------|-------|------|--------|
| 1 | Server integration | Sync protocol (all collections, push + pull) | 3-4 days |
| 2 | Server integration | Lists, stores, items CRUD + auth | 2-3 days |
| 3 | Web components | ShoppingMode, TripSummary, hooks | 3-5 days |
| 4 | Playwright smoke | Rebuild 3 specs from scratch (API-seeded) | 2 days |
| 5 | Unit | DTO validation, pure helpers | Opportunistic |

### Immediate Actions (Week 1)

1. Add CI test workflow — run `npm test` on push/PR
2. Delete `tests/debug/session-debug.spec.ts`
3. Extend `soft-delete.spec.ts` to cover List + Item unique constraint collisions (the #1 domain model finding)
4. Add sync push integration tests for `listItems` and `items` (highest Phase 4 risk)
