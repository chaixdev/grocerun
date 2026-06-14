# ADR 008: Testing Strategy Revision — Vitest Pyramid with Critical Playwright Journeys

**Status:** Accepted  
**Date:** 2026-06-10  
**Updated:** 2026-06-13 — Amended Playwright scope from a fixed 3-smoke ceiling to a small critical journey suite.
**Supersedes:** [ADR 005](./005-e2e-testing.md)  
**Deciders:** Development Team  
**Context:** Phase 4/5 — RxDB local-first shopping, Next.js purge imminent

---

## Context

ADR 005 (January 2026) defined a Playwright + Vitest hybrid testing strategy targeting ~30 E2E tests and ~130 Vitest tests. The architecture at that time assumed a Next.js SSR app with service-worker-based offline support, and the ADR concluded Playwright was essential for testing service workers, offline scenarios, and multi-browser PWA behavior.

Since then, several things changed:

1. **The Next.js purge is planned.** The web app is being converted to a Vite SPA. Next.js-specific concerns (SSR, server components, NextAuth, middleware) are being removed. The app reads from RxDB (IndexedDB) and syncs to a REST API — no server-side rendering, no service workers required for offline (RxDB handles persistence via IndexedDB).

2. **The current test suite does not reflect ADR 005.** A June 2026 audit found:
   - **Server:** 2 spec files (soft-delete smoke, section sync) — 28+ source files untested
   - **Web:** 0 component tests despite Vitest + Testing Library fully configured
   - **Playwright E2E:** 20 spec files, all 87 tests failed in the last run (March 2026). The suite is dead. Key problems: security tests pass without testing anything (conditional `if` guards), `waitForTimeout()` everywhere, UI-driven fixture chain takes 20+ browser interactions per test setup, fragile selectors with few `data-testid` values.
   - **CI:** No workflow runs any tests.

3. **The risk profile shifted.** With Phase 4/5 focused on RxDB sync, the highest-risk area is data integrity: sync protocol correctness, soft-delete cascade behavior, unique constraint handling with tombstones, and state machine transitions (planning → shopping → completed). These risks live at the API/data layer, not the browser.

4. **A separate domain model audit** found critical issues (soft-delete collisions with unique constraints) that are testable via server integration but invisible to Playwright.

---

## Decision

**We replace the ADR 005 strategy with a Vitest-dominant testing pyramid. Playwright is kept for a small critical journey suite: start with 3 smoke/journey specs, and allow growth to 5-6 specs when a scenario is user-critical, cross-page, auth-dependent, local-first, or UX-sensitive.**

### The Testing Pyramid

```
         ┌──┐
         │PW│     3-6 critical journey specs (API-seeded)
         └──┘     Run nightly; selected journeys may gate UX/flow work
        ┌────┐
        │Web │    15-25 component tests
        └────┘    ShoppingList, TripSummary, ItemSearch, form validation
       ┌──────┐
       │Server│   50-80 integration tests ← THE BULK
       └──────┘   API CRUD, sync protocol, auth, soft-delete cascade, state machines
      ┌────────┐
      │  Unit  │  20-30 unit tests
      └────────┘  DTO validation (Zod schemas), pure helpers, state transition logic
```

### Layer decisions

**Server integration (bulk of investment):**
- Real NestJS app + real SQLite test.db + real JWT auth via `createTestApp` infrastructure
- Covers: sync push/pull for all 6 collections, Lists state machine, CRUD for all controllers, auth guard, soft-delete cascades, cross-household authorization, input validation rejection
- The existing infrastructure (`test/helpers.ts`, `seedBaseFixtures`, `clearDomainData`) is clean and already proven with 2 spec files
- Serial execution acceptable for now; switch to per-file `:memory:` SQLite when test count exceeds 10 spec files

**Web components:**
- Vitest + Testing Library + jsdom (already configured)
- Built alongside Phase 4/5 development — every new RxDB-integrated component gets 2-3 tests
- Focus on state transitions and user interactions, not visual rendering

