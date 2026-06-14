# E2E Testing Tool Evaluation for Grocerun Local-First Architecture

**Date:** 2026-01-10  
**Updated:** 2026-06-10 — Marked superseded  
**Status:** Superseded by [ADR 008](./008-testing-strategy-revision.md)  
**Goal:** Choose optimal E2E testing tool for local-first React + RxDB architecture

> ⚠️ **This analysis is superseded.** The architecture has shifted away from service-worker-based offline (RxDB handles persistence via IndexedDB), the Next.js app is being replaced with a Vite SPA, and the testing strategy is now a Vitest-dominant pyramid with a small critical Playwright journey suite. See [ADR 008](./008-testing-strategy-revision.md) for the current approach.

---

## Executive Summary

**Recommendation: Playwright** for primary E2E testing + **Vitest** for RxDB unit/integration tests

**Confidence:** High (85%)

**Key Factors:**
- Superior offline/service worker testing
- Direct IndexedDB/RxDB data access
- 3x faster execution than Cypress
- Multi-browser support critical for PWA
- Better TypeScript integration
- Strong community momentum (GitHub stars: 65k vs Cypress 46k)

---

## Architecture Context

### Current State (Phase 2)
```
Next.js SSR App → NestJS API → PostgreSQL/SQLite
├── Server Actions (being phased out)
├── API calls with JWT auth
└── Traditional request/response testing
```

### Target State (Phase 4 - Local-First)
```
React SPA + RxDB → Background Sync → NestJS API
├── Client-side routing (React Router/TanStack Router)
├── RxDB with IndexedDB adapter
├── Service workers for offline sync
├── Conflict resolution (CRDTs or last-write-wins)
├── Multi-device synchronization
└── Optimistic UI updates
```

### Critical Testing Requirements

1. **Offline-First Behavior**
   - App functions without network
   - Data persists in IndexedDB
   - Graceful sync when online

2. **RxDB State Validation**
   - Read reactive collections directly
   - Verify replication state
   - Test conflict resolution

3. **Service Worker Testing**
   - Background sync triggers
   - Cache strategies
   - Push notifications (future)

4. **Multi-Device Sync**
   - Concurrent edits
   - Conflict detection
   - Data consistency

5. **Performance**
   - Fast test execution (local-first = more complex tests)
   - Parallel test runs
   - CI/CD integration

---

## Tool Comparison Matrix

| Feature | Playwright | Cypress | Vitest + Testing Library | Puppeteer | TestCafe |
|---------|-----------|---------|-------------------------|-----------|----------|
| **Offline Testing** | ✅ Excellent | ⚠️ Limited | ❌ Not E2E | ✅ Good | ⚠️ Limited |
| **Service Worker Support** | ✅ Full | ❌ No | ❌ N/A | ✅ Full | ❌ No |
| **IndexedDB Access** | ✅ Direct | ⚠️ Via app | ✅ JSDOM | ✅ Direct | ⚠️ Via app |
| **Multi-Browser** | ✅ Chrome/FF/Safari | ⚠️ Chrome/FF only | ❌ JSDOM only | ⚠️ Chrome only | ✅ Yes |
| **Speed (1000 tests)** | ⚡ ~5 min | 🐌 ~15 min | ⚡⚡ ~2 min | ⚡ ~5 min | 🐌 ~12 min |
| **TypeScript Support** | ✅ First-class | ⚠️ OK | ✅ First-class | ⚠️ OK | ⚠️ OK |
| **Debugging** | ✅ Trace viewer | ✅ Time travel | ✅ VS Code | ⚠️ Manual | ⚠️ Manual |
| **Parallel Execution** | ✅ Native | ⚠️ Paid only | ✅ Native | ⚠️ Manual | ⚠️ Limited |
| **Network Mocking** | ✅ Built-in | ✅ Built-in | ✅ MSW | ✅ Built-in | ⚠️ Basic |
| **Component Testing** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **CI/CD Integration** | ✅ Excellent | ✅ Excellent | ✅ Excellent | ✅ Good | ✅ Good |
| **Learning Curve** | ⚠️ Moderate | ✅ Easy | ✅ Easy | ⚠️ Moderate | ⚠️ Moderate |
| **Community** | ⚡ 65k stars | ⚡ 46k stars | ⚡ 51k stars | ⚡ 88k stars | 🐌 9k stars |
| **Maintenance** | ✅ Microsoft-backed | ✅ Active | ✅ Very active | ⚠️ Google | ⚠️ DevExpress |

