# Codebase Audit — June 2026 (Comprehensive)

## Scope
Entire grocerun monorepo: `apps/web`, `apps/server`, `packages/dto`, cross-cutting concerns, documentation.

## Philosophy
> "The best part is no part. Code is a liability. Every line is a potential bug."

Analysis lens: simplicity, consistency, abstraction quality, race condition risk, LOC reduction potential, DDD adherence, maintainability. Avoid indirection that doesn't meaningfully improve legibility or testability. Over-abstraction is an antipattern.

---

## Executive Summary

**Overall grade: B+** — Solid architecture with well-defined boundaries, but accumulated technical debt from a multi-phase evolutive migration (Next.js → Vite SPA, Server Actions → REST → RxDB local-first) has left behind dead code, inconsistent patterns, and some fragile code paths.

**Key stats:**
- Frontend: 111 source files, ~9,400 lines
- Server: 62 hand-written files, ~4,500 lines
- Shared DTOs: 1 file, 157 lines, 22 schemas
- Dead/unused code: ~10 files/directories identified
- Potential LOC reduction: ~950 lines (conservative)

**The good:**
- Clean monorepo separation (apps never import from each other)
- DTO package as single source of validation truth (Zod)
- Well-documented Architecture Decision Records (9 ADRs)
- Feature-module organization with barrel exports on frontend
- Pure-function shopping lock shared across REST and sync layers
- `useRxQuery` abstraction eliminating RxDB boilerplate in hooks
- Comprehensive testing strategy (ADR 008)
- Soft-delete consistently applied to all 6 domain models

**The concerning:**
- Three different mutation paradigms in a single component (`ListEditor`)
- Missing `deleted: false` filter in `household-overview` (data integrity bug)
- Race condition in `addItemToList` soft-delete restore path
- `process.env` used in browser code where `import.meta.env` is required
- Manual error result objects (discriminated union) inconsistently mixed with thrown exceptions
- Redundant near-identical code blocks across 6 sync pull handlers, 12 resync functions, 5 shopping-lock assertions
- `wiki/rules/coding-standards.md` referenced from 18+ files but missing from disk

---

## Architecture & DDD Assessment

### Domain Module Structure (Server)

```
Server app
├── auth/              — Auth guard, service, OIDC bootstrap (@Global)
├── shared/            — Cross-cutting: AccessService, cascade-delete, notification, shopping-lock (@Global)
├── households/        — Aggregation root: CRUD, cascade soft-delete
├── stores/            — Entity: CRUD, cascade soft-delete
├── sections/          — Entity: CRUD, ordering/reordering
├── items/             — Entity: CRUD, search, top-items
├── lists/             — Aggregation root: CRUD, item management, shopping state machine
├── invitations/       — Lifecycle-managed: create, join, revoke
├── users/             — Profile reads
├── household-overview/ — Read-model/aggregate query
├── health/            — No-auth health check
├── sync/              — Anti-corruption layer: RxDB protocol (pull/push/SSE)
└── prisma.service.ts  — Infrastructure: SQLite adapter
```

**DDD score: 7/10**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Bounded contexts | ✅ Good | Households, Stores, Lists are clear aggregates |
| Aggregate roots | ⚠️ Mixed | Household is properly an AR (cascade-deletes stores). List is an AR but list-items manipulated through ListsService — correct |
| Domain services | ✅ Good | `ListsService` encapsulates shopping state machine |
| Anti-corruption layer | ⚠️ Pattern is right, implementation fragile | Sync module correctly isolates RxDB protocol from domain, but business rules reimplemented in sync handlers |
| Value objects | ❌ Missing | ListStatus enum exists but no typed value objects (e.g., `ShoppingLock`, `Quantity`) |
| Repository pattern | ❌ Missing | Direct Prisma calls in all services; frontend has no data-access abstraction |
| Domain events | ❌ Missing | Notification calls are manual in every method; no event bus |

### Feature Module Structure (Frontend)

```
apps/web/src/
├── core/              — Foundation: auth, config, RxDB, diagnostics, lib
│   ├── rxdb/          — RxDB schema, database singleton, replication
│   ├── lib/           — Shared hooks (useRxQuery, useRxMutation, useMutation, api)
│   ├── auth/          — OIDC bootstrap
│   ├── config/        — App config (buggy: uses process.env)
│   └── diagnostics/   — Event bus for dev overlay
├── features/          — Feature modules with barrel exports
│   ├── households/    — Components + hooks
│   ├── lists/         — Components + hooks
│   └── stores/        — Components + hooks
├── routes/            — TanStack Router file-based routes
└── components/        — Shared UI: shadcn-style, layout, error boundary
```