**Playwright (small critical journey suite):**
- `smoke.spec.ts` — "app loads, login renders, authenticated shell renders"
- `auth-session.spec.ts` — "session persists across refresh/navigation, logout clears session"
- `shopping-journey.spec.ts` — critical journey: create store → add items → shop → complete
- Optional additions require explicit full-flow justification, such as local-first offline shopping, first usable setup, or a UX-sensitive household/settings journey
- All rebuilt from scratch with **API-seeded fixtures** (DB seeding, not browser interactions)
- Strict rules: no `waitForTimeout`, all selectors via `data-testid`, no conditional guards
- 1 browser (chromium) by default; run nightly, and gate PRs only when the change touches the covered journey or UX flow

**Unit tests:**
- Written opportunistically for pure logic: Zod DTO validation, utility functions, state machine transition logic
- No coverage thresholds enforced yet — add once baseline coverage exists

### What we stop doing

- **No multi-browser Playwright testing** — cross-browser differences are not a current risk for a 2-dev team in Phase 4/5
- **No offline/service-worker Playwright tests** — RxDB handles offline via IndexedDB, which is tested at the server integration and web component layers
- **No UI-driven fixture chains** — all Playwright prerequisites are API/DB-seeded
- **No broad Playwright regression matrix** — Playwright coverage stays deliberately small and journey-focused. New specs require a clear full-flow justification and should not duplicate behavior already covered by server integration or web component tests.

---

## Alternatives Considered

### 1. Reboot the full Playwright suite (rejected)

**Effort:** 8-12 days to fix flakiness, replace waitForTimeout, add data-testid, rewrite fixtures.  
**Result:** A fragile suite that breaks on every UI change, adds 5-10 minutes to CI, and tests the wrong layer for the app's actual risk profile.  
**Why rejected:** For a local-first sync app, 80% of risks live at the API/data layer where Playwright doesn't reach.

### 2. Playwright-only, no Vitest (rejected)

Would lose the ability to test sync protocol, soft-delete cascades, auth guard, and data integrity — the highest-risk areas in Phase 4/5.

### 3. Keep ADR 005 as-is (rejected)

Reality doesn't match ADR 005. The current suite is dead. Keeping the ADR unchanged would mislead future developers about the project's testing posture.

---

## Consequences

### Positive

- Tests run in seconds, not minutes — faster feedback loop
- Server integration tests survive UI rewrites (including the Next.js purge)
- The highest-risk areas (sync, soft-delete, state machines) get test coverage
- Lower maintenance burden — no fragile browser-based fixture chains
- Single command: `npm test` runs everything (turbo already configured)

### Negative

- Lose cross-browser rendering validation (acceptable risk for current team size)
- Lose broad browser regression coverage beyond the small critical journey suite
- Server tests are serial-only until `:memory:` DB is adopted (acceptable at current scale)

### Mitigations

- The Playwright journey suite catches critical composed-flow regressions that server and component tests cannot see
- Server integration tests catch logic, data, and auth bugs
- Web component tests catch UI behavior bugs at the interaction level

---

## Implementation Plan

| Priority | Layer | What | Effort |
|----------|-------|------|--------|
| 1 | Server integration | Sync protocol (all collections, push + pull) | 3-4 days |
| 2 | Server integration | Lists, stores, items CRUD + auth | 2-3 days |
| 3 | Web components | ShoppingMode, TripSummary, hooks | 3-5 days |
| 4 | CI | Add `npm test` job to GitHub Actions | 0.5 day |
| 5 | Playwright journeys | Rebuild 3 initial specs from scratch (API-seeded), then allow justified growth to 5-6 | 2-4 days |
| 6 | Unit | DTO validation, pure helpers | Opportunistic |

### Immediate actions (next 3 days)

1. Delete `apps/e2e/tests/debug/session-debug.spec.ts` — not a real test
2. Extend `soft-delete.spec.ts` to cover List + Item unique constraint collisions
3. Add sync push integration tests for `listItems` and `items` (Phase 4's highest data risk)
4. Add CI workflow that runs `npm test`

---

## References

- [ADR 005](./005-e2e-testing.md) — superseded original testing strategy
- [Testing Approach Audit](../../planning/reviews/2026-06-10_testing-approach-audit.md) — detailed findings
- [Domain Model Audit](../../planning/reviews/2026-06-10_domain-model-audit-fixes.md) — related data integrity findings
- [Testing Standards](../rules/testing-standards.md) — concrete rules for writing tests
- [Phase 5 Simplification Plan](../../planning/tickets/PHASE-5-SIMPLIFICATION.md)