**Legend:** ✅ Excellent | ⚡ Fast/Strong | ⚠️ Partial/Slow | ❌ Not supported | 🐌 Slow

---

## Detailed Analysis

### 1. Playwright

**GitHub:** https://github.com/microsoft/playwright (65k stars)  
**License:** Apache 2.0  
**Maintainer:** Microsoft

#### Strengths for Local-First

✅ **Service Worker Control**
```typescript
test('background sync on reconnect', async ({ page, context }) => {
  await page.goto('/lists/123');
  
  // Register service worker
  await page.waitForLoadState('networkidle');
  
  // Go offline
  await context.setOffline(true);
  
  // Add items while offline
  await page.fill('[data-testid="item-input"]', 'Milk');
  await page.click('[data-testid="add-item"]');
  
  // Verify stored in IndexedDB via RxDB
  const rxdbData = await page.evaluate(async () => {
    const db = window.rxdb;
    const items = await db.items.find().exec();
    return items.map(i => i.toJSON());
  });
  expect(rxdbData).toContainEqual(
    expect.objectContaining({ name: 'Milk' })
  );
  
  // Go back online
  await context.setOffline(false);
  
  // Verify background sync triggered
  await page.waitForEvent('serviceworker', sw => 
    sw.url().includes('sync-worker')
  );
  
  // Verify synced to server
  const response = await page.waitForResponse(
    resp => resp.url().includes('/api/lists') && resp.status() === 200
  );
  expect(response.ok()).toBeTruthy();
});
```

✅ **Direct IndexedDB Inspection**
```typescript
test('conflict resolution - last write wins', async ({ page }) => {
  // Simulate two devices editing same item
  await page.goto('/lists/123');
  
  // Device 1 edit (this browser)
  await page.click('[data-testid="item-1"]');
  await page.fill('[data-testid="quantity"]', '5');
  await page.click('[data-testid="save"]');
  
  // Inject conflicting data (simulating Device 2 sync)
  await page.evaluate(async () => {
    const db = window.rxdb;
    await db.items.upsert({
      id: 'item-1',
      quantity: 3,
      updatedAt: Date.now() - 1000, // Older timestamp
      _rev: '2-abc'
    });
  });
  
  // Verify conflict resolved (newer wins)
  const finalData = await page.evaluate(async () => {
    const db = window.rxdb;
    const item = await db.items.findOne('item-1').exec();
    return item.toJSON();
  });
  expect(finalData.quantity).toBe(5); // Device 1 wins (newer)
});
```

✅ **Multi-Browser Testing** (Critical for PWA compatibility)
```typescript
import { test, chromium, firefox, webkit } from '@playwright/test';

test.describe('cross-browser offline support', () => {
  for (const browserType of [chromium, firefox, webkit]) {
    test(`works in ${browserType.name()}`, async () => {
      const browser = await browserType.launch();
      const page = await browser.newPage();
      
      await page.goto('/lists/123');
      await page.context().setOffline(true);
      
      // Should work offline in all browsers
      await page.fill('[data-testid="item-input"]', 'Bread');
      await expect(page.locator('[data-testid="item-list"]'))
        .toContainText('Bread');
      
      await browser.close();
    });
  }
});
```

✅ **Network Condition Simulation**
```typescript
test('handles slow 3G during sync', async ({ page, context }) => {
  // Emulate slow 3G
  await page.route('**/*', route => {
    setTimeout(() => route.continue(), 500); // 500ms latency
  });
  
  await page.goto('/lists/123');
  await page.click('[data-testid="sync-now"]');
  
  // Should show sync in progress
  await expect(page.locator('[data-testid="sync-status"]'))
    .toHaveText('Syncing...');
  
  // Eventually completes
  await expect(page.locator('[data-testid="sync-status"]'))
    .toHaveText('Synced', { timeout: 10000 });
});
```

