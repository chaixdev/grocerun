# Phase 4: RxDB Foundation and Active Shopping Baseline

> **Status:** Delivered baseline; strategic hardening moved to Phase 5  
> **Branch:** `feature/phase-4-rxdb`  
> **Created:** March 23, 2026  
> **Last updated:** June 8, 2026

---

## Reality Check

Phase 4 started as a broad RxDB local-first migration. The implementation delivered
a strong RxDB foundation and a partially local-first active shopping flow, but the
next direction is no longer "make the whole app local-first."

Phase 5 supersedes the broad interpretation with a narrower target:

```text
Server-first app management
+
Local-first active shopping session
+
Shared sync/invalidation layer for convergence
```

This Phase 4 document records what was delivered, what remains useful, and what has
been moved to [Phase 5: Active Shopping Sync Simplification](./PHASE-5-SIMPLIFICATION.md).

---

## Original Goal

The original Phase 4 goal was to replace React Query + REST fetching with RxDB-backed
local state:

```text
BEFORE:
  Component -> useQuery() -> /api/v1/* -> NestJS -> SQLite

AFTER:
  Component -> RxDB observable query -> IndexedDB
                         <-> sync protocol <-> NestJS -> SQLite
```

That goal was useful as a migration vector, but it was broader than the product need.
The strongest product need is offline-resilient active shopping with live partner
updates when online.

---

## Delivered in Phase 4

### Client foundation

- RxDB + Dexie installed in the web app.
- Local database singleton created in `apps/web/src/core/rxdb/database.ts`.
- RxDB schemas created for six collections:
  - `households`
  - `stores`
  - `sections`
  - `items`
  - `lists`
  - `listItems`
- React Query removed.
- Server Actions removed from normal app data flow.
- Client pages converted to client-rendered shells using custom hooks.
- Main reads moved to RxDB subscriptions/read-through local cache.

### Server sync foundation

- Sync module added to NestJS.
- Pull/push/stream endpoints implemented under `/api/v1/sync/*`.
- Pull replication implemented for six collections.
- Push handlers implemented on the server for six collections.
- Soft-delete fields added to domain models to support tombstones.
- SSE stream implemented for resync notifications.
- Server-side notifications added to several REST mutation paths.

### Active shopping baseline

- `item` push replication enabled on the client.
- `listItem` push replication enabled on the client.
- Local-first shopping mutations implemented for:
  - add item to list
  - remove item from list
  - toggle checked state
  - update quantity / purchased quantity
- Item autocomplete reads from local RxDB item data.
- Shopping lock model exists via `List.assignedTo`.

### Operations still intentionally server-first

- Start shopping.
- Cancel shopping.
- Complete shopping trip.
- Household creation/deletion/leave/join.
- Invitations.
- Store CRUD.
- Section CRUD and reorder.
- Profile/auth.

---

## Important Delivered Tradeoffs

### React Query was removed

This was intentional and remains defensible. RxDB is now the durable local data
source and reactive query layer. Keeping React Query in front of RxDB would create
a second cache with unclear authority.

### Broad reads are local, broad writes are not

Phase 4 moved many reads to RxDB, including households/stores/sections/lists needed
to render app screens. That does not imply all writes should become local-first.

Phase 5 keeps the useful read-through cache where it supports shopping UX, but avoids
expanding local-first writes into admin/config domains without a strong product reason.

### Sync exists, but robustness is incomplete

The sync architecture is functional enough to prove the model, but not yet robust
enough to treat as complete offline/collaborative infrastructure.

Known risk areas moved to Phase 5:

- token refresh inside replication
- targeted invalidation instead of broad/manual resync
- tombstone propagation for cascaded deletes
- duplicate item/list-item conflict handling
- shopping lock enforcement in sync push
- UI jitter from optimistic state vs. remote pulls
- stale local data after membership/access changes

---

## What Was Ported to Phase 5

The following work is no longer considered remaining Phase 4 implementation. It is
now Phase 5 refocus/simplification work.

### Ported: sync hardening

- Refresh JWTs from RxDB pull/push/SSE paths.
- Surface delayed/failed sync in active shopping.
- Make diagnostics optional and non-critical.

### Ported: invalidation simplification

- Replace scattered `resync*()` calls and broad `RESYNC` usage with targeted
  server-originated invalidation.
- Centralize sync notification in one server helper.

### Ported: tombstone correctness

- Ensure normal pull replication can deliver deleted rows after store/household
  deletes and membership changes.
- Reduce reliance on special `HOUSEHOLD_REMOVED` cleanup as the only correctness path.

### Ported: write-scope reduction

- Keep local-first writes focused on active shopping.
- Do not expand local-first writes to households, stores, sections, membership,
  invitations, profile, or other admin/config domains by default.
- Delete or disable unused push paths for non-local-first collections.

### Ported: active shopping robustness

- Enforce shopping lock in sync push handlers.
- Canonicalize duplicate item/list-item pushes.
- Define simple server-authoritative conflict rules.

### Ported: UI jitter reduction

- Track pending local writes separately from server-confirmed state.
- Avoid optimistic state snap-back during active edits.
- Flush debounced writes safely.
- Narrow subscriptions/recomputes.

### Ported: transitional cleanup

- Remove dead migration scaffolding.
- Remove stale broad local-first assumptions from code and docs.
- Keep polling only as degraded fallback.

---

## Current Architecture After Phase 4

```text
Browser UI
  -> custom hooks
  -> RxDB / IndexedDB local reads
  -> local item/listItem writes for shopping actions
  -> RxDB push replication for item/listItem
  -> NestJS sync endpoints
  -> Prisma / SQLite
  -> SSE resync notification
  -> client pull replication
  -> RxDB
  -> UI
```

REST still handles server-first commands:

```text
Browser UI
  -> REST command
  -> NestJS service
  -> Prisma / SQLite
  -> SSE notification where implemented
  -> client pull replication
  -> RxDB
  -> UI
```

The Phase 5 goal is to make those two paths converge through one consistent
invalidation and RxDB-pull model.

---

## Phase 4 Completion Criteria

Phase 4 should be considered complete as a foundation when these statements are true:

- The app has an RxDB/Dexie local database.
- The main domain collections can pull from the server.
- Active shopping item/list-item operations can write locally.
- The server can receive pushed item/list-item changes.
- Client UI reads shared shopping state from RxDB.
- React Query and Server Actions are no longer the normal app data layer.

Those criteria have been met enough to move to Phase 5.

---

## Non-Goals for Phase 4

These are explicitly not Phase 4 completion blockers anymore:

- Whole-app local-first writes.
- Offline household/store/section administration.
- Offline invitations or membership changes.
- Fully robust conflict handling.
- Fully robust tombstone retention/purge policy.
- Polished pending-sync UI.
- Production-grade multi-process SSE fanout.

They are either Phase 5 work or future product work.

---

## References

- [Phase 5: Active Shopping Sync Simplification](./PHASE-5-SIMPLIFICATION.md)
- [ADR 007: Phase 4 Local-First Strategy](../adr/007-phase4-local-first-strategy.md)
- [RxDB Documentation](https://rxdb.info/)
- [RxDB Replication Protocol](https://rxdb.info/replication.html)
- [Dexie.js](https://dexie.org/)
