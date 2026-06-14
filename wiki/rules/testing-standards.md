# Testing Standards

Canonical rules for writing tests in the Grocerun monorepo. These are enforceable — code review should flag violations.

---

## The Pyramid

Tests live at four layers. Start at the bottom; move up only when the layer below can't cover the behavior.

| Layer | Tool | Environment | What it covers | When to write |
|-------|------|------------|---------------|---------------|
| **Unit** | Vitest | Node | Pure functions, DTO validation (Zod), state machine logic | Any pure logic with branching |
| **Server integration** | Vitest + Supertest | Real NestJS + SQLite test.db | API CRUD, sync protocol, auth, soft-delete, state transitions | Every new controller endpoint. Every sync handler. |
| **Web component** | Vitest + Testing Library | jsdom | Component interactions, hooks, form validation | Every new RxDB-integrated component |
| **Playwright smoke** | Playwright | Chromium | Critical user journeys end-to-end | Only when not coverable by layers above. 3 specs ceiling. |

---

## Server Integration Tests

### Required

- Every controller endpoint gets at least one integration test (happy path + one error path)
- Every sync push/pull handler for every collection gets at least one test
- Every state machine transition (planning → shopping → completed → planning) gets a test
- Every soft-delete cascade gets a test (child records must be soft-deleted in correct order)
- Cross-household authorization: accessing another household's resources MUST return 403, not 404

### File naming

```
apps/server/test/<domain>/<feature>.spec.ts
```

Examples:
- `test/lists/crud.spec.ts`
- `test/lists/state-machine.spec.ts`
- `test/sync/listitem-push.spec.ts`
- `test/auth/household-access.spec.ts`

### Patterns

**Use the existing test infrastructure** — never build your own app bootstrap:
```typescript
import { createTestApp, agent, db, seedBaseFixtures, clearDomainData } from '../helpers';

beforeAll(async () => { app = await createTestApp(); });
afterAll(async () => { await app.close(); });
beforeEach(async () => { await clearDomainData(db(app)); await seedBaseFixtures(db(app)); });
```

**Auth is real** — use `makeTestToken()` from helpers, never mock the auth guard:
```typescript
const response = await agent(app)
  .post('/api/lists')
  .set('Authorization', `Bearer ${makeTestToken(userId)}`)
  .send({ ... });
```

**Assert on behavior, not implementation:**
```typescript
// Good
expect(response.status).toBe(201);
const created = await db(app).list.findFirst({ where: { id: response.body.id } });
expect(created.deleted).toBe(false);

// Bad
expect(mockPrisma.list.create).toHaveBeenCalledWith(...);
```

### Anti-patterns

- **No `setTimeout` for time-based assertions.** Use `vi.useFakeTimers()` or insert explicit timestamps.
- **No raw `http` module.** Use `agent()` (supertest wrapper) for all HTTP tests, including SSE streams.
- **No mocking Prisma.** Tests use real SQLite. The only acceptable mock is for external services.

---

## Web Component Tests

### Required

- Every component that manages user-editable state gets a test
- RxDB-integrated components get tests that verify optimistic updates and rollback behavior
- Form components get validation tests for every Zod/class-validator schema field

### File naming

```
apps/web/src/<path>/__tests__/<Component>.test.tsx
```

### Patterns

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Prefer userEvent over fireEvent for realistic interaction simulation
const user = userEvent.setup();
await user.click(screen.getByRole('button', { name: /add item/i }));
```

### Anti-patterns

- **No snapshot tests.** They're brittle and ignored. Test behavior, not rendered output.
- **No testing library internals.** Don't test that `useRxDb` calls a specific method. Test that clicking "Add" shows the item.

---

## Playwright Smoke Tests

### Ceiling: 3 specs

Playwright exists for one reason: verify the real user flow works in a real browser. If a scenario is testable via server integration or web component tests, it does NOT get a Playwright test.

Current 3 specs:
1. `smoke.spec.ts` — app loads, login renders, dashboard renders
2. `auth-session.spec.ts` — session persists, logout clears
3. `shopping-journey.spec.ts` — one critical journey end-to-end

### Required rules

- **All selectors via `data-testid`.** Never use `has-text`, `placeholder*`, parent traversal (`locator('..').locator('..')`), or CSS class selectors.
- **No `waitForTimeout`.** Use `expect().toBeVisible({ timeout })`, `waitForResponse()`, or `waitForURL()`.
- **No conditional guards.** If a selector might not exist, the test should fail. Never wrap assertions in `if (await ...isVisible().catch(() => false))`.
- **API-seeded fixtures only.** Test prerequisites (user, household, store) are created via DB seeding or API calls, not browser interactions.
- **1 browser (chromium).** Run nightly on CI, not per-PR.

### Anti-patterns

```typescript
// ❌ DO NOT DO THIS
await page.waitForTimeout(2000);
if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
  // test body that might never execute
}
await page.locator('button:has-text("Add Store")').click();
await page.locator('input[placeholder*="add" i]').fill('Milk');
```

```typescript
// ✅ DO THIS
const addStoreButton = page.getByTestId('add-store-button');
await expect(addStoreButton).toBeVisible({ timeout: 5000 });
await addStoreButton.click();
const itemInput = page.getByTestId('item-input');
await itemInput.fill('Milk');
```

---

## CI Requirements

- A GitHub Actions workflow MUST run `npm test` on every push and PR to `main`
- The workflow must run server integration tests and web component tests
- Playwright smoke tests may run on a separate nightly schedule, not per-PR
- PRs that fail tests must not be merged

---

## What NOT to test

- **Don't test library internals.** Prisma queries, RxDB replication, NestJS DI — trust the library.
- **Don't test visual appearance.** No assertions about colors, font sizes, or layout positioning.
- **Don't test configuration files.** `vitest.config.ts`, `playwright.config.ts`, `tsconfig.json` don't need tests.
- **Don't duplicate tests across layers.** A state machine transition tested in server integration doesn't need a duplicate Playwright test.

---

## Test Data

- Use `Date.now()` suffixes for uniqueness in parallel-unsafe tests
- Clean up after every test (`clearDomainData` in `beforeEach`, not `afterEach` — leaks are less dangerous if cleaned before the next test)
- Never use real email addresses, real user IDs, or real credentials in test fixtures
- Use the `seedBaseFixtures` helper patterns — don't write raw Prisma inserts in individual tests

---

## References

- [ADR 008: Testing Strategy Revision](../adr/008-testing-strategy-revision.md)
- [Testing Approach Audit](../../planning/reviews/2026-06-10_testing-approach-audit.md)
- [Coding Standards](./coding-standards.md) (for non-testing conventions)