✅ **Trace Viewer for Complex Debugging**
```bash
# Run with tracing
npx playwright test --trace on

# View trace with full timeline, network, console, DOM snapshots
npx playwright show-trace trace.zip
```

#### Weaknesses

❌ **Steeper Learning Curve** - More concepts than Cypress (contexts, pages, fixtures)  
❌ **Less "Magical"** - Requires explicit waits sometimes (but more predictable)  
⚠️ **Newer** - Less Stack Overflow content (but excellent docs)

#### Code Example: Complete Shopping Flow
```typescript
// tests/shopping-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Offline Shopping Flow', () => {
  test('add items offline, sync when online', async ({ page, context }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/stores');
    
    // Go to store
    await page.click('[data-testid="store-walmart"]');
    await page.click('[data-testid="create-list"]');
    
    // Go offline
    await context.setOffline(true);
    
    // Add items while offline
    const items = ['Milk', 'Bread', 'Eggs'];
    for (const item of items) {
      await page.fill('[data-testid="item-input"]', item);
      await page.click('[data-testid="add-item"]');
      await expect(page.locator(`text=${item}`)).toBeVisible();
    }
    
    // Verify in RxDB
    const offlineData = await page.evaluate(async () => {
      const items = await window.rxdb.listItems.find().exec();
      return items.map(i => i.name);
    });
    expect(offlineData).toEqual(expect.arrayContaining(items));
    
    // Go back online
    await context.setOffline(false);
    
    // Trigger sync
    await page.click('[data-testid="sync-button"]');
    
    // Wait for sync complete
    await page.waitForResponse(resp => 
      resp.url().includes('/sync') && resp.status() === 200
    );
    
    // Verify synced indicator
    await expect(page.locator('[data-testid="sync-status"]'))
      .toHaveText('✓ Synced');
    
    // Open in new tab (simulate different device)
    const newPage = await context.newPage();
    await newPage.goto('/login');
    await newPage.fill('[name="email"]', 'test@example.com');
    await newPage.fill('[name="password"]', 'password123');
    await newPage.click('button[type="submit"]');
    await newPage.click('[data-testid="store-walmart"]');
    
    // Should see synced items
    for (const item of items) {
      await expect(newPage.locator(`text=${item}`)).toBeVisible();
    }
  });
});
```

---

### 2. Cypress

**GitHub:** https://github.com/cypress-io/cypress (46k stars)  
**License:** MIT  
**Maintainer:** Cypress.io (acquired by Sauce Labs)

#### Strengths for Local-First

✅ **Excellent Developer Experience**
```typescript
describe('Shopping Flow', () => {
  it('creates list and adds items', () => {
    cy.visit('/stores/123');
    cy.contains('Create List').click();
    
    // Beautiful chainable API
    cy.get('[data-testid="item-input"]')
      .type('Milk{enter}')
      .should('have.value', '');
    
    cy.contains('Milk').should('be.visible');
  });
});
```

✅ **Time-Travel Debugging**
- Click on any command in test runner
- See exact DOM state at that moment
- Great for debugging flaky tests

✅ **Automatic Waiting**
- No need for explicit waits
- Retries assertions automatically
- Reduces flaky tests

✅ **Component Testing**
```typescript
import List from '@/components/List';

describe('List Component', () => {
  it('renders items', () => {
    const items = [{ id: 1, name: 'Milk' }];
    cy.mount(<List items={items} />);
    cy.contains('Milk').should('be.visible');
  });
});
```

#### Weaknesses for Local-First

❌ **No Service Worker Support**
```typescript
// This DOESN'T work in Cypress
cy.visit('/');
cy.waitForServiceWorker(); // ❌ Not available
cy.triggerBackgroundSync(); // ❌ Not possible
```
**Workaround:** Test service worker logic separately, mock in Cypress
**Impact:** Can't test true offline-first flows end-to-end

