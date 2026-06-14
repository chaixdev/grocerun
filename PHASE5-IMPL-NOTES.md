# Phase 5 Implementation Notes

> Working file. Appended after each completed change. Deleted at PR merge.

---

## Step 1.1 – Token-refresh hardening (2026-06-08)

**File:** `apps/web/src/core/rxdb/database.ts`
**Commit:** (uncommitted)

**What changed:**
- Pull handler: on 401, calls `forceTokenRefresh()` (aliased `refreshToken` bypasses cache), retries once with fresh token.
- Push handler: same 401→refresh→retry-once pattern.
- SSE `openSharedSyncStream`: added `forceRefresh=false` param. Initial open uses cached token. Error reconnect path passes `forceRefresh=true`, calling `forceTokenRefresh()` before reconnecting to avoid auth-failure reconnect loops with stale query-param token.
- Import: aliased `refreshToken as forceTokenRefresh` to make intent explicit.
- REST `api.ts`: unchanged — existing 401-refresh preserved.

**Design decisions:**
- Inlined retry per handler, not extracted into shared wrapper (per guardrail: explicit/local over opaque abstractions).
- Single retry only; RxDB built-in `retryTime: 10_000` handles further backoff.
- `forceTokenRefresh()` returning `null` (e.g. session expired): handler falls through to 401 error, RxDB retries after 10s. REST layer handles full session-expiry redirect separately.
- Explicit comments at each site to make 3am-debuggable.

**Verification:** `tsc --noEmit` passed zero errors in `apps/web`.

**Residual risks:**
- `sseHealthy` variable pre-existing lint warning (unused), not in scope.
- SSE query-param token exposure is pre-existing; this change only ensures freshness on reconnect.

---

## Step 1.2 – Item REST updates notify SSE + SYNC_CHANGED primitive (2026-06-08)

**Files:** `apps/server/src/sync/sse-broadcast.service.ts`, `apps/server/src/items/items.service.ts`, `apps/server/src/items/items.module.ts`, `apps/web/src/core/rxdb/database.ts`
**Commit:** (uncommitted)

**What changed:**

Server:
- `SseBroadcastService.notifyChanged(userIds, { collections, reason })`: new method sends `event: SYNC_CHANGED\ndata: {"collections":["item"],"reason":"item-updated"}\n\n`. Existing `notify()` and `notifyHouseholdRemoved()` untouched.
- `ItemsService.updateItem()`: after update, queries store→household→users to get all member IDs, calls `sseBroadcast.notifyChanged(memberIds, { collections: ['item'], reason: 'item-updated' })`. Wrapped in try/catch; failure logs via `Logger.error` and never blocks REST response.
- `ItemsModule`: imports `SyncModule` so `SseBroadcastService` is available for DI.

Client:
- `openSharedSyncStream`: added `SYNC_CHANGED` event listener — emits diagnostic + triggers `resyncAll()` (same as RESYNC). Will narrow to per-collection triggers in Step 2.

**Verification:** `tsc --noEmit` passed in both `apps/server` and `apps/web`.

**Notes:**
- Caller also receives SYNC_CHANGED for their own change (harmless duplicate pull).
- Additional Prisma query per item update for household member lookup; acceptable for now.
- SYNC_CHANGED payload is parsed by client but `collections` field not used yet — full resync triggered.

### Smoke-test fix (2026-06-08)

**Problem:** Item metadata updates via REST did not propagate to other browser windows. Root cause: `notifyChanged` only emitted `SYNC_CHANGED`, but existing browser windows (persistent SSE connections across HMR / stale tabs) only had the old `RESYNC` listener registered.

**Fix:** `SseBroadcastService.notifyChanged` now emits both `RESYNC` (first, for backward compat) and `SYNC_CHANGED` (with metadata for future targeting). One-line addition per SSE write. Only file touched: `sse-broadcast.service.ts`.

**Verification:** `tsc --noEmit` passes in both `apps/server` and `apps/web`.

---

## Step 1.3 – Shopping lock in pushListItems + duplicate item push canonicalization (2026-06-08)

**Files:** `apps/server/src/sync/collections/list-item-sync.ts`, `apps/server/src/sync/collections/item-sync.ts`
**Commit:** (uncommitted)

**What changed:**

list-item-sync.ts `pushListItems()`:
- List query now selects `assignedTo` and `status` in addition to `storeId`.
- COMPLETED list → returns tombstone conflict (lists immutable once done).
- SHOPPING + `assignedTo !== userId` → returns tombstone conflict (locked by another shopper).
- SHOPPING + `assignedTo === null` → logs `console.warn` but allows push (server-side inconsistency, shouldn't block writes entirely).
- PLANNING lists pass through unblocked (no lock applies).

item-sync.ts `pushItems()`:
- Imports `Prisma` namespace from `../../generated/prisma/client`.
- `create` branch wraps `deps.prisma.item.create(...)` in try/catch for `PrismaClientKnownRequestError` code `P2002`.
- On unique constraint violation (`@@unique([storeId, name])`): queries existing non-deleted item by `(storeId, name)`, returns as conflict via `itemToSyncDoc()`, lets client reconcile.
- Non-P2002 errors (including edge case where P2002 fires but no non-deleted item found) re-throw.

**Verification:** `tsc --noEmit` passed in `apps/server`.

**Notes:**
- Lock behavior matches REST `ListsService` pattern (COMPLETED + SHOPPING lock).
- Duplicate item handling uses exact `name` match; SQLite BINARY collation means case-sensitive.
- RxDB client push handler already returns conflicts to RxDB for reconciliation — no client changes needed.

---

## Step 1.4 – Fix every-other-click quantity snapback + shopping qty semantic (2026-06-08)

**Files:** `apps/server/src/sync/collections/list-item-sync.ts`, `apps/server/src/sync/collections/item-sync.ts`, `apps/web/src/features/lists/components/ListItemRow.tsx`
**Commit:** (uncommitted)

### Root cause confirmed
Client local-first writes set `updatedAt` to client time via `incrementalPatch`. Server push handlers previously did **not** pass `updatedAt` to Prisma — Prisma `@updatedAt` rewrote it to server time. After push, RxDB local doc retained client timestamp. On next push, `assumedMasterState.updatedAt` (client_T1) ≠ `current.updatedAt` (server_T1) → false conflict → server returned old row → UI snapback. Conflict resolution repaired local state, so next click succeeded. Classic every-other-click pattern.

### What changed

**Server timestamp passthrough:**
- `pushListItems`: update path now sets `updatedAt` from `newDocumentState.updatedAt` (validated string → Date, fallback to `new Date()`). Create path same.
- `pushItems`: same pattern on both update and create paths.
- Comment explains: "Pin updatedAt to what the client sent so assumedMasterState comparison on the next push doesn't false-conflict against Prisma's @updatedAt"

**UI semantic fix:**
- `ListItemRow.tsx` `flushQtyWrite`: shopping mode now calls `onToggle(id, true, qty)` instead of `onToggle(id, optimisticChecked, qty)` — quantity changes implicitly check item.
- `ListItemRow.tsx` `onChange` handler: shopping mode also calls `setOptimisticChecked(true)` if item was unchecked, for immediate optimistic UI.

**Verification:** `tsc --noEmit` passes in both `apps/server` and `apps/web`.

### Retest
1. Restart dev, open shopping list in shopping mode
2. Click + on an unchecked item → should check AND increment quantity
3. Click + again after 10s → should increment cleanly (no snapback)
4. Repeat at varying intervals — every click persists
