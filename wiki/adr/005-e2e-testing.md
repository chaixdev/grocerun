# ADR 005: E2E Testing with Playwright + Vitest

**Status:** Superseded by [ADR 008](./008-testing-strategy-revision.md) (2026-06-10)  
**Date:** 2026-01-10  
**Updated:** 2026-06-10 — Marked superseded  
**Deciders:** Development Team  
**Context:** Phase 2 Complete - Need Testing Strategy for Local-First Architecture

> ⚠️ **This ADR is superseded.** The architecture has shifted (Next.js purge, RxDB local-first without service workers), the Playwright suite is dead (87 failures, last run March 2026), and a Vitest-dominant testing pyramid is now the strategy. See [ADR 008](./008-testing-strategy-revision.md) for the current approach.

---

## Context

After completing Phase 2 (NestJS API migration) and database consolidation, we need a robust testing strategy to:

1. **Validate Phase 2 migrations** - Ensure all 37 server actions work correctly via API
2. **Enable safe refactoring** - Phase 3 (client-side fetching) and **Phase 4 (RxDB local-first)** will touch all data flows
3. **Catch regressions early** - Manual testing is time-consuming and error-prone
4. **Production readiness** - Automated validation of critical user flows
5. **Prevent breaking changes** - Future architectural changes need safety net
6. **🔴 Critical: Local-First Architecture Support** - Must support offline testing, service workers, IndexedDB/RxDB validation, and multi-device sync

**Current Testing Gaps:**
- No automated UI tests
- No integration tests across web + server
- Manual testing only (shopping flow, household management, etc.)
- No CI/CD validation before deployment
- **No capability to test offline-first PWA behavior (required for Phase 4)**

**Target Architecture (Phase 4):**
- React SPA + RxDB (local-first database)
- Service workers for offline sync
- IndexedDB for persistence
- Multi-device synchronization with conflict resolution

**⚠️ Tool Selection Constraint:** Testing tool must support service workers, offline scenarios, and direct IndexedDB access.

---

## Decision

**We will implement a hybrid testing strategy:**

1. **Playwright** for E2E tests in `apps/e2e` workspace
2. **Vitest** for RxDB unit/integration tests and component testing

### Why Playwright + Vitest?

**Playwright for E2E:**
- ✅ **Service Worker Support** - Full support for testing offline-first PWA behavior (critical for Phase 4)
- ✅ **Multi-Browser Testing** - Chrome, Firefox, and **Safari/WebKit** (essential for iOS PWA)
- ✅ **Direct IndexedDB Access** - Can validate RxDB state directly via `page.evaluate()`
- ✅ **Offline Testing** - Native `context.setOffline()` for true offline scenarios
- ✅ **3x Faster** - Than Cypress with free parallel execution (Cypress requires $75/month)
- ✅ **Trace Viewer** - Excellent debugging for complex sync scenarios
- ✅ **Future-Proof** - Built for modern web apps with service workers

**Vitest for Units:**
- ✅ **RxDB Testing** - Perfect for conflict resolution, sync logic, replication strategies
- ✅ **Component Testing** - Fast, lightweight tests with Testing Library
- ✅ **Fastest Execution** - Unit tests run in ~2 minutes
- ✅ **Native TypeScript** - First-class TypeScript support
- ✅ **Complements Playwright** - Different testing layers, no overlap

**See [Testing Tool Evaluation](../planning/testing-tool-evaluation.md) for comprehensive analysis of why Playwright beats Cypress for local-first architecture.**

### Architecture

```
grocerun/
├── apps/
│   ├── web/          # Next.js app (port 3000)
│   │   └── src/
│   │       ├── db/
│   │       │   └── __tests__/           # Vitest RxDB tests
│   │       │       ├── rxdb.test.ts
│   │       │       ├── sync.test.ts
│   │       │       └── conflicts.test.ts
│   │       └── components/
│   │           └── __tests__/           # Vitest component tests
│   ├── server/       # NestJS API (port 3001)
│   └── e2e/          # ← Playwright workspace
│       ├── tests/
│       │   ├── shopping-flow.spec.ts    # E2E user flows
│       │   ├── offline.spec.ts          # Offline scenarios
│       │   ├── sync.spec.ts             # Service worker sync
│       │   └── multi-device.spec.ts     # Concurrent edits
│       ├── fixtures/
│       │   └── test-data.ts
│       ├── playwright.config.ts
│       └── package.json
├── package.json       # Root workspace config
└── .github/workflows/
    └── test.yml       # CI integration (Playwright + Vitest)
```

### Test Coverage Priority

**Playwright E2E Tests (~30 tests):**