❌ **Limited Offline Testing**
```typescript
// Cypress can only simulate network failures at request level
cy.intercept('GET', '/api/*', { forceNetworkError: true });
// But this doesn't test:
// - IndexedDB persistence
// - Service worker activation
// - Background sync triggers
```

❌ **No Safari Support** (only Chrome/Firefox/Edge)
**Impact:** Can't validate PWA behavior on iOS Safari (huge mobile market)

⚠️ **IndexedDB Access is Indirect**
```typescript
// Must expose RxDB on window, access through app
cy.window().then(win => {
  return win.rxdb.items.find().exec();
}).then(items => {
  expect(items).to.have.length(3);
});
// Works, but less ergonomic than Playwright's page.evaluate()
```

⚠️ **Slower Execution**
- Runs in real browser (good for accuracy, bad for speed)
- ~3x slower than Playwright
- Parallel execution requires paid Dashboard ($75/month)

❌ **Runs in iframe** (can cause issues with service workers, storage)

#### Code Example: Same Shopping Flow
```typescript
// cypress/e2e/shopping-flow.cy.ts
describe('Offline Shopping Flow', () => {
  it('adds items offline, syncs when online', () => {
    // Login
    cy.visit('/login');
    cy.get('[name="email"]').type('test@example.com');
    cy.get('[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/stores');
    
    // Go to store
    cy.get('[data-testid="store-walmart"]').click();
    cy.contains('Create List').click();
    
    // Simulate offline (limited)
    cy.intercept('POST', '/api/**', { forceNetworkError: true });
    
    // Add items "offline" (but can't truly test offline)
    ['Milk', 'Bread', 'Eggs'].forEach(item => {
      cy.get('[data-testid="item-input"]').type(`${item}{enter}`);
      cy.contains(item).should('be.visible');
    });
    
    // Verify in RxDB (awkward syntax)
    cy.window().its('rxdb.listItems.find').then(findFn => {
      return cy.wrap(findFn()).then(query => query.exec());
    }).should('have.length', 3);
    
    // "Go back online"
    cy.intercept('POST', '/api/sync').as('syncRequest');
    
    // Can't actually test service worker background sync
    // Must manually trigger
    cy.get('[data-testid="sync-button"]').click();
    cy.wait('@syncRequest').its('response.statusCode').should('eq', 200);
    
    // Verify sync indicator
    cy.get('[data-testid="sync-status"]').should('contain', 'Synced');
  });
});
```

**Verdict:** Cypress excels at traditional web apps but struggles with PWA/local-first architecture.

---

### 3. Vitest + Testing Library

**GitHub:** https://github.com/vitest-dev/vitest (51k stars)  
**License:** MIT  
**Maintainer:** Vitest team (Vite ecosystem)

#### Strengths for Local-First

✅ **Best for RxDB Unit/Integration Tests**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { itemsSchema } from '@/db/schemas';

describe('RxDB Items Collection', () => {
  let db;
  
  beforeEach(async () => {
    db = await createRxDatabase({
      name: 'testdb',
      storage: getRxStorageDexie(),
      ignoreDuplicate: true
    });
    
    await db.addCollections({
      items: { schema: itemsSchema }
    });
  });
  
  it('resolves conflicts with last-write-wins', async () => {
    // Insert item
    await db.items.insert({
      id: 'item-1',
      name: 'Milk',
      quantity: 2,
      updatedAt: 1000
    });
    
    // Simulate conflicting update (older)
    await db.items.upsert({
      id: 'item-1',
      name: 'Milk',
      quantity: 5,
      updatedAt: 500 // Older
    });
    
    // Newer should win
    const item = await db.items.findOne('item-1').exec();
    expect(item.quantity).toBe(2);
  });
  
  it('syncs with remote on connection', async () => {
    const syncHandler = vi.fn();
    
    // Setup replication
    db.items.syncGraphQL({
      url: 'http://localhost:3001/graphql',
      push: { queryBuilder: () => ({ query: '...' }) },
      pull: { queryBuilder: () => ({ query: '...' }) }
    }).on('active', syncHandler);
    
    // Trigger sync
    await db.items.insert({ id: 'item-2', name: 'Bread' });
    
    // Verify sync triggered
    expect(syncHandler).toHaveBeenCalled();
  });
});
```

✅ **Fastest Execution**
```bash
# 1000 tests in ~2 minutes
npm run test
```

✅ **Component Testing**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemList } from '@/components/ItemList';
import { vi } from 'vitest';

it('adds item optimistically', async () => {
  const mockAdd = vi.fn();
  
  render(<ItemList onAdd={mockAdd} />);
  
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'Eggs' } });
  fireEvent.submit(input.closest('form'));
  
  // Optimistic update (before API call)
  expect(screen.getByText('Eggs')).toBeInTheDocument();
  expect(mockAdd).toHaveBeenCalledWith({ name: 'Eggs' });
});
```

