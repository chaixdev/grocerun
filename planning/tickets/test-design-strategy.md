# Test Design Strategy

**Version:** 1.0  
**Date:** 2026-01-10  
**Status:** Active  
**Owner:** Development Team

---

## Executive Summary

This document defines our testing strategy for Grocerun using Playwright (E2E) and Vitest (unit/component). The strategy prioritizes **UI-level regression testing** to validate user workflows independent of underlying implementation, enabling safe refactoring from Phase 2 (API proxy) to Phase 3 (local-first).

**Key Principles:**
- 🎯 **UI-Focused Regression** - Tests validate user flows, not code architecture
- ⚡ **Fast Development Feedback** - Run only relevant feature tests during development (<30 seconds)
- 🔒 **Refactoring Safety Net** - Same tests validate both API proxy and local-first implementations
- 📊 **Feature Isolation** - Tests organized by domain/feature for selective execution
- 🔄 **Future-Proof** - Test structure supports local-first (offline, sync, conflict resolution) when ready

---

## Testing Philosophy

### Phase 2 (Current): UI Regression Testing

E2E tests focus exclusively on **user-visible behavior** through the browser:

- ✅ **Test UI interactions**: Click buttons, fill forms, navigate pages
- ✅ **Validate user outcomes**: See expected content, get proper feedback
- ✅ **Verify workflows**: Multi-step processes work e(5 tests)
│   ├── login.spec.ts               # @tag:auth @tag:p0
│   ├── logout.spec.ts              # @tag:auth @tag:p1
│   ├── session.spec.ts             # @tag:auth @tag:p1
│   └── protected-routes.spec.ts    # @tag:auth @tag:p0
│
├── shopping/                       # Shopping workflow (9 tests)
│   ├── create-list.spec.ts         # @tag:shopping @tag:p0
│   ├── add-items.spec.ts           # @tag:shopping @tag:p0
│   ├── shopping-mode.spec.ts       # @tag:shopping @tag:p0
│   ├── complete-flow.spec.ts       # @tag:shopping @tag:p0
│   └── edit-list.spec.ts           # @tag:shopping @tag:p1
│
├── households/                     # Household management (6 tests)
│   ├── onboarding.spec.ts          # @tag:households @tag:p0
│   ├── create.spec.ts              # @tag:households @tag:p1
│   ├── invite.spec.ts              # @tag:households @tag:p1
│   ├── join.spec.ts                # @tag:households @tag:p1
│   └── permissions.spec.ts         # @tag:households @tag:p1
│
├── stores/                         # Store management (9 tests)
│   ├── crud.spec.ts                # @tag:stores @tag:p1
│   ├── sections.spec.ts            # @tag:stores @tag:p1
│   ├── items.spec.ts               # @tag:stores @tag:p1
│   └── access-control.spec.ts      # @tag:stores @tag:p0
│
├── dashboard/                      # Dashboard & overview (3 tests)
│   └── empty-states.spec.ts        # @tag:dashboard @tag:p1
│
├── security/                       # Security validation (3 tests)
│   ├── xss.spec.ts                 # @tag:security @tag:p0
│   ├── sql-injection.spec.ts       # @tag:security @tag:p0
│   └── jwt.spec.ts                 # @tag:security @tag:p0
│
├── api/                            # Direct API testing (4 tests)
│   ├── validation.spec.ts          # @tag:api @tag:p0
│   ├── authorization.spec.ts       # @tag:api @tag:p0
│   └── errors.spec.ts              # @tag:api @tag:p1
│
└── _future/                        # Phase 3: Local-first (not yet implemented)
    └── sync/                       # @tag:local-first @tag:phase3
        ├── offline-shopping.spec.ts
        ├── background-sync.spec.ts
        ├── multi-device.spec.ts
        └── conflict-resolution.spec.ts