**Frontend architecture score: 6/10**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Feature cohesion | ✅ Good | Components and hooks colocated per feature |
| Barrel exports | ✅ Good | Clean public API per feature |
| State management | ✅ Good | No global store; RxDB is the state layer |
| Data layer abstraction | ❌ Missing | `getRxDb()` imported directly in every hook |
| Mutation consistency | ❌ Poor | Three mutation paradigms: REST, RxMutation, custom |
| Error handling | ⚠️ Mixed | `ApiError` exists but only used for HTTP; RxDB errors silently swallowed |
| Route/data coupling | ⚠️ Mixed | All data loading in route components (no loaders); `PageLoading` spinners everywhere |

### Cross-Cutting Concerns

| Concern | Implementation | Quality |
|---------|---------------|---------|
| Auth (server) | JWT via oidc-spa, AuthGuard, SSE query-token fallback | ✅ Solid |
| Auth (client) | OIDC singleton, Bearer token on all requests, 401 retry | ✅ Solid |
| Validation | Zod schemas in `packages/dto`, global ZodValidationPipe in NestJS | ✅ Solid |
| Soft-delete | Prisma filter `deleted: false` on 6 domain models | ⚠️ One module misses it |
| Notifications | Manual `this.notify.byStore()` in every service method | ⚠️ Boilerplate; no interceptor |
| Error handling | Thrown NestJS exceptions + discriminated union result type | ⚠️ Inconsistent |
| Logging | NestJS Logger used sporadically | ⚠️ Spotty coverage |
| Rate limiting | None | ❌ Missing |

---

## HIGH Severity Findings

### H1 — `addItemToList` discriminated-union return breaks error model

**Domain:** Backend  
**File:** `apps/server/src/lists/lists.service.ts:138-258`

`addItemToList` returns `AddItemResult` (discriminated union: `ADDED | ALREADY_EXISTS | NEEDS_SECTION`) while every other service method throws NestJS exceptions (`NotFoundException`, `BadRequestException`, `ForbiddenException`). This forces callers — and the sync push handler which has near-identical logic — to handle errors via two different paths for the same operation.

**Fix:** Throw for errors, return only the created entity on success. `NEEDS_SECTION` becomes a `BadRequestException` with a structured payload the client can interpret.

### H2 — `process.env` in browser code silently broken

**Domain:** Frontend  
**Files:**
- `apps/web/src/core/config/app.ts:4` — `process.env.INVITATION_TIMEOUT_MINUTES`
- `apps/web/src/core/config/env.ts:8` — `process.env` parsed by Zod
- `apps/web/src/core/rxdb/database.ts:86,96,167` — `process.env.NODE_ENV`

Vite exposes only a minimal `process.env` polyfill. `INVITATION_TIMEOUT_MINUTES` will always be `undefined` in the browser, causing `appConfig.invitation.expiresInMinutes` to silently fall back to 1440. The `env.ts` Zod parse of the full `process.env` object is fundamentally broken — it parses an object that only has `NODE_ENV` on it.

Separately, `settings.tsx:8` reads `import.meta.env.VITE_INVITATION_TIMEOUT_MINUTES` — **two different env var names for the same concept** (`INVITATION_TIMEOUT_MINUTES` vs `VITE_INVITATION_TIMEOUT_MINUTES`).

**Fix:** Replace all `process.env` references with `import.meta.env` and use `VITE_` prefix consistently. Remove the non-functional `core/config/` directory or make it Vite-aware.

### H3 — `household-overview` omits `deleted: false` filters

**Domain:** Backend  
**File:** `apps/server/src/household-overview/household-overview.service.ts:11-37`

The query:
```typescript
where: { users: { some: { id: userId } } }  // No deleted: false!
include: {
  stores: {                                    // No deleted: false!
    include: {
      lists: { where: { status: { not: 'COMPLETED' } } }  // No deleted: false!
    }
  }
}
```

Soft-deleted households, stores, and lists are returned to the client. The only filter is on list `status`, not on `deleted`. This is a **data integrity bug** — deleted data leaks through the aggregate read endpoint. Every other Prisma query in the codebase correctly filters `deleted: false`.

**Fix:** Add `deleted: false` to household, store, and list where clauses. Consider `_count` on items should also filter deleted.

### H4 — Race condition in `addItemToList` soft-delete restoration

**Domain:** Backend  
**File:** `apps/server/src/lists/lists.service.ts:174-214`

The add-item flow has this sequence for existing items:

```
1. Check active listItem exists (line 174) → return ALREADY_EXISTS
2. Check soft-deleted listItem exists (line 187) → findFirst
3. Update soft-deleted row to active (line 191) → update
4. Guard: check active again (line 201) → redundant, same check as step 1
```

Between step 2 (check) and step 3 (update), another concurrent request can also find the soft-deleted row and attempt to restore it. The Prisma `@@unique([listId, itemId, deleted])` constraint means step 2's `update` can't create a duplicate active row, but the second request's `update` will **overwrite the first's data** (quantity, unit) without conflict detection. The redundant active-check at step 4 (`guard-rails` check) will always find the first request's result, not the second's — it's a non-atomic guard.

The same TOCTOU pattern repeats for new items (lines 222-254).

**Fix:** Wrap the entire add-item logic (lines 138-258) in a Prisma `$transaction`. Or use optimistic locking on the `updatedAt` field.

### H5 — `useAddItem` is a third mutation paradigm

**Domain:** Frontend  
**File:** `apps/web/src/features/lists/hooks/useAddItem.ts` (142 lines)

The codebase has three mutation patterns in a single component (`ListEditor.tsx`):
1. `useMutation` — REST-based, calls API, triggers resync (`useStartShopping`, `useCancelShopping`, `useCompleteList`)
2. `useRxMutation` — local-first RxDB write + push replication (`useToggleItem`, `useUpdateItemQuantity`, `useRemoveItem`)
3. `useAddItem` — custom `useCallback`-based, directly inserts into RxDB with manual `isPending` state

`useAddItem` completely sidesteps the standardized hooks. It manages its own `isPending` via `useState`, uses discriminated-union return types (`ADDED | ALREADY_EXISTS | NEEDS_SECTION | ERROR`), and manually implements `mutate`/`mutateAsync` with callbacks — patterns already implemented in `useRxMutation`. It also has no conflict resolution, no onError hook integration, and no push-replication awareness.

**Fix:** Migrate `useAddItem` to use `useRxMutation` for the local RxDB write path, and handle the `NEEDS_SECTION`/`ALREADY_EXISTS` UI states at the component level via the hook's return value.

### H6 — Sync collection push handlers duplicate business rules from REST

**Domain:** Backend + Sync  
**Files:**
- `apps/server/src/lists/lists.service.ts` — shopping lock assertions ×5
- `apps/server/src/sync/collections/list-item-sync.ts:92-106` — sync shopping lock enforcement
- `apps/server/src/shared/access.service.ts` — `assertCanMutateShoppingList` + `assertShoppingLockHolder` (near-duplicates)

The shopping lock pure function (`checkShoppingLock`) is shared ✅. But the **reaction** to lock violations is implemented 3 different ways:
1. `assertCanMutateShoppingList` — throws NestJS exceptions
2. `assertShoppingLockHolder` — throws NestJS exceptions (slightly different messages)
3. `pushListItems` — produces tombstone conflicts + logs warning for MISSING_LOCK

If the lock violation response strategy changes (e.g., new status code, different conflict metadata), it must be updated in 3 locations. The `checkShoppingLock` function is correct architecture; the violation handlers should also be unified.

**🔒 Accepted trade-off (2026-06-13, Oracle review):** M3 already unified items 1+2 into `assertShoppingLock()`. The remaining sync handler inline switch (item 3, 15 lines) has intentionally different semantics — MISSING_LOCK allows the push through (sync protocol can't throw HTTP errors and blocking would strand the client permanently), whereas REST throws ConflictException. The `checkShoppingLock()` function is the unified boundary. Extracting a function with 1 consumer for ~2 net lines saved creates indirection without value. Accepted as cost of genuinely different response strategies.

### H7 — (WITHDRAWN) Client secret in browser bundle → Accepted architectural trade-off

**Domain:** Frontend  
**File:** `apps/web/src/core/auth/oidc.ts`

Originally flagged: `__unsafe_clientSecret` from `VITE_OIDC_CLIENT_SECRET` bundled into browser JS.

**Reclassified as accepted:** The `__unsafe_` prefix in oidc-spa is the library's explicit acknowledgment that this is a known SPA trade-off. Google OAuth in SPAs without a backend proxy requires either the implicit flow (deprecated), PKCE (recommended), or this workaround. This is a documented, intentional decision — not an oversight.

---

## MEDIUM Severity Findings

### M1 — `useAddItem` has no conflict resolution

**Domain:** Frontend  
**File:** `apps/web/src/features/lists/hooks/useAddItem.ts:44-96`

The mutation performs two sequential writes (item insert + listItem insert) outside any transaction. If the push replication syncs the item creation before the listItem creation, and another client pushes a conflicting update, there's no mechanism to reconcile. The `newLocalId()` function generates client-side IDs that have no server-side collision protection.

**🔒 Accepted trade-off (2026-06-13):** RxDB does not expose transaction APIs for cross-collection writes. The two-step write is intentional — items are shared across lists in a store, so the "orphaned item" risk is minimal. Any window-of-inconsistency resolves on the next pull via RxDB's eventual consistency model (push replication + SSE resync). Documented with a comment at `useAddItem.ts:63-68`.

### M2 — `removeHouseholdSubtreeFromLocalDb` not atomic

**Domain:** Frontend  
**File:** `apps/web/src/core/rxdb/database.ts:573-603`

The function queries stores → sections/items/lists → listItems, then removes them in sequence via `Promise.all`. If the operation fails midway (e.g., tab closes, IndexedDB error), the local database is left in an inconsistent state — some entities removed, some still present for a household that no longer exists.

**✅ Resolved (2026-06-13):** Replaced `Promise.all` with `Promise.allSettled` — one document removal failure no longer aborts the rest. Added `console.error` logging for failed removals. Wrapped household removal in try/catch so it always runs even if subtree removal had failures. The function is idempotent: running it again cleans up any orphans from a prior partial failure.

### M3 — `assertCanMutateShoppingList` vs `assertShoppingLockHolder` near-duplicate

**Domain:** Backend
**File:** `apps/server/src/shared/access.service.ts:65-105`

Two methods with 90% identical logic — both call `checkShoppingLock`, both switch on `reason`, both throw equivalent exceptions. The only difference: `assertShoppingLockHolder` requires explicit lock ownership (allows ONLY the lock holder), while `assertCanMutateShoppingList` allows PLANNING mutations by anyone. This subtle semantic difference is encoded in the naming, not the type system, and both methods separately duplicate the `checkShoppingLock` → switch pattern.

**✅ Resolved (2026-06-13):** Merged into single `assertShoppingLock(list, lockId, message?)`. Both semantics are preserved: `completeList`/`cancelShopping` have their own explicit `status !== 'SHOPPING'` pre-checks before calling the unified method. 26 lines removed. All 15 tests pass.

### M4 — `useRxMutation` `as any` cast on collection access

**Domain:** Frontend  
**File:** `apps/web/src/core/lib/useRxMutation.ts:70`

```typescript
const doc = await (db[collection] as any).findOne(docId).exec()
```

The `collection` parameter is typed as `"items" | "listItems"`, but the cast to `any` throws away type safety. If a third collection is added to the union, there's no compiler error — the code silently compiles and fails at runtime with "findOne is not a function".

**✅ Resolved (2026-06-13):** Replaced computed property access `db[collection]` with typed ternary `collection === "items" ? db.items : db.listItems`. Adding a third collection now produces a compile error. Also fixed `doc as RxCollectionDoc` → `doc as unknown as RxCollectionDoc` (surfaced by proper typing).

### M5 — `useRxQuery` silently swallows subscription errors

**Domain:** Frontend  
**File:** `apps/web/src/core/lib/useRxQuery.ts:122-126`

The comment states: *"Subscription-driven errors are transient... intentionally not surfaced via the error state."* If IndexedDB becomes corrupted, quota-exceeded, or the RxDB subscription fails entirely, the UI shows stale/empty data with **zero user feedback**. The user sees a blank screen with no indication anything is wrong.

**✅ Resolved (2026-06-13):** Added retry counter (`consecutiveErrorCount` ref). After 5 consecutive subscription failures, the error is surfaced via `setError()` — the UI renders error state instead of stale data. On successful computation, the counter resets to 0. Transient hiccups (<5 consecutive failures) are still tolerated silently.

### M6 — Paginated pull handlers have near-identical logic

**Domain:** Backend  
**Files:** `apps/server/src/sync/collections/section-sync.ts`, `item-sync.ts`, `list-sync.ts`, `list-item-sync.ts`, `store-sync.ts`, `household-sync.ts`

All 6 pull handlers follow the exact same template (~40-60 lines each):
1. Get accessible IDs via `deps.getAccessible*IdsForSync(userId)`
2. Return empty if no accessible IDs
3. Build where clause: `buildPullWhere({ collectionFilter, checkpoint })`
4. Run `findMany({ where, orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }], take: limit })`
5. Map rows to documents
6. Return `{ documents, checkpoint: computeCheckpoint(rows, checkpoint) }`

The only variation is the collection-specific filter (e.g., `{ storeId: { in: accessibleStoreIds } }` vs `{ list: { storeId: { in: accessibleStoreIds } } }`).

**Fix:** Extract `basePullHandler(deps, model, filterBuilder)` — eliminating ~360 lines.

### M7 — 12 near-identical resync functions in `database.ts`

**Domain:** Frontend  
**File:** `apps/web/src/core/rxdb/database.ts:217-296`

Each of 6 collections has:
```typescript
type XCheckpoint = { id: string; updatedAt: string }
let xPullStream$: Subject<...> | null = null
export function resyncX() { if (xPullStream$) { xPullStream$.next('RESYNC') } }
```

And 6 `startXReplication` functions that are identical except for collection name and `enablePush` flag. This is ~180 lines of template that could be a single `createReplication(collection, options)` factory.

**Fix:** Generic factory function with a collection registry. Eliminates ~150 lines.

**⚠️ Attempted 2026-06-13, reverted.** A `setupReplication()` factory + `Map<string, Subject>` registry was implemented and passed typecheck, but caused a request storm in production (~10k requests in 60s, ~117 req/s). The exact mechanism is unclear from static analysis — hypothesis is a subtle RxDB Subject lifecycle issue where the factory-created Subjects interact differently with `sharedPullStreams` and the SSE→RESYNC→pull→push→SSE cycle. The explicit 6-function pattern is stable; the factory approach needs deeper investigation of RxDB's internal Subject behavior before retrying.

### M8 — Form validation schemas duplicate shared DTOs

**Domain:** Frontend  
**Files:**
- `apps/web/src/features/households/components/HouseholdForm.tsx:22`
- `apps/web/src/features/stores/components/StoreForm.tsx:22`
- `apps/web/src/features/stores/components/SectionForm.tsx:12`

Inline Zod schemas for form validation manually duplicate the shared `@grocerun/dto` schemas. Risk of validation drift between client and server.

**✅ Resolved (verified 2026-06-13):** All three forms already import directly from `@grocerun/dto` (`CreateHouseholdSchema`, `CreateStoreSchema.omit({ householdId: true })`, `CreateSectionSchema.pick({ name: true })`). The only remaining inline `z.object` is a TanStack Router `validateSearch` schema (`routes/stores.tsx:11`), which is routing-level, not form validation. No further action needed.

### M9 — NotificationService swallows all errors silently

**Domain:** Backend  
**File:** `apps/server/src/shared/notification.service.ts:34-36, 57-59`

`.catch(() => {})` — fire-and-forget with zero observability. If an SSE broadcast fails, there's no log, no metric, no trace. Since SSE is the sole mechanism for real-time multi-client sync, silent broadcast failures mean clients go stale.

**✅ Resolved (earlier):** Both `.catch()` blocks now have `this.logger.warn('Notification byStore/byHousehold failed', ...)`. No further action needed.

### M10 — `useLists.ts` exports `useAddItem` side-effect re-export

**Domain:** Frontend  
**File:** `apps/web/src/features/lists/hooks/useLists.ts:7`

```typescript
export { useAddItem } from "./useAddItem"
```

`useLists.ts` is a mutation hooks file but re-exports `useAddItem` from a separate file. `ListEditor.tsx` imports `useAddItem` from `useLists` (line 31), making it appear like `useAddItem` is defined in `useLists.ts` when it's not. This is misleading and creates a hidden dependency.

**✅ Resolved (2026-06-13):** `ListEditor.tsx` now imports `useAddItem` directly from `./useAddItem`. The re-export in `useLists.ts` is kept for the public barrel API (stable).

### M11 — `sync-helpers.ts` and `sync.service.ts` define duplicate tombstone windows

**Domain:** Backend  
**Files:**
- `apps/server/src/sync/sync-helpers.ts:3` — `const TOMBSTONE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000`
- `apps/server/src/sync/sync.service.ts:34` — `private static readonly TOMBSTONE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000`

Two definitions of the same constant. If one changes and the other doesn't, sync behavior becomes inconsistent — pull handlers use one window, access-scoping uses another.

**Fix:** Single exported constant. Or make it a constructor-injected config value.

---

## LOW Severity Findings

### L1 — `useListNavigation.ts` misplaced in `components/ui/`

**Domain:** Frontend  
**File:** `apps/web/src/components/ui/useListNavigation.ts`

A feature-specific keyboard navigation hook used only by `features/stores/components/SectionList.tsx`, placed in the generic shared UI library.

**✅ Resolved (2026-06-13):** Moved to `features/stores/useListNavigation.ts`. Import in `SectionList.tsx` updated to `"../useListNavigation"`. Added export to `stores/index.ts` barrel. Removed rogue re-export from `lists/index.ts`.

### L2 — Empty directories: `src/generated/` and `src/types/`

**Domain:** Frontend  
**✅ Resolved (earlier sweep):** Directories removed.

### L3 — `core/types/action-result.ts` exported but never imported

**Domain:** Frontend  
**✅ Resolved (earlier sweep):** 28 lines removed. No consumers found.

### L4 — `core/lib/rate-limit.ts` exported but never imported

**Domain:** Frontend  
**✅ Resolved (earlier sweep):** 46 lines removed. No consumers found.

### L5 — `SectionGroup` component exported but never used

**Domain:** Frontend  
**File:** `apps/web/src/features/lists/components/SectionGroup.tsx`

**✅ Resolved (earlier sweep):** 76 lines removed. No imports found.

### L6 — `sharedStream` method name artifact

**Domain:** Backend  
**File:** `apps/server/src/sync/sync.controller.ts:108`

**✅ Resolved (earlier):** Method already renamed to `stream()`. The controller now has `stream()` decorator method and private `openStream()` helper. No `sharedStream` references remain.

### L7 — ADRs 003, 005, and 006 are superseded but still in canonical docs

**Domain:** Documentation  
4 of 9 ADRs are superseded (003, 005, 005-testing-tool-evaluation, 006) by architectural changes (Next.js/NextAuth removal → oidc-spa). They remain in `wiki/adr/` with "Superseded" status which is correct for historical record.

**🔒 Accepted trade-off (2026-06-13):** Moving to `wiki/adr/superseded/` would break relative cross-references (e.g., `./008-testing-strategy-revision.md`). The prominent "Superseded" status headers and warning banners are sufficient. Maintaining them alongside active ADRs preserves link integrity and is the ADR convention.

### L8 — Invitations lack soft-delete, unlike all other domain models

**Domain:** Backend  
**File:** `apps/server/prisma/schema.prisma` — Invitation model

Invitations use a status lifecycle (`ACTIVE → COMPLETED/EXPIRED/REVOKED`) instead of the `deleted`/`deletedAt` pattern used by all 6 other domain models. Justified in ADR 007: "finite lifecycle with explicit terminal states." Architecturally sound but creates a learning curve — new developers expect all models to follow the same soft-delete pattern.

### L9 — Missing `wiki/rules/coding-standards.md`

**Domain:** Documentation  
8 sections: TypeScript Idioms, Error Handling, NestJS, React & Component Structure, Prisma & Database, RxDB & Local-First, Auth, Monorepo Boundaries, plus Logging, Testing, and Git Conventions. Balances prescriptive rules with rationale. Satisfies the 10 mandatory rules surfaced by @grocerun-coding-style.

---

## Dead Code Inventory

| File | Lines | Status |
|------|-------|--------|
| `apps/web/src/core/types/action-result.ts` | 28 | Never imported |
| `apps/web/src/core/lib/rate-limit.ts` | 46 | Never imported |
| `apps/web/src/features/lists/components/SectionGroup.tsx` | 76 | Exported, never used |
| `apps/web/src/generated/` | — | Empty directory |
| `apps/web/src/types/` | — | Empty directory |
| `apps/web/src/core/rxdb/cleanup.ts` | 1 | Unnecessary re-export indirection |
| `apps/server/src/generated/prisma/browser.ts` | 74 | Browser Prisma client in server context |
| `apps/server/src/generated/prisma/internal/prismaNamespaceBrowser.ts` | 247 | Browser namespace in server context |
| `apps/web/prisma/schema.prisma` | ? | Legacy Prisma schema (may be stale) |
| `apps/web/wiki-legacy/` | ? | Outdated documentation |
| **Total dead lines** | **~500+** | |

---

## Race Condition Risk Register

| # | Location | Risk | Likelihood | Impact |
|---|----------|------|------------|--------|
| 1 | `lists.service.ts:187-221` | TOCTOU on soft-delete restoration (two concurrent addItem calls) | Low (SQLite serializes writes) | Medium (data overwrite) |
| 2 | `useAddItem.ts:58-96` | No transaction around multi-step RxDB writes (item + listItem creation) | Medium (RxDB async) | Low (resolved on next pull) |
| 3 | `list-item-sync.ts:110-113` | Millisecond-precise `getTime()` comparison for conflict detection | Medium (clock skew) | Medium (false conflicts) |
| 4 | `list-item-sync.ts:149-222` | Check-then-create pattern (soft-delete restore + active-duplicate guard + P2002 catch) | Low | Medium (Prisma P2002 safety net) |
| 5 | `database.ts:573-603` | Non-atomic multi-step local DB subtree removal | Low | Medium (orphaned data) |
| 6 | `database.ts:513-518` | SSE auth token in URL query parameter (EventSource limitation) | Medium (token in logs/history) | Medium (token exposure) |
| 7 | `shopping-lock.ts` | Lock check is pure function, no server-side enforcement between check and write | Low (SQLite single-writer) | Low (brief window) |

---

## LOC Reduction Analysis

### By Category

| Pattern | Occurrences | Current LOC | After refactor | Savings |
|---------|-------------|-------------|----------------|---------|
| Pull handler duplication | 6 handlers × ~40 lines | ~240 | ~60 (shared + per-collection filter) | **180** |
| Resync function boilerplate | 6 collections × 3 blocks | ~180 | ~30 (factory function) | **150** |
| `useAddItem` → `useRxMutation` | 1 hook × 142 lines | 142 | ~60 (standard hook + component logic) | **80** |
| Shopping lock assertion duplication | 3 variants | ~60 | ~25 (single method + options) | **35** |
| Form schemas → shared DTOs | 3 forms × ~20 lines | ~60 | ~20 (z.infer + extend) | **40** |
| Notification interceptor | ~8 services × ~5 lines | ~40 | ~15 (single interceptor) | **25** |
| `process.env` → `import.meta.env` config cleanup | 3 files | ~50 | ~15 | **35** |
| Dead code removal | 10+ files | ~500 | 0 | **500** |
| `TOMBSTONE_WINDOW_MS` deduplication | 2 locations | 2 | 1 (shared constant) | **1** |
| `useListNavigation.ts` relocation | 1 file | 0 | 0 | **0** (just move) |
| `SectionGroup` consolidation | 1 component | 76 inline | 20 (shared component) | **56** |
| **Estimated total** | | | | **~1,100** |

Conservative baseline (excluding dead code which is zero-cost to remove): **~450 lines** reducible through refactoring alone.

---

## Consistency Scorecard

| Axis | Score | Assessment |
|------|-------|------------|
| Error handling | 5/10 | Discriminated union + thrown exceptions mixed; no global exception filter |
| Response shapes | 5/10 | Some return entity, some return `{ success: true }`, some return discriminated unions |
| Auth patterns | 8/10 | Consistent JWT in Bearer; SSE auth workaround is documented |
| Module structure | 8/10 | All domain modules follow same pattern; `household-overview` is minor exception |
| Import patterns | 7/10 | `process.env` vs `import.meta.env` split; barrel exports on frontend only |
| Naming | 7/10 | Generally good; `sharedStream` is an artifact; two different `useHouseholds` hooks |
| Guard placement | 7/10 | Class-level @UseGuards except `items.controller.ts` (method-level) |
| DTO derivation | 5/10 | Shared schemas exist but frontend duplicates types; forms use inline schemas |
| Testing | 5/10 | Strategy document exists; actual coverage uncertain |

---

## Recommendations (ordered by impact/cost)

### High impact, moderate cost

1. **Fix `household-overview` `deleted: false` filter** (H3) — one-line fix, data integrity bug
2. **Fix `process.env` → `import.meta.env`** (H2) — 3 files, eliminates silent config failures
3. **Migrate `useAddItem` to `useRxMutation`** (H5) — eliminates third mutation paradigm, ~80 lines saved
4. **Extract shared pull handler utility** (M6) — ~180 lines saved, eliminates sync drift risk
5. **Create RxDB replication factory** (M7) — eliminates 6 near-identical functions, ~150 lines saved. ⚠️ **Attempted & reverted** — caused request storm; needs RxDB Subject lifecycle investigation before retrying.
6. **Wrap `addItemToList` in transaction** (H4) — fixes race condition
7. **Standardize `addItemToList` to throw exceptions** (H1) — unifies error model

### Moderate impact, moderate cost

8. **Remove dead code** — zero-risk LOC reduction
9. **Derive form schemas from `@grocerun/dto`** (M8) — prevents validation drift
10. **Unify shopping lock assertions** (M3) — single source of truth for lock violation handling ✅ Done
11. **Add observable logging to `NotificationService`** (M9) — catches silent failures
12. **Deduplicate `TOMBSTONE_WINDOW_MS`** (M11) — prevents subtle sync bugs
### Lower impact, lower cost

14. **Write `wiki/rules/coding-standards.md`** (L9) — fills biggest documentation gap
15. **Move superseded ADRs to subdirectory** (L7)
16. **Relocate `useListNavigation.ts`** (L1)
17. **Remove empty directories** (L2)
18. **Delete unused `SectionGroup` or use it in `ListEditor`** (L5)
19. **Rename `sharedStream` → `openStream`** (L6)
20. **Add barrel exports to server modules** — improves discoverability

---

## What's Working Well

1. **Pure-function shopping lock** (`shopping-lock.ts`): 26 lines, testable in isolation, used by both REST and sync. Exemplary.

2. **DTO package as validation boundary**: 22 Zod schemas, shared between frontend and backend, clean export pattern. Server uses `createZodDto` from nestjs-zod.

3. **ADR process**: 9 well-written decisions with context, rationale, and consequences. Even superseded ones are preserved with explanatory notes.

4. **SyncDeps interface** (`sync-deps.ts`): Pure functions for sync handlers receive typed dependencies. No NestJS imports in sync collection handlers. Clean inversion of control.

5. **`useRxQuery` hook**: Centralized RxDB subscription lifecycle, error state, and cleanup. Eliminates boilerplate that was present in earlier iterations.

6. **Feature-based module organization on frontend**: Components and hooks colocated, clean barrel exports, clear boundaries between households/lists/stores.

7. **Testing strategy (ADR 008)**: Clear pyramid with appropriate tooling per layer. Ceilings on expensive test types. Real database for integration tests.

8. **Soft-delete design**: Consistent across 6 domain models. Tombstone window for sync convergence. Cascade ordering in application code.

---

## Appendix: File Size Distribution

### Largest files (>200 lines)

| File | Lines | Risk |
|------|-------|------|
| `apps/web/src/core/rxdb/database.ts` | 603 | Split into replication module, cleanup module |
| `apps/web/src/features/lists/components/ListEditor.tsx` | 574 | Extract shopping-mode subcomponent |
| `apps/server/src/lists/lists.service.ts` | 465 | Extract shopping-lock logic; split addItem flow |
| `apps/web/src/features/households/components/Invitations/InvitationManager.tsx` | 404 | Extract join/create/leave subcomponents |
| `apps/server/src/sync/sync.service.ts` | 261 | Move collection switch to registry |
| `apps/server/src/sync/collections/list-item-sync.ts` | 253 | Good structure for complexity |
| `apps/web/src/core/rxdb/schema.ts` | 238 | Reasonable for 6 collection definitions |
| `apps/web/src/components/diagnostics-overlay.tsx` | 238 | Consider if diagnostics justifies this size |
| `apps/web/src/features/lists/components/ItemAutocomplete.tsx` | 229 | Reasonable for search complexity |
| `apps/web/src/components/settings-form.tsx` | 214 | Reasonable for settings complexity |
| `apps/web/src/features/lists/components/ListItemRow.tsx` | 214 | Reasonable for interactive row |