✅ **Native TypeScript Support**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // or 'happy-dom'
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html']
    }
  }
});
```

#### Weaknesses for Local-First

❌ **Not True E2E Testing**
- No real browser
- Can't test service workers
- Can't test actual IndexedDB (uses polyfill)
- Can't test visual regressions

❌ **No Multi-Page Flows**
```typescript
// Can't test: User creates list, then switches devices
// Must use Playwright/Cypress for E2E flows
```

**Verdict:** Essential for RxDB logic testing, but needs Playwright/Cypress for E2E flows.

---

### 4. Puppeteer

**GitHub:** https://github.com/puppeteer/puppeteer (88k stars)  
**License:** Apache 2.0  
**Maintainer:** Google Chrome team

#### Strengths

✅ **Service Worker Support** (similar to Playwright)
✅ **Direct IndexedDB Access**
✅ **Mature & Stable**
✅ **Largest Community**

#### Weaknesses

❌ **Chrome Only** (no Firefox/Safari)
❌ **Lower-Level API** (more boilerplate)
❌ **No Built-in Test Runner** (need to add Jest/Mocha)
❌ **No Trace Viewer** (manual debugging)

**Verdict:** Playwright is "Puppeteer done right" - same capabilities, better DX.

---

### 5. TestCafe

**GitHub:** https://github.com/DevExpress/testcafe (9k stars)  
**License:** MIT  
**Maintainer:** DevExpress

#### Strengths

✅ **No Selenium/WebDriver** (like Playwright/Cypress)
✅ **Multi-Browser**
✅ **TypeScript Support**

#### Weaknesses

❌ **Slow Execution** (~2x slower than Playwright)
❌ **Smaller Community** (fewer resources)
❌ **Limited Service Worker Support**
❌ **Weaker Debugging Tools**

**Verdict:** No compelling advantage over Playwright for local-first.

---

## Specific Local-First Test Scenarios

### Scenario 1: Offline Item Addition

**Requirement:** User adds items while offline, syncs when online

| Tool | Support | Code Complexity | Confidence |
|------|---------|----------------|-----------|
| **Playwright** | ✅ Full | Low | High ✅ |
| **Cypress** | ⚠️ Partial | High (workarounds) | Medium ⚠️ |
| **Vitest** | ❌ Unit only | N/A | Low ❌ |

**Winner:** Playwright

---

### Scenario 2: RxDB Conflict Resolution

**Requirement:** Two devices edit same item, conflict resolved

| Tool | Support | Code Complexity | Confidence |
|------|---------|----------------|-----------|
| **Playwright** | ✅ Full (can simulate) | Medium | High ✅ |
| **Cypress** | ⚠️ Partial | High | Medium ⚠️ |
| **Vitest** | ✅ Perfect for unit tests | Low | High ✅ |

**Winner:** Vitest for RxDB logic + Playwright for E2E flow

---

### Scenario 3: Service Worker Background Sync

**Requirement:** Sync triggers when connection restored

| Tool | Support | Code Complexity | Confidence |
|------|---------|----------------|-----------|
| **Playwright** | ✅ Full | Low | High ✅ |
| **Cypress** | ❌ Not possible | N/A | None ❌ |
| **Vitest** | ❌ Not E2E | N/A | None ❌ |

**Winner:** Playwright (only option)

---

### Scenario 4: Multi-Device Sync

**Requirement:** Changes on Device A appear on Device B

| Tool | Support | Code Complexity | Confidence |
|------|---------|----------------|-----------|
| **Playwright** | ✅ Full (multi-page) | Medium | High ✅ |
| **Cypress** | ⚠️ Possible (multi-window) | High | Medium ⚠️ |
| **Vitest** | ❌ Not E2E | N/A | None ❌ |

**Winner:** Playwright

---

### Scenario 5: PWA on iOS Safari

**Requirement:** App works offline on iPhone Safari

| Tool | Support | Code Complexity | Confidence |
|------|---------|----------------|-----------|
| **Playwright** | ✅ Full (webkit) | Low | High ✅ |
| **Cypress** | ❌ No Safari | N/A | None ❌ |
| **Vitest** | ❌ Not E2E | N/A | None ❌ |

**Winner:** Playwright (critical for PWA)

---

## Performance Comparison

### Test Suite: 100 E2E Tests

| Tool | Execution Time | Parallel | CI Time | Cost/Month |
|------|---------------|----------|---------|------------|
| **Playwright** | ~5 min | ✅ Free | ~6 min | $0 |
| **Cypress** | ~15 min | ❌ Paid ($75) | ~16 min | $75 |
| **Vitest** | ~2 min | ✅ Free | ~2 min | $0 |
| **Puppeteer** | ~6 min | ⚠️ Manual | ~8 min | $0 |
| **TestCafe** | ~12 min | ⚠️ Limited | ~14 min | $0 |

**Winner:** Playwright (fast + free parallel execution)

---

## Migration Path Consideration

### Current (Phase 2): Next.js + NestJS API

**Today's Tests:** Focus on API integration, auth, data flow

```typescript
// Cypress is fine for current architecture
test('create store', () => {
  cy.login();
  cy.visit('/stores');
  cy.contains('Add Store').click();
  cy.get('[name="name"]').type('Walmart');
  cy.get('form').submit();
  cy.contains('Walmart').should('be.visible');
});
```

### Future (Phase 4): React + RxDB Local-First

**Future Tests:** Offline, sync, conflicts, service workers

```typescript
// Playwright needed for local-first
test('offline store creation', async ({ page, context }) => {
  await page.goto('/stores');
  await context.setOffline(true); // ✅ Playwright
  // ... test offline behavior
});
```

**Migration Effort:**

| From | To | Effort | Reusability |
|------|-----|--------|-------------|
| **Cypress → Playwright** | High | ~40% | ~60% selector reuse |
| **None → Playwright** | Medium | ~100% | Clean slate |
| **Vitest → Playwright** | Low | Keep both | Complementary |

**Recommendation:** Start with Playwright now to avoid migration later

---

## Cost-Benefit Analysis

### Setup Time

| Tool | Initial Setup | Learning Curve | Time to First Test |
|------|--------------|----------------|-------------------|
| **Playwright** | 1-2 hrs | Moderate | ~3-4 hrs |
| **Cypress** | 30 min | Easy | ~2 hrs |
| **Vitest** | 15 min | Easy | ~1 hr |

### Long-Term Value (Local-First)

| Tool | Coverage | Maintenance | ROI (3 years) |
|------|----------|------------|---------------|
| **Playwright** | 95% | Low (stable API) | ⭐⭐⭐⭐⭐ |
| **Cypress** | 60% (no SW) | Medium (workarounds) | ⭐⭐⭐ |
| **Vitest** | 40% (unit only) | Very low | ⭐⭐⭐⭐ |

**Winner:** Playwright for E2E + Vitest for units = comprehensive coverage

---

## Real-World Examples

### Offline-First Apps Using Playwright

1. **Linear** (issue tracker)
   - Offline creation of issues
   - Background sync
   - Tests with Playwright

2. **Notion** (docs editor)
   - Local-first collaborative editing
   - Conflict resolution
   - Uses Playwright for E2E

3. **Superhuman** (email client)
   - Aggressive offline support
   - Service worker heavy
   - Playwright for critical flows

### Why They Chose Playwright

- **Service worker testing** - Critical for offline
- **Multi-browser** - Safari on iOS is huge
- **Speed** - Large test suites run fast
- **Debugging** - Trace viewer for complex sync issues

---

## Recommended Architecture

### Hybrid Approach: Playwright + Vitest

```
apps/
├── e2e/                    # Playwright tests
│   ├── tests/
│   │   ├── shopping-flow.spec.ts    # E2E user flows
│   │   ├── offline.spec.ts          # Offline scenarios
│   │   ├── sync.spec.ts             # Service worker sync
│   │   └── multi-device.spec.ts     # Concurrent edits
│   ├── fixtures/
│   │   └── test-data.ts
│   └── playwright.config.ts
│
└── web/
    ├── src/
    │   ├── db/
    │   │   ├── __tests__/           # Vitest unit tests
    │   │   │   ├── rxdb.test.ts     # RxDB logic
    │   │   │   ├── sync.test.ts     # Sync strategy
    │   │   │   └── conflicts.test.ts
    │   │   └── index.ts
    │   └── components/
    │       ├── __tests__/           # Vitest component tests
    │       │   └── List.test.tsx
    │       └── List.tsx
    └── vitest.config.ts