│   └── permissions.spec.ts         # @tag:households @tag:p1
│
├── stores/                         # Store management feature
│   ├── crud.spec.ts                # @tag:stores @tag:p1
│   ├── sections.spec.ts            # @tag:stores @tag:p1
│   └── access-control.spec.ts      # @tag:stores @tag:p0
│
├── sync/                           # Local-first sync feature
│   ├── background-sync.spec.ts     # @tag:sync @tag:local-first @tag:p0
│   ├── multi-device.spec.ts        # @tag:sync @tag:local-first @tag:p1
│   ├── conflict-resolution.spec.ts # @tag:sync @tag:local-first @tag:p1
│   └── slow-network.spec.ts        # @tag:sync @tag:local-first @tag:p2
│
└── api/                            # Direct API testing
    ├── validation.spec.ts          # @tag:api @tag:p0
    ├── auth-endpoints.spec.ts      # @tag:api @tag:p0
    └── rate-limiting.spec.ts       # @tag:api @tag:p1

apps/web/src/
├── db/__tests__/                   # RxDB unit tests
│   ├── rxdb.test.ts                # @tag:rxdb @tag:unit
│   ├── sync.test.ts                # @tag:rxdb @tag:unit @tag:local-first
│   └── conflicts.test.ts           # @tag:rxdb @5 tests | ~15s |
| `@tag:shopping` | Shopping list workflow | 9 tests | ~30s |
| `@tag:households` | Household management | 6 tests | ~20s |
| `@tag:stores` | Store & section CRUD | 9 tests | ~25s |
| `@tag:dashboard` | Dashboard & empty states | 3 tests | ~10s |
| `@tag:security` | XSS, SQL injection, JWT | 3 tests | ~10s |
| `@tag:api` | Direct API endpoint tests | 4 tests | ~15s |
| `@tag:local-first` | Phase 3: Offline/sync (future) | 0 tests | N/A |
| `@tag:phase3` | Deferred until local-first migration | 0 tests | N/A

---

## Tagging Strategy

### Priority Tags

Tags determine when and how often tests run:

| Tag | Description | Run Frequency | Dev | CI |
|-----|-------------|---------------|-----|-----|
| `@tag:p0` | **Critical path** - Must pass for release | Every commit | ✅ Always | ✅ Always |
| `@tag:p1` | **Important features** - Should pass before deploy | On PR | ⚠️ Optional | ✅ Always |
| `@tag:p2` | **Secondary features** - Nice to have coverage | Nightly | ❌ Skip | ⚠️ Optional |
| `@tag:p3` | **Edge cases** - Low priority | Weekly | ❌ Skip | ❌ Skip |

### Feature Tags

Tags for selective execution by domain:

| Tag | Description | Tests | Avg Duration |
|-----|-------------|-------|--------------|
| `@tag:auth` | Authentication & authorization | 6 tests | ~15s |
| `@tag:shopping` | Shopping list workflow | 13 tests | ~45s |
| `@tag:households` | Household management | 8 tests | ~30s |
| `@tag:stores` | Store & section CRUD | 11 tests | ~35s |
| `@tag:sync` | Local-first sync scenarios | 8 tests | ~60s (includes offline) |
| `@tag:api` | Direct API endpoint tests | 8 tests | ~20s |
| `@tag:local-first` | Offline/sync/conflict tests | 15 tests | ~90s |

### Special Tags

| Tag | Description | U5 seconds | Skip during rapid iteration |
| `@tag:flaky` | Known flaky tests (needs fixing) | Quarantine until fixed |
| `@tag:skip-ci` | Skip in CI temporarily (with ticket) | WIP features |
| `@tag:phase3` | Future local-first tests | Reference only, not run |
| `@tag:slow` | Tests >10 seconds (offline, multi-device) | Skip during rapid iteration |
| `@tag:flaky` | Known flaky tests (needs fixing) | Quarantine until fixed |
| `@tag:skip-ci` | Skip in CI temporarily (with ticket) | WIP features |

---

## Execution Strategies

### 1. Development Mode (Fast Feedback)

**Goal:** <30 seconds feedback for current feature work