**Phase 1: Critical User Flows (P0)**
```typescript
✓ Login/Authentication
✓ First-time onboarding (create household)
✓ Store management (CRUD)
✓ Shopping workflow:
  - Create list
  - Add items (with/without sections)
  - Start shopping
  - Check items off
  - Complete list
✓ 🔴 Offline shopping (add items offline, sync when online)
✓ 🔴 Service worker background sync
```

**Phase 2: Local-First Scenarios (P1)**
```typescript
✓ 🔴 Multi-device sync (changes on Device A → Device B)
✓ 🔴 Conflict resolution (concurrent edits, last-write-wins)
✓ 🔴 Offline-first flows (network offline → actions → network online → verify sync)
✓ 🔴 Service worker lifecycle (install, activate, update)
✓ Invitation flow (create, join, revoke)
✓ Section management (create, reorder, delete)
✓ Item search and suggestions
```

**Phase 3: Cross-Browser (P1)**
```typescript
✓ 🔴 iOS Safari (PWA behavior, offline, IndexedDB)
✓ Firefox (service worker compatibility)
✓ Chrome (baseline functionality)
```

**Vitest Unit/Integration Tests (~130 tests):**

**RxDB Logic (~50 tests)**
```typescript
✓ Conflict resolution strategies (last-write-wins, CRDT)
✓ Replication state management
✓ Data migrations and schema evolution
✓ Query performance and indexing
✓ Sync triggers and error handling
```

**Component Tests (~80 tests)**
```typescript
✓ List component (add, remove, toggle items)
✓ Store management UI
✓ Section reordering
✓ Item search and suggestions
✓ Optimistic UI updates
```

### Implementation Details

**Playwright Configuration:**
```typescript
// apps/e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit', // Critical for iOS Safari testing
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Vitest Configuration:**
```typescript
// apps/web/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/'],
    },
  },
});
```

**Package Scripts:**
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:unit": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## Alternatives Considered

### 1. Cypress ❌

**Pros:**
- Excellent developer experience
- Time-travel debugging
- Large community for Next.js projects
- Easy learning curve

**Cons (Deal-Breakers for Local-First):**
- ❌ **No service worker support** - Cannot test offline-first PWA behavior
- ❌ **No Safari/WebKit** - Cannot test iOS PWA (20% of mobile users)
- ❌ **Limited offline testing** - Can only simulate network failures, not true offline state
- ❌ **3x slower** - Than Playwright
- ❌ **Paid parallelization** - $75/month (Playwright is free)
- ❌ **Iframe limitations** - Issues with service workers and storage APIs

**Decision:** Excellent for traditional SSR apps, but inadequate for local-first architecture. **See [Testing Tool Evaluation](../planning/testing-tool-evaluation.md) for detailed comparison.**

### 2. Vitest + Testing Library ✅ (Adopted for Units)

**Pros:**
- ✅ Perfect for RxDB logic testing (conflict resolution, sync)
- ✅ Very fast execution (~2 minutes)
- ✅ Great for component/unit tests
- ✅ Native TypeScript support

**Cons:**
- ❌ Not true E2E testing
- ❌ Can't test service workers

**Decision:** Essential for RxDB unit tests. Complements Playwright.

### 3. Puppeteer

**Pros:**
- Service worker support
- Mature and stable (Google Chrome team)
- Large community (88k stars)

**Cons:**
- ❌ **Chrome only** - No Firefox or Safari
- ❌ Lower-level API (more boilerplate)
- ❌ No built-in test runner
- ❌ No trace viewer

**Decision:** Playwright is "Puppeteer done right" - same capabilities, better DX.

### 4. TestCafe

**Pros:**
- Multi-browser support
- TypeScript support

**Cons:**
- ❌ 2x slower than Playwright
- ❌ Smaller community (9k stars)
- ❌ Limited service worker support

**Decision:** No compelling advantage over Playwright.

### 5. External Test Repository

**Pros:**
- Keeps app repo clean
- Can test deployed environments

**Cons:**
- ❌ Harder to keep tests in sync with code
- ❌ Slower feedback loop
- ❌ More complex CI setup
- ❌ Misses benefits of monorepo shared types/configs

**Decision:** In-monorepo is best for our workflow.

---

## Consequences

### Positive

✅ **Future-Proof for Local-First** - Only solution that supports service workers, offline testing, and RxDB validation  
✅ **Multi-Browser Coverage** - Chrome, Firefox, **Safari** (critical for iOS PWA)  
✅ **Fast Execution** - Playwright 3x faster than Cypress, Vitest even faster  
✅ **Cost Savings** - Free parallel execution (vs Cypress $75/month)  
✅ **Direct RxDB Testing** - Can validate IndexedDB state and conflict resolution  
✅ **Comprehensive Coverage** - E2E + unit + component tests  
✅ **Safe Refactoring** - Can confidently migrate to local-first  
✅ **Excellent Debugging** - Trace viewer for complex sync issues  
✅ **CI/CD Ready** - Fast feedback (<8 minutes for full suite)  
✅ **Shared types** - Can import from web app in Playwright tests  
✅ **Full stack coverage** - Tests web UI + NestJS API + database

### Negative

⚠️ **Setup Time** - Initial setup (~3-4 hours for both tools)  
⚠️ **Learning Curve** - Playwright more verbose than Cypress (but more predictable)  
⚠️ **Maintenance** - Tests need updates when features change  
⚠️ **CI Time** - Adds ~8 minutes to CI pipeline (E2E + units)  
⚠️ **Browser Downloads** - Playwright downloads browsers (~1GB)  
⚠️ **Two Tools** - Maintain Playwright + Vitest (but complementary)

### Mitigations

- **Learning curve:** Excellent documentation, clear examples, AI-friendly API
- **Speed:** Parallel execution, sharding across CI workers
- **Maintenance:** Keep tests behavior-focused, not implementation-specific
- **Browser size:** Cache in CI, only download once

---

## Implementation Plan

### Phase 1: Setup Playwright + Vitest (2-3 hours)

**Playwright:**
```bash
cd apps/e2e
npm init playwright@latest
npx playwright install --with-deps
```

**Vitest:**
```bash
cd apps/web
npm install -D vitest @testing-library/react @testing-library/jest-dom happy-dom
```

Configure both tools, add npm scripts, setup GitHub Actions.

### Phase 2: Critical E2E Tests (3-4 hours)

**Playwright P0 Scenarios:**
- AUTH-001, 002, 005, 006: Authentication flows
- LIST-001, 003, 006, 007, 010: Shopping workflow
- **OFFLINE-001:** Add items offline, sync when online
- **SYNC-001:** Service worker background sync
- STORE-005, 006: Access control
- **EDGE-007, 008:** XSS and SQL injection protection

### Phase 3: RxDB Unit Tests (2-3 hours)

**Vitest RxDB Logic:**
- Conflict resolution (last-write-wins)
- Sync strategies (pull, push, bidirectional)
- Data migrations
- Query optimization
- Replication state management

### Phase 4: Local-First Scenarios (3-4 hours)

**Playwright Advanced:**
- **MULTI-DEVICE-001:** Changes on Device A → Device B
- **CONFLICT-001:** Concurrent edits resolution
- **OFFLINE-002:** Complete shopping trip offline
- **SYNC-002:** Slow network (3G) handling
- **SAFARI-001:** iOS Safari PWA behavior

### Phase 5: Component + API Tests (2-3 hours)

**Vitest Components:**
- List component (add, remove, toggle)
- Item search and suggestions
- Section reordering
- Optimistic UI updates

**Playwright API:**
- API validation, auth, rate limiting

### Phase 6: CI/CD Integration (1-2 hours)

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
  
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
```

**Total Estimate:** 13-19 hours (more comprehensive than Cypress-only approach)

---

## Success Metrics

✅ **E2E Coverage:** 30+ Playwright tests covering critical flows + offline scenarios  
✅ **Unit Coverage:** 80%+ code coverage for RxDB logic and components  
✅ **Speed:** E2E tests <6 minutes, unit tests <2 minutes (total <8 minutes)  
✅ **Reliability:** <5% flakiness rate (tests pass consistently)  
✅ **Multi-Browser:** All tests pass in Chrome, Firefox, Safari  
✅ **Offline Support:** 100% of offline-first scenarios validated  
✅ **CI Integration:** Tests run on every PR automatically  
✅ **Quality Gate:** Zero critical bugs in tested flows reach production

---

## References

- **[Testing Tool Evaluation](../planning/testing-tool-evaluation.md)** - Comprehensive analysis of why Playwright beats Cypress for local-first
- [Test Scenarios](../planning/test-scenarios.md) - Detailed test case specifications (79 scenarios)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Vitest Documentation](https://vitest.dev/guide/)
- [RxDB Testing Guide](https://rxdb.info/testing.html)

---

## Related ADRs

- [ADR 001](./001-phase2-api-approach.md) - Phase 2 API migration
- [ADR 002](./002-evolutive-architecture.md) - Evolutive architecture approach
- [ADR 003](./003-jwt-authentication.md) - JWT authentication