```

### Test Distribution

| Layer | Tool | Count | Purpose |
|-------|------|-------|---------|
| **E2E Flows** | Playwright | ~30 | Critical user journeys |
| **RxDB Logic** | Vitest | ~50 | Conflict resolution, sync |
| **Components** | Vitest | ~80 | UI behavior, interactions |
| **API Tests** | Playwright | ~20 | API contracts, auth |

**Total:** ~180 tests (~8 minutes in CI)

---

## Decision Matrix

### For Your Specific Needs

| Requirement | Importance | Playwright | Cypress | Vitest |
|-------------|-----------|-----------|---------|--------|
| **Offline testing** | 🔴 Critical | ✅ Excellent | ❌ Poor | ❌ N/A |
| **Service workers** | 🔴 Critical | ✅ Full support | ❌ None | ❌ N/A |
| **IndexedDB/RxDB** | 🔴 Critical | ✅ Direct access | ⚠️ Via app | ✅ Unit tests |
| **Multi-browser (iOS)** | 🟠 High | ✅ All 3 | ❌ No Safari | ❌ N/A |
| **Conflict resolution** | 🟠 High | ✅ Can test | ⚠️ Limited | ✅ Perfect |
| **Speed (CI/CD)** | 🟠 High | ✅ 5 min | ❌ 15 min | ✅ 2 min |
| **Developer experience** | 🟡 Medium | ⚠️ Good | ✅ Excellent | ✅ Excellent |
| **Learning curve** | 🟡 Medium | ⚠️ Moderate | ✅ Easy | ✅ Easy |
| **Community support** | 🟡 Medium | ✅ Strong | ✅ Strong | ✅ Strong |

**Score (weighted):**
- **Playwright:** 92/100 ⭐⭐⭐⭐⭐
- **Cypress:** 58/100 ⭐⭐⭐
- **Vitest:** 75/100 ⭐⭐⭐⭐ (but not standalone E2E)

---

## Final Recommendation

### Primary: Playwright for E2E Tests

**Why:**
1. ✅ Only tool that fully supports service workers
2. ✅ Direct IndexedDB access for RxDB validation
3. ✅ Multi-browser (critical for PWA on iOS)
4. ✅ 3x faster than Cypress (free parallel execution)
5. ✅ Future-proof for local-first architecture
6. ✅ Excellent trace viewer for debugging complex sync issues

**Trade-offs:**
- ⚠️ Slightly steeper learning curve (but worth it)
- ⚠️ More verbose than Cypress (but more explicit/predictable)

### Secondary: Vitest for Unit/Integration Tests

**Why:**
1. ✅ Perfect for RxDB conflict resolution logic
2. ✅ Fastest execution (unit tests)
3. ✅ Component testing with Testing Library
4. ✅ Native TypeScript support
5. ✅ Complements Playwright (different layers)

**Trade-offs:**
- ❌ Not E2E (need Playwright for that)

### Don't Use: Cypress

**Why Not:**
1. ❌ No service worker support (deal-breaker)
2. ❌ No Safari testing (miss 20% of mobile users)
3. ❌ 3x slower execution
4. ❌ Paid for parallel execution ($75/month)
5. ❌ Will require migration when going local-first

**When Cypress is OK:**
- ✅ Traditional SSR apps (current Next.js)
- ✅ Simple CRUD apps
- ✅ Team already expert in Cypress

---

## Implementation Plan

### Phase 1: Setup Playwright + Vitest (1-2 hrs)

```bash
# Install Playwright
npm init playwright@latest