#### Scenario A: Working on Shopping Feature
```bash
# Run only shopping tests (P0 + P1)
npm run test:e2e -- --grep "@tag:shopping"

# Run only critical shopping tests (P0)
npm run test:e2e -- --grep "@tag:shopping.*@tag:p0"

# Watch mode for rapid iteration
npm run test:e2e -- --grep "@tag:shopping" --ui
```

**Expected Duration:** ~90 seconds (8 E2E + 15 unit tests)

#### Scenario C: Quick Pre-Commit Check
```bash
# Run smoke tests only (1-2 per feature)
npm run test:smoke

# Alternative: P0 tests only (critical path)
npm run test:critical
```

**Expected Duration:** ~2 minutes (15 smoke tests)

---

### 2. CI/CD Mode (Comprehensive Regression)

**Goal:** Full coverage, all browsers, all priorities

#### Pull Request Pipeline
```yaml
# .github/workflows/test90 seconds (10 smoke tests)

#### Scenario C: Working on Local-First Sync (Phase 3 Future)
```bash
# Phase 3: When implementing local-first architecture
npm run test:e2e -- --grep "@tag:local-first"

# Include RxDB unit tests
npm run test:unit -- --grep "sync|conflict"

# Combined (E2E + unit)
npm run test:feature:sync
```

**Expected Duration:** ~90 seconds (TBD - not yet implemented
name: PR Tests
on: [pull_request]

jobs:
  smoke:
    name: Smoke Tests (Fast Gate)
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:smoke
    timeout-minutes: 3
  
  e2e-critical:
    name: E2E Critical (P0)
    needs: smoke
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test --grep "@tag:p0" --project=${{ matrix.browser }}
    timeout-minutes: 5
  
  e2e-full:
    name: E2E Full Suite (P0 + P1)
    needs: e2e-critical
    runs-on: ubuntu-l5est
    steps:
      - run: npx playwright test --grep "@tag:local-first"
    timeout-minutes: 10
```

**Expected Duration:** ~8-10 minutes (parallel execution)

#### Main Branch Pipeline
```yaml
# .github/workflows/test-main.yml
name: Main Branch Tests
on:
  push:
    branches: [main]

jobs:
  full-regression:
    name: Full Regression Suite
    strategy:
      matrix:5-6
        browser: [chromium, firefox, webkit]
        priority: [p0, p1, p2]
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test --grep "@tag:${{ matrix.priority }}" --project=${{ matrix.browser }}
    timeout-minutes: 15
```

**Expected Duration:** ~12-15 minutes (includes P2 tests)

#### Nightly Pipeline
```yaml
# .github/workflows/test-nightly.yml
name: Nightly Full Suite
on:
  scruns-on: ubuntu-latest
    steps:
      - run: npx playwright test --grep "@tag:p0|@tag:p1" --project=${{ matrix.browser }}
    timeout-minutes: 8
```

