# RxDB & Local-First Conventions

**Status:** Established  
**Category:** Frontend / State  
**Context:** Grocerun RxDB local-first architecture with IndexedDB/Dexie storage

Canonical rules for RxDB usage in the Grocerun monorepo.

## Replication

- 6 collections replicate via RxDB pull/push protocol:
  `households`, `stores`, `sections`, `items`, `lists`, `listItems`.
- **Pull**: checkpoint-based incremental sync via `pullByAccess()` helper.
  Only pulls data the authenticated user has access to.
- **Push**: local-first writes for shopping-mode list items. REST
  mutations for config/admin data (households, stores, invitations).
- **SSE** for real-time notification: `RESYNC` events trigger fresh pulls
  from the server. SSE auth uses token-in-query-param (EventSource
  limitation — accepted trade-off).
- **Polling fallback**: 5s polling when SSE disconnects. SSE open →
  polling stops.

See [RxDB Sync Protocol](../technical-design/rxdb-sync-protocol.md) for
the full protocol and [SSE Resync Broadcast](../technical-design/sse-resync-broadcast.md)
for the broadcast architecture.

## Push Rules

- Push is gated by shopping mode lock: COMPLETED lists are immutable;
  SHOPPING lists are locked to the `assignedTo` user.
- Push-enabled collections: only `item` and `listItem` (local-first).
  `section`, `list`, `store`, `household` are pull-only (server-authoritative).
- Push handlers must not throw — the RxDB protocol expects conflict
  documents, not HTTP errors. Return tombstone conflicts for blocked
  operations.

## Schema

- RxDB schemas in `apps/web/src/core/rxdb/schema.ts`.
- Collection types in `database.ts`: `GrocerunCollections`.
- Use `newLocalId()` for client-generated IDs — never rely on server IDs
  for local-first writes.

## Replication Functions

- Keep the explicit `startXReplication` + `resyncX` pattern for each
  collection. Attempting a factory abstraction caused a request storm
  (Milestone 7, reverted) — the explicit pattern is battle-tested and stable.
- Each collection gets its own start and resync function. No DRY
  abstraction across collections.

## Offline Persistence

- RxDB uses Dexie/IndexedDB for local storage.
- Optimistic local-first writes: mutations write to the local RxDB
  immediately, then push to the server asynchronously.
- Visibility-change resync: when the browser tab regains visibility,
  trigger resync for all collections.
- Diagnostic events emitted on `window` for the diagnostics overlay
  (`@/components/diagnostics-overlay.tsx`).

See [Offline Persistence](../technical-design/offline-persistence.md) for
the full offline write and connectivity recovery lifecycle.

## Conflict Handling

- Sync uses `updatedAt` pin: server sets `updatedAt` to the client's
  value on successful push to prevent false conflicts on the next push.
- If a conflict is detected (server `updatedAt` > client expected), the
  server returns a conflict document; RxDB pulls the latest version.

## Anti-patterns

- **Factory abstraction for replication:** Do not attempt to unify the
  six `startXReplication` functions into a single factory. This was tried
  in Milestone 7 and caused a request storm — every collection re-pulled
  simultaneously because the factory lost per-collection stream identity.
  The explicit `startXReplication` + `resyncX` pattern is the canonical
  form (see Replication Functions above).

- **Throwing in push handlers:** RxDB push handlers must return conflict
  documents, not throw HTTP errors. A thrown error causes RxDB to retry
  the failed rows indefinitely, escalating to an infinite retry loop.
  Return tombstone conflicts (`{ id, updatedAt, _deleted: true }`) for
  blocked or forbidden operations instead.

- **Using server IDs for local-first writes:** Client-generated IDs via
  `newLocalId()` are required for all local-first documents. Server-issued
  IDs create a chicken-and-egg problem: the client cannot write a document
  locally without first round-tripping to the server, defeating the
  purpose of offline-first. The schema primary keys are all client-
  generated `cuid2` strings.

- **Mixing REST mutations for shopping-mode data:** Shopping-mode data
  (item check/uncheck, quantity changes, item add/remove during shopping)
  must go through `useRxMutation` → local RxDB write → push replication.
  Using REST endpoints for these operations bypasses the optimistic local
  update, creates race conditions with the push handler, and prevents
  offline operation. REST is reserved for config/admin mutations (list
  lifecycle, store/household CRUD).

- **Not handling `onError` in RxDB mutations:** The `useRxMutation` hook
  supports both `onSuccess` and `onError` callbacks. Omitting `onError`
  means push failures (network, auth, conflict) are silent — the user
  sees no toast, no rollback, and no indication that their change will
  not be synced. Always provide at least an `onError` toast handler.

## Testing