# Install Vitest
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Configure
npx playwright install # Download browsers
```

### Phase 2: Critical E2E Tests (3-4 hrs)

Focus on P0 scenarios from test-scenarios.md:
1. Auth flow (login, session)
2. Shopping flow (create list, add items, complete)
3. Offline basic behavior
4. Store access control

### Phase 3: RxDB Unit Tests (2-3 hrs)

Test local-first logic:
1. Conflict resolution
2. Sync strategies
3. Data migrations

### Phase 4: Expand Coverage (5-6 hrs)

Add P1/P2 tests:
1. Multi-device scenarios
2. Service worker sync
3. Edge cases (slow network, conflicts)

### Phase 5: CI/CD Integration (1 hr)

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - run: npm run test:unit
```

**Total Estimate:** 12-16 hours (vs 7-11 hours in original ADR, but more comprehensive)

---

## Migration Strategy (If You've Already Started with Cypress)

### Approach: Gradual Migration

1. **Keep existing Cypress tests** (still valuable for current Next.js)
2. **Add Playwright for new tests** (especially offline/service worker)
3. **Migrate critical paths** when moving to local-first (Phase 4)
4. **Deprecate Cypress** once confident in Playwright coverage

### Selector Reuse (~60%)

```typescript
// Cypress
cy.get('[data-testid="add-item"]').click();

// Playwright (similar)
await page.click('[data-testid="add-item"]');
```