**Expected Duration:** ~6-8 minutes (all browsers
    "test:feature:auth": "playwright test --grep '@tag:auth'",
    "test:feature:shopping": "playwright test --grep '@tag:shopping'",
    "test:feature:households": "playwright test --grep '@tag:households'",
    "test:feature:stores": "playwright test --grep '@tag:stores'",
    "test:feature:sync": "playwright test --grep '@tag:sync' && vitest run --grep 'sync|conflict'",
    
    "test:local-first": "playwright test --grep '@tag:local-first'",
    
    "// ============ CI/CD (Comprehensive) ============",
    "test:e2e": "playwright test",
    "test:e2e:p0": "playwright test --grep '@tag:p0'",
    "test:e2e:p1": "playwright test --grep '@tag:p0|@tag:p1'",
    "test:e2e:chromium": "playwright test --project=chromium",
    "test:e2e:firefox": "playwright test --project=firefox",
    "test:e2e:webkit": "playwright test --project=webkit",
    
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    
    "test:all": "npm run test:e2e && npm run test:unit",
    
    "// ============ DEBUGGING ============",
    "test:debug": "playwright test --debug",
    "test:ui": "playwright test --ui",
    "test:headed": "playwright test --headed",
    "test:trace": "playwright test --trace on"
  }
}
```

---

## Playwright Configuration

### Feature-Based Test Projects

```typescript
// apps/e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: processdashboard": "playwright test --grep '@tag:dashboard'",
    "test:feature:security": "playwright test --grep '@tag:security
    ? [['html'], ['github'], ['list']]
    : [['html'], ['list']],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Browsall": "npm run test:e2e",
    
    "// ============ PHASE 3: Local-First (Future) ============",
    "test:local-first": "playwright test --grep '@tag:local-first'",
    "test:feature:sync": "playwright test --grep '@tag:sync'
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Feature-based projects (for selective execution)
    {
      name: 'smoke',
      testMatch: /.*\.spec\.ts/,
      grep: /@tag:smoke/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'local-first',
      testMatch: /sync\/.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        // Slower timeout for offline tests
        timeout: 60000,
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

---

## Test Implementation Patterns

### 1. Tagging Tests

```typescript
// tests/shopping/create-list.spec.ts
import { test, expect } from '@playwright/test';

// Multiple tags for filtering
test.describe('Create Shopping List @tag:shopping @tag:p0', () => {
  test('creates new list @tag:smoke', async ({ page }) => {
    await page.goto('/stores/123');
    await page.click('[data-testid="create-list"]');
    
    await expect(page.locator('[data-testid="list-name"]'))
      .toHaveText('Shopping List');
  });
  
  test('creates list with custom name @tag:p1', async ({ page }) => {
    // ... P1 test
  ;
```

### 2. Shared Fixtures by Feature

```typescript
// tests/shopping/fixtures.ts
import { test as base } from '@playwright/test';

type ShoppingFixtures = {
  authenticatedPage: Page;
  storeWithList: { storeId: string; listId: string };
};

export const test = base.extend<ShoppingFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/stores');
    await use(page);
  },
  
  storeWithList: async ({ authenticatedPage }, use) => {
    // Create store and list
    await authenticatedPage.goto('/stores');
    await authenticatedPage.click('[data-testid="create-store"]');
    // ...
    await use({ storeId: '123', listId: '456' });
  },
});
```

### 3. Feature Test Suites

```typescript
// tests/shopping/index.ts
// Import all shopping tests
export * from './create-list.spec';
export * from './add-items.spec';
export * from './complete-flow.spec';
export * from './offline-shopping.spec';
```

---Future: Phase 3 local-first test
test.describe('Offline Shopping @tag:shopping @tag:local-first @tag:phase3 @tag:slow', () => {
  test.skip('adds items while offline - Phase 3 only', async ({ page, context }) => {
    await context.setOffline(true);
    // ... offline test (not implemented yet)timizations

**1. Skip Slow Tests by Default**
```typescript
// Only run slow tests when explicitly requested
test.describe('Multi-device sync @tag:slow', () => {
  test.skip(({ }, testInfo) => 
    !process.env.INCLUDE_SLOW && testInfo.project.name === 'chromium'
  );
  
  test('syncs across devices', async ({ page, context }) => {
    // ... 60+ second test
  });
});
```

**2. Parallel Execution**
```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 4 : 2, // More workers in CI
  fullyParallel: true, // Run tests in parallel
});
```

**3. Test Sharding (CI)**
```yaml
# GitHub Actions
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: npx playwright test --shard=${{ matrix.shard }}/4
```

### Vitest Optimizations

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // Run tests in parallel
    threads: true,
    
    // File-level isolation for speed
    isolate: true,
    
    // Pool for faster execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
  }),
});
```

```typescript
// Phase 3 tests are marked as .skip() until local-first implementation
test.describe('Multi-device sync @tag:local-first @tag:phase3', () => {
  test.skip('syncs across devices - Phase 3 only', async ({ page, context }) => {
    // ... test implementation deferred

### Scenario 1: Feature Development (Shopping)

**Developer is adding "Add to List" functionality**

```bash
# Terminal 1: Start dev servers
npm run dev

# Terminal 2: Watch shopping tests
npm run test:feature:shopping -- --ui

# Makes code changes...
# Playwright UI automatically re-runs shopping tests
# Gets feedback in ~30 seconds
```

**Before Committing:Future: if suite grows large)**
```yaml
# GitHub Actions - only if needed for >100 tests
strategy:
  matrix:
    shard: [1, 2]
steps:
  - run: npx playwright test --shard=${{ matrix.shard }}/2Commit when both pass

---

### Scenario 3: Bug Fix in Auth

**Fixing login issue**

```bash
# Run only auth tests during fix
npm run test:feature:auth -- --ui

# Debug specific test
npm run test:debug -- tests/auth/login.spec.ts

# Once fixed, run smoke to ensure no regression
npm run test:smoke
```

---

## CI/CD Pipeline Design

### Fast Fail Strategy

```
┌─────────────┐
│ Smoke Tests │  (~2 min)  ← Fast gate, fail early
└──────┬──────┘
       │ Pass
       ├────────────────────────────────┐
       ▼                                ▼
┌──────────────┐                 ┌──────────┐
│ E2E Critical │  (~5 min)       │   Unit   │  (~3 min)
│   (P0 × 3)   │  Chromium       │   Tests  │
└──────┬───────┘  Firefox        └────┬─────┘
       │          Webkit               │
       │ Pass                          │ Pass
       ▼                               ▼
┌──────────────────┐          ┌──────────────┐
│  E2E Full (P1)   │  (~3m)  │ Local-First  │  (~10 min)
└──────────────────┘          └──────────────┘
       │ Pass                        │ Pass
       └─────────────┬───────────────┘
                     ▼
              ┌────────────┐
              │   Merge    │
              │   Ready    │
              └─Full (3 min)**
- P1 tests (~38 tests)
- Chromium only
- Important features coverage

**Stage 3b: Local-First (10 min)**
- Offline, sync, conflict resolution
- Service worker tests
- Multi-device scenarios
- Slower tests grouped together

---

## Test Data Management

### Per-Feature Test Data

```typescript
// tests/shopping/test-data.ts
export const shoppingTestData = {
  users: {
    shopper: { email: 'shopper@test.com', password: 'test123' },
    familyMember: { email: 'family@test.com', password: 'test123' },
  },
  stores: {
    walmart: { name: 'Walmart', location: '123 Main St' },
    target: { name: 'Target', location: '456 Oak Ave' },
  },
  items: {
    produce: ['Tomatoes', 'Lettuce', 'Carrots'],
    dairy: ['Milk', 'Yogurt', 'Cheese'],
    bakery: ['Bread', 'Croissants'],
  },
};

// tests/shopping/setup.ts
import { test as base } from '@playwright/test';
import { shoppingTestData } from './test-data';

### Scenario 3: Local-First Sync Work (Phase 3 Future)

**Developer implementing conflict resolution after migration**

```bash
# Terminal 1: Dev servers
npm run dev

# Terminal 2: Run s90s)  ← Fast gate, fail early
└──────┬──────┘
       │ Pass
       ▼
┌──────────────┐
│ E2E Critical │  (~3 min)
│   (P0 × 3)   │  Chromium, Firefox, WebKit
└──────┬───────┘  (parallel)
       │ Pass
       ▼
┌──────────────────┐
│  E2E Full (P1)   │  (~2 min)
│  Chromium only   │
└──────────────────┘
       │ Pass
       ▼
┌────────────┐
│   Merge    │
│   Ready    │
└────────────┘

Total: ~5-6 minutes (parallel execution)

Phase 3 Future: Add "Local-First" stage after E2E Full (~10 mi
import { test } from './setup';

test.beforeEach(async ({ page }) => {
  // Reset only shopping-related data
  await page.request.post('http://localhost:3001/test/reset', {
    data: { scope: 'shopping' },
  });
});
```

---

## Monitoring & Metrics

### Test Duration Tracking

```typescript
// playwright.config.ts
export default def~90s) - Fast Gate**
- 1 smoke test per feature (~10 total)
- Single browser (Chromium)
- Fails fast if basic functionality broken
- Prevents wasting CI time on broken builds

**Stage 2: E2E Critical (~3 min) - Parallel**
- All P0 tests (~18 tests)
- All 3 browsers (Chromium, Firefox, WebKit)
- Matrix parallelization
- Core functionality validation

**Stage 3: E2E Full (~2 min)**
- P1 tests (~27 tests)
- Chromium only
- Important features coverage

**Phase 3 Future: Local-First Stage (~10 min)**
- Offline shopping workflows
- Background sync validation
- Conflict resolution tests
- Multi-device synchronization
- Service worker tests
- **Note**: These will be added when migrating to local-first architecture"coverage": "88%", "avgDuration": "45s" },
    "households": { "tests": 8, "coverage": "82%", "avgDuration": "30s" },
    "stores": { "tests": 11, "coverage": "79%", "avgDuration": "35s" },
    "sync": { "tests": 8, "coverage": "91%", "avgDuration": "90s" }
  }
}
```

---

## Best Practices

### 1. Feature Isolation

✅ **Do:**
- Keep feature tests self-contained
- Use feature-specific fixtures
- Reset only relevant data

❌ **Don't:**
- Mix multiple features in one test file
- Share state between feature test suites
- Depend on execution order

### 2. Tag Discipline

✅ **Do:**
- Always tag with feature: `@tag:shopping`
- Always tag with priority: `@tag:p0`
- Use `@tag:smoke` for critical smoke tests
- Mark slow tests: `@tag:slow`

❌ **Don't:**
- Forget to tag new tests (won't run in feature mode)
- Over-tag (makes filtering complex)
- Use custom tags without documentation

### 3. Performance Awareness

✅ **Do:**
- Keep most tests under 5 seconds
- Group slow tests with `@tag:slow`
- Use `test.skip()` for WIP tests
- Parallelize where possible

❌ **Don't:**
- Add sleeps/waits without reason
- Run full suite during development
- Ignore slow test warnings

### 4. Test Maintenance

✅ **Do:**
- Update tests when features change
- Remove obsolete tests
- Keep test data minimal
- Document complex test scenarios

❌ **Don't:**
- Keep broken tests with `.skip()`
- Accumulate flaky tests
- Over-complicate test setup

---

## Migration Guide

### Converting Existing Tests

**Before (No Tags):**
```typescript
test('creates shopping list', async ({ page }) => {
  // ...
});
```

**After (With Tags):**
```typescript
test.describe('Shopping Lists @tag:shopping @tag:p0', () => {
  test('creates shopping list @tag:smoke', async ({ page }) => {
    // ...
  });
});
```

### Adding Feature Suites

1. Create feature direc5, "coverage": "90%", "avgDuration": "15s" },
    "shopping": { "tests": 9, "coverage": "85%", "avgDuration": "30s" },
    "households": { "tests": 6, "coverage": "80%", "avgDuration": "20s" },
    "stores": { "tests": 9, "coverage": "75%", "avgDuration": "25s" },
    "dashboard": { "tests": 3, "coverage": "100%", "avgDuration": "10s" },
    "security": { "tests": 3, "coverage": "100%", "avgDuration": "10s" },
    "api": { "tests": 4, "coverage": "85%", "avgDuration": "15s" }
  },
  "phase3": {
    "sync": { "tests": 0, "coverage": "N/A", "avgDuration": "N/A (deferred)

---

## Success Metrics

### Development Experience

- ✅ **Feature test run** <30 seconds (developer feedback)
- ✅ **Smoke tests** <2 minutes (pre-commit check)
- ✅ **Unit tests** <3 minutes (full suite)
- ✅ **Watch mode** <5 seconds (re-run after change)

### CI/CD Performance

- ✅ **PR pipeline** <10 minutes (smoke + critical + full)
- ✅ **Main pipeline** <15 minutes (includes P2)
- ✅ **Nightly** <30 minutes (all tests, all browsers)

### Quality Metrics

- ✅ **Flakiness rate** <5% (tests pass consistently)
- ✅ **Feature coverage** >80% per domain
- ✅ **P0 coverage** 100% (all critical paths)
- ✅ **Offline scenarios** 100% (all local-first flows)

---

## Future Enhancements

### Phase 1 (Immediate)
- [ ] Implement tagging strategy
- [ ] Create feature-based test directories
- [ ] Add npm scripts for feature execution
- [ ] Setup smoke test suite

### Phase 2 (Short-term)
- [ ] Add CI pipeline with fast-fail
- [ ] Implement test sharding
- [ ] Create duration tracking reporter
- [ ] Build coverage dashboard

### Phase 3 (Long-term)
- [ ] Visual regression testing (Percy/Chromatic)
- [ ] Performance benchmarking per feature
- [ ] A/B test validation
- [ ] Mobile device testing (real devices)

---

## Related Documents

- [ADR 005: E2E Testing with Playwright + Vitest](../adr/005-e2e-testing-with-cypress.md)
- [Testing Tool Evaluation](./testing-tool-evaluation.md)
- [Test Scenarios](./test-scenarios.md)
- [Product Evolution Spec](./product-evolution-spec.md)

---

## Appendix: Quick Reference

### Common Commands

```bash
# Development (fast feedback)
npm run test:feature:shopping      # Shopping feature only
npm run test:smoke                 # Quick smoke tests
npm run test:critical              # P0 tests only

# Debugging
npm run test:debug                 # Debug mode
npm run test:ui                    # Playwright UI
npm run test:headed                # See browser

# CI (comprehensive)
npm run test:all                   # Full regression
npm run test:e2e:p0                # Critical E2E
npm run test:unit                  # All unit tests
```

### Tag Reference

```
@tag:p0        Critical path (always run)
@tag:p1        Important (run in CI)
@tag:p2        Secondary (optional)
@tag:smoke     Quick validation
@tag:slow      >10 seconds
@tag:local-first   Offline/sync tests

@tag:auth      Authentication
@tag:shopping  Shopping workflow
@tag:households    Households
@tag:stores    Stores & sections
@tag:sync      Sync scenarios
@tag:api       Direct API tests
```

### Duration Targets

| Test Type | Target | Max |
|-----------|--------|-----|
| Smoke test | <5s | <10s |
| Unit test | <100ms | <500ms |
| E2E test | <5s | <10s |
| Offline test | <30s | <60s |
| Feature suite | <30s | <60s |
| Full E2E suite | <6min | <10min |
Roadmap

### Phase 2 (Current: API Proxy Architecture)
- [ ] Implement 45 UI regression tests
- [ ] Feature-based test organization
- [ ] Tagging strategy (@tag:p0, @tag:shopping, etc.)
- [ ] CI pipeline with fast-fail
- [ ] Smoke test suite

### Phase 3 (Future: Local-First Migration)
- [ ] **Keep all Phase 2 tests** - they validate the refactor didn't break UX
- [ ] Add offline workflow tests
- [ ] Add background sync tests
- [ ] Add conflict resolution tests
- [ ] Add multi-device sync tests
- [ ] Service worker validation
- [ ] Performance benchmarks (offline vs onlinesmoke     Quick validation
@tag:slow      >5 seconds

@tag:auth      Authentication
@tag:shopping  Shopping workflow
@tag:households    Households
@tag:stores    Stores & sections
@tag:dashboard Dashboard & empty states
@tag:security  XSS, SQL injection, JWT
@tag:api       Direct API tests

@tag:phase3        Phase 3 only (deferred)
@tag:local-first   Offline/sync (Phase 3)E2E test | <3s | <5s |
| Feature suite | <30s | <45s |
| Full E2E suite (P0+P1) | <3min | <5min |
| Phase 3: Offline test | <30s | <60s |
| Phase 3: Full suite | <10min | <15