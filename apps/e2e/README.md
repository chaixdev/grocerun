# E2E Testing (Playwright Critical Journeys)

Per [ADR 008](../../wiki/adr/008-testing-strategy-revision.md), Playwright tests are limited to
**3–6 critical journey specs** that only a real browser can validate. All other coverage lives at
lower layers (server integration, web component, unit).

## Current State (2026-06-14)

14 Playwright tests across 3 spec files. The harness uses a test-auth bypass: a test JWT is
injected into `sessionStorage.__grocerun_test_token__` before page load; the web app bootstraps
oidc-spa in mock mode (`isUserInitiallyLoggedIn: true`) and the API client uses the injected
token for all Bearer requests. DB fixtures are seeded via REST API and truncated between tests.

## Active Journeys

| Spec | Tests | Coverage |
|------|-------|----------|
| `smoke.spec.ts` | 3 | Login heading, Google button, root loads without crash |
| `list-journey.spec.ts` | 5 | Store navigation, list creation, add item (section dialog), duplicate handling, Go Shopping enable |
| `shopping-journey.spec.ts` | 6 | Start shopping, check items, checked count, Finish/Complete, Trip Summary missing items, Resume/Cancel |

## How It Works

```
Playwright test
  → seedPlaywrightFixtures()   (truncate DB + upsert user + create household/store/section via REST)
  → page.addInitScript()       (inject token into sessionStorage)
  → page.goto('/lists')        (web app detects token, bootstrapOidc mock, enforceLogin passes)
  → test assertions             (data-testid selectors, role-based selectors)
```

## Key Constraints

- **Each test gets a fresh DB** (`beforeEach` calls `seedPlaywrightFixtures` → truncates all tables)
- **Unique list names per test** (via timestamp prefix to avoid `createList` returning existing lists)
- **No `page.route` interception** — `api.ts` and `database.ts` both prioritize `sessionStorage` token
- Chromium only, single worker (DB lock safety)

## Running

```bash
# One-command local run: starts server in test mode, starts web, runs tests, cleans up
npm run e2e:run -w e2e

# Equivalent direct script invocation
./scripts/run-e2e.sh

# Pass Playwright args after --
npm run e2e:run -w e2e -- --grep "Shopping mode"

# Or interactively
cd apps/e2e
npx playwright test --ui
```

## Missing

- **Invitation journey** — needs two browser contexts with two authenticated users. Stretch goal.
- **Offline/RxDB journey** — needs offline mode simulation. Stretch goal.