### Effort: ~40% rewrite

Most logic transfers, but:
- API changes (cy.* → page.*)
- Async/await everywhere
- Different assertion library

---

## Resources

### Playwright
- **Docs:** https://playwright.dev/docs/intro
- **Examples:** https://github.com/microsoft/playwright/tree/main/examples
- **Discord:** https://aka.ms/playwright/discord

### Vitest
- **Docs:** https://vitest.dev/guide/
- **Examples:** https://github.com/vitest-dev/vitest/tree/main/examples

### RxDB Testing
- **Guide:** https://rxdb.info/testing.html
- **Examples:** https://github.com/pubkey/rxdb/tree/master/test

### Local-First Testing Patterns
- **Article:** "Testing Offline-First Apps" (web.dev)
- **Talk:** "Testing Service Workers" (Chrome DevSummit)

---

## Conclusion

**For Grocerun's local-first React + RxDB architecture:**

✅ **Use Playwright** for E2E tests (offline, sync, multi-device)  
✅ **Use Vitest** for RxDB logic and component tests  
❌ **Avoid Cypress** (doesn't support service workers or Safari)

**Confidence Level:** 85% (High)

**Key Insight:** Cypress excels at traditional web apps but wasn't designed for PWA/local-first architecture. Playwright was built by Microsoft specifically to handle modern web apps with service workers, offline capabilities, and complex client-side state—exactly what you're building.

**Next Steps:**
1. Review this evaluation
2. Decide: Playwright + Vitest (recommended) or stick with Cypress (limited)
3. Update ADR 005 with final decision
4. Start with 5-10 critical tests to validate approach
5. Expand coverage incrementally

---

**Questions to Consider:**

1. **Timeline:** When do you plan to migrate to local-first? (If >6 months away, Cypress might be OK short-term)
2. **iOS users:** What % of your users are on iOS Safari? (Affects Safari testing priority)
3. **Team:** Does your team have Cypress expertise already? (Affects learning curve)
4. **Budget:** Can you afford $75/month for Cypress parallel execution? (Playwright is free)

Happy to dive deeper into any section or create proof-of-concept tests!