- RxDB-integrated components must test optimistic updates and rollback
  behavior. See [Testing Standards](./testing-standards.md).

## Reference Implementation

### RxDB Database Singleton

*   `apps/web/src/core/rxdb/database.ts`
    *   `getRxDb()` singleton (lazy promise-cached init): Lines 136-146
    *   Collection setup (`addCollections`): Lines 178-197
    *   Replication start (all 6 collections): Lines 199-210
    *   `startPullReplication` (generic pull/push wiring): Lines 363-469
    *   SSE stream open (`openSharedSyncStream`): Lines 523-581
    *   Pull stream registration + visibility resync: Lines 483-502
    *   Periodic polling fallback: Lines 511-521

*   `apps/web/src/core/rxdb/index.ts` — Barrel export (5 lines)

*   `apps/web/src/core/rxdb/household-cleanup.ts` — `refreshAfterHouseholdChange`, `cleanupAfterLeaveHousehold`

### Collection Schemas

*   `apps/web/src/core/rxdb/schema.ts`
    *   6 schemas: `sectionSchema` (line 29), `itemSchema` (line 74), `listSchema` (line 129), `listItemSchema` (line 162), `householdSchema` (line 194), `storeSchema` (line 223)
    *   All schemas at version 0, primary key `id` (cuid2), indexed on `updatedAt`

### Server Sync Handlers

*   `apps/server/src/sync/sync.service.ts` — Dispatch layer
    *   `pull()` switch routing: Lines 49-72
    *   `push()` dispatch (item/listItem get actual handlers, others no-op): Lines 78-108

*   `apps/server/src/sync/collections/item-sync.ts`
    *   `pullItems`: Lines 22-37
    *   `pushItems` (canonicalise duplicates server-side): Lines 39-167

*   `apps/server/src/sync/collections/list-item-sync.ts`
    *   `pullListItems`: Lines 28-43
    *   `pushListItems` (shopping lock gate + conflict detection): Lines 45-221
    *   Shopping lock enforcement: Lines 84-100

*   `apps/server/src/sync/collections/section-sync.ts` — Pull-only
*   `apps/server/src/sync/collections/list-sync.ts` — Pull-only
*   `apps/server/src/sync/collections/store-sync.ts` — Pull-only
*   `apps/server/src/sync/collections/household-sync.ts` — Pull-only

*   `apps/server/src/sync/sync-helpers.ts` — `pullByAccess()` helper
*   `apps/server/src/sync/sync.types.ts` — `PullResponse`, `PushRow`, `PushResponse`, `SyncCheckpoint`, `SyncDocument`
*   `apps/server/src/sync/sync-deps.ts` — `SyncDeps` interface for dependency injection
*   `apps/server/src/sync/sync.controller.ts` — REST endpoints: pull (line 32), push (line 57), SSE stream (line 97)

### SSE Broadcast

*   `apps/server/src/sync/sse-broadcast.service.ts`
    *   `register()` (connection tracking): Line 23
    *   `notifyChanged()` (broadcast SYNC_CHANGED): Line 40
    *   `notifyHouseholdRemoved()`: Line 51

### Diagnostic Event Bus & Overlay

*   `apps/web/src/core/diagnostics/event-bus.ts`
    *   `emitDiagnostic()`: Line 51
    *   `onDiagnostic()`: Line 62

*   `apps/web/src/components/diagnostics-overlay.tsx`
    *   `DiagnosticsOverlay` component: Line 34
    *   Renders SSE state, auth info, pull/push logs, resync events

### useRxMutation Hook

*   `apps/web/src/core/lib/useRxMutation.ts`
    *   `useRxMutation<TPatch>()`: Lines 57-119
    *   Supports `patch` (incrementalPatch) and `remove` modes
    *   Automatically bumps `updatedAt` to current time on every write

*   Usage examples in `apps/web/src/features/lists/hooks/useLists.ts`
    *   `useToggleItem` (patch): Lines 34-47
    *   `useUpdateItemQuantity` (patch): Lines 56-67
    *   `useRemoveItem` (remove): Lines 69-77

*   Usage in `apps/web/src/features/lists/hooks/useItems.ts`
    *   `useUpdateItem` (patch): Line 15

### Shopping Lock

*   `apps/server/src/shared/shopping-lock.ts`
    *   `checkShoppingLock()` pure function: Lines 9-25
    *   Returns `{ allowed: true }` or `{ allowed: false, reason: 'COMPLETED' | 'LOCKED_BY_OTHER' | 'MISSING_LOCK' }`
    *   Shared between REST (`access.service.ts`) and sync (`list-item-sync.ts`) layers

*   Unit tests: `apps/server/test/shared/shopping-lock.spec.ts`
