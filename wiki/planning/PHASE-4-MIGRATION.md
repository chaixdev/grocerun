# Phase 4: RxDB Local-First Migration Plan

> **Status:** In Progress — read path complete, write path incomplete  
> **Branch:** `feature/phase-4-rxdb`  
> **Created:** March 23, 2026  
> **Estimated effort:** 16–25 working days (see breakdown below)

---

## Goal

Replace React Query + REST fetching with RxDB local-first architecture. The browser
stores all domain data in IndexedDB (via RxDB + Dexie.js), queries resolve instantly
from the local database, and a background replication protocol syncs changes with the
NestJS backend.

```
BEFORE (Phase 3):
  Component → useQuery() → fetch /api/v1/* → NestJS → SQLite

AFTER (Phase 4):
  Component → RxDB collection.find().$  (instant, reactive, offline-capable)
                    ↕ background sync
              NestJS sync endpoints → SQLite
```

---

## Current State (Phase 3 Complete)

- **8 queries, 18 mutations, 2 plain async functions** on the client via React Query
- **30 API endpoints** on the NestJS backend (28 authenticated)
- **6 domain models** to replicate: Household, Store, Section, Item, List, ListItem
- **3 models** that stay server-only: User/Account/Session (NextAuth), Invitation (ephemeral)
- **No offline support, no service workers, no local persistence** currently
- Auth: `/api/token` returns JWT, stored in memory, sent as Bearer — designed for RxDB
  compatibility (ADR 006)

### Sync-Relevant Schema Gaps

| Gap | Impact |
|-----|--------|
| No soft-delete (`deleted` field) on any model | RxDB replication requires tombstones |
| No `updatedAt` on User model | Can't sync user profile changes |
| Implicit M:N join table `_HouseholdToUser` | RxDB can't sync what it can't see |
| `Item.purchaseCount` / `lastPurchased` are server-computed | Can't be naively synced from client |
| All deletes are hard deletes (`prisma.*.delete()`) | Deleted records reappear on offline clients |
| No composite index on `(updatedAt, id)` | Needed for efficient pull queries |

---

## Decision Gates

### Decision 1: RxDB vs. Alternatives

**Resolved: RxDB + Dexie.js (free tier)**

| Considered | Outcome |
|-----------|---------|
| RxDB + Dexie.js | **Selected** — proven sync protocol, reactive queries, free replication, multi-tab, sufficient for our data volumes |
| RxDB + Premium storage | Not needed — Dexie over IndexedDB is fine for hundreds of documents per household |
| Electric SQL | Rejected — requires Postgres, we use SQLite |
| PowerSync | Rejected — commercial SaaS, less self-hosted control |
| Custom sync + Dexie alone | Rejected — building conflict resolution, checkpoints, multi-tab from scratch is weeks of work |

**Licensing validated:** RxDB core + replication protocol + Dexie adapter are all Apache-2.0.
Dexie Cloud (paid) is their hosted sync service — irrelevant to us since we sync against our
own NestJS backend. RxDB Premium (paid) is faster storage adapters — unnecessary for grocery
list data volumes.

### Decision 2: Soft-Delete Migration Strategy

**Resolved: A. Big bang — single migration for all 6 models.** See [ADR 007](../adr/007-phase4-local-first-strategy.md) §Decision 1.

### Decision 3: Conflict Resolution Strategy

**Resolved: Server wins + shopping lock + guard rails.** See [ADR 007](../adr/007-phase4-local-first-strategy.md) §Decision 2.

### Decision 4: What Stays Server-Authoritative?

**Resolved: full mutation table in ADR.** See [ADR 007](../adr/007-phase4-local-first-strategy.md) §Decision 3.

### Decision 5: Migration Approach (Gradual vs. Big Bang)

**Resolved: B. Collection-by-collection**

Start with one collection end-to-end (Section as proof of concept), validate sync works,
then add collections incrementally per the 4a/4b/4c sequencing plan. The coexistence risk
is mitigated by migrating per-model fully — no model is ever half in one layer and half in
another. The hook interface (Decision 6) ensures components are unaffected during transition.

### Decision 6: React Query Coexistence

**Resolved: C. Same hook interface, new implementation**

Hooks like `useStore(id)` keep their call signature but swap internals from
`useQuery(fetch...)` to `collection.findOne().$` observable. Components never change.
The hook file is the migration boundary. Once all hooks are migrated, React Query is
removed as an unused dependency. Option B (React Query reading from RxDB) was rejected
as pointless indirection — React Query's caching model adds nothing when the data is
already local.

---

## Effort Estimate

| Work Package | Effort | Risk |
|-------------|--------|------|
| Backend: Soft-delete migration (Prisma schema + service changes) | 2–3 days | Medium |
| Backend: Sync endpoints (pull/push/stream, generic handler) | 3–4 days | High |
| Backend: Conflict guards (uniqueness, state machine) | 1–2 days | Medium |
| Frontend: RxDB setup (install, schemas, DB init, multi-tab) | 1–2 days | Low |
| Frontend: Replication config (per-collection, auth headers) | 2–3 days | High |
| Frontend: Rewire hooks (RxDB observables replace React Query) | 3–5 days | Medium |
| Frontend: Offline UX (network indicator, pending state) | 1–2 days | Low |
| Frontend: Remove React Query + cleanup | 1 day | Low |
| Testing: Sync correctness (offline/online, conflicts, multi-tab) | 2–3 days | High |
| **Total** | **16–25 days** | |

---

## High-Risk Chokepoints

1. **Soft-delete is prerequisite for everything** — can't test sync without tombstones. Should
   be done first, possibly before Phase 4 proper (backward-compatible backend change).

2. **Sync endpoint contract** — the pull/push/stream protocol is the hardest part. Once one
   collection works end-to-end, the rest are mechanical. Prototype with simplest model
   (`Section` — 4 fields, no relations, no server-computed state).

3. **`completeList` transaction** — atomically sets status, increments `purchaseCount` on
   items, sets `lastPurchased`. Client writes `list.status = COMPLETED` locally, but the
   purchaseCount side-effect must happen server-side during push. Needs custom push handler.

4. **Implicit M:N join table** (`_HouseholdToUser`) — Prisma manages this silently. RxDB
   can't sync it. Options: model explicitly, or treat household membership as
   server-authoritative (recommended).

5. **Uniqueness constraints** — `Item[storeId, name]` and `ListItem[listId, itemId]` are
   enforced at DB level. Offline clients could create duplicates that conflict on sync.

---

## Sync Protocol Requirements

RxDB replication expects 3 server endpoints per collection:

### Pull: `GET /sync/:collection/pull`

```
Query: ?updatedAt=<timestamp>&id=<lastId>&batchSize=<n>
Response: {
  documents: [{ id, ...fields, updatedAt, _deleted }],
  checkpoint: { id, updatedAt }
}
```

Server SQL: `WHERE (updatedAt > ? OR (updatedAt = ? AND id > ?)) ORDER BY updatedAt ASC, id ASC LIMIT ?`

### Push: `POST /sync/:collection/push`

```
Body: [{ newDocumentState, assumedMasterState }]
Response: [conflicting master states]  // empty array = all succeeded
```

Server compares `assumedMasterState.updatedAt` with actual DB state. Mismatch = conflict.
Server always overwrites `updatedAt` with its own timestamp (client clocks untrusted).

### Stream: `GET /sync/:collection/stream` (SSE)

```
Event data: { documents: [...], checkpoint: { id, updatedAt } }
Special event: "RESYNC" (tells client to re-pull from checkpoint)
```

For 6 collections = 18 endpoints (shareable via generic handler parameterized by model).

---

## Data Model for Sync

### Models to replicate (6):

| Model | Fields | Sync Notes |
|-------|--------|------------|
| Household | id, name, ownerId, createdAt, updatedAt | M:N with User handled server-side |
| Store | id, name, location, imageUrl, householdId, createdAt, updatedAt | Cascade delete → soft-delete cascade |
| Section | id, name, order, storeId, createdAt, updatedAt | Reorder conflicts possible |
| Item | id, name, storeId, sectionId, purchaseCount, lastPurchased, defaultUnit, createdAt, updatedAt | purchaseCount is server-authoritative |
| List | id, name, storeId, status, createdAt, updatedAt | State machine: PLANNING→SHOPPING→COMPLETED |
| ListItem | id, listId, itemId, isChecked, quantity, unit, purchasedQuantity, createdAt, updatedAt | Highest mutation frequency |

### Models that stay server-only (not synced):

| Model | Reason |
|-------|--------|
| User, Account, Session, VerificationToken | NextAuth-managed |
| Invitation | Ephemeral token-based flow, no offline use case |

---

## Recommended Sequencing

### Pre-Phase 4 (can start now, backward-compatible):
1. ~~Resolve Decision Gates 2–6~~ — **DONE** (see ADR 007)
2. ~~Write ADR 007 documenting decisions~~ — **DONE**
3. Backend: Add `deleted` field + soft-delete to all 6 domain models

### Phase 4a — Proof of Concept (1 collection end-to-end):
4. Backend: Build generic sync endpoints, test with `Section` collection
5. Frontend: Install RxDB + Dexie, create `Section` schema, wire replication
6. Frontend: Swap `useSections` hook to read from RxDB
7. Validate: sync, multi-tab, offline edit → reconnect → sync

### Phase 4b — Core Shopping Flow:
8. Add `List`, `ListItem`, `Item` collections + replication
9. Swap list/item hooks to RxDB
10. Wire `ItemAutocomplete` to local RxDB query (instant search)
11. Custom push handler for `completeList` side-effects

### Phase 4c — Full Offline + Cleanup:
12. Add `Store`, `Household` collections + replication
13. Swap remaining hooks, add offline UX (network indicator)
14. Remove React Query entirely
15. E2E testing of offline scenarios

### Follow-on Work

Post-Phase-4 simplification and hardening is tracked in a dedicated document:

- [Phase 5: Simplification / 3am Hardening](./PHASE-5-SIMPLIFICATION.md)

> **Note:** Phase 5 work was started before Phase 4 was complete. The sync service
> split, client replication simplification, and dependency trimming done under Phase 5
> are valid and do not need to be undone — but the Phase 4 write path (local-first
> mutations) must be completed before Phase 4 is considered done.

### What Is Complete (Phase 4)

- All 6 collections synced via RxDB pull replication ✓
- SSE stream + 5s periodic resync ✓
- Soft-delete on all 6 domain models ✓
- Household scope changes: `HOUSEHOLD_REMOVED` SSE event + local subtree purge ✓
- Shopping lock (`List.assignedTo`) ✓
- React Query fully removed ✓
- Running in staging ✓

### What Is Remaining (Phase 4)

The **write path** was never implemented. Every mutation in the codebase is REST-only —
it calls the server directly with no local write. If the network is unavailable, the
mutation fails immediately.

Per ADR 007 Decision 3, the following operations are designated **local-first** and must
write to RxDB first, with push replication syncing to the server in the background:

| Operation | Hook | Priority |
|-----------|------|----------|
| `toggleListItem` | `useToggleItem` | Critical — happens constantly in-store |
| `updateListItemQuantity` | `useUpdateItemQuantity` | Critical — same context |
| `addItemToList` | `useAddItem` | High |
| `removeItemFromList` | `useRemoveItem` | High |
| `createList` | `useCreateList` | High |
| `createStore` | `useCreateStore` | Medium |
| `updateStore` | `useUpdateStore` | Medium |
| `deleteStore` | `useDeleteStore` | Medium |
| `createSection` | `useCreateSection` | Medium |
| `updateSection` | `useUpdateSection` | Medium |
| `deleteSection` | `useDeleteSection` | Medium |
| `reorderSections` | `useReorderSections` | Low — bulk atomic, may stay server-auth |
| `updateItem` | `useUpdateItem` | Medium |

The server-authoritative operations in ADR 007 Decision 3 (`startShopping`,
`completeList`, `createHousehold`, household membership operations) are correctly
implemented as REST-only and require no changes.

### Post-Refactor Household Management Gaps

These are intentionally out of scope for the RxDB refactor and should be handled as
follow-up product work after Phase 4 stabilizes:

- Ownership transfer between household members
- Household member list UI
- Owner ability to remove/kick a member
- Better delete/leave flows for multi-member households
- Clearer membership/admin policies for edge cases (legacy households, sole owner leaving, etc.)

Current product rule during the refactor:

- A household owner may delete a household only when they are the sole remaining member
- Multi-member household deletion is blocked in the UI and by the backend

---

## References

- [ADR 002: Evolutive Architecture](../adr/002-evolutive-architecture.md) — Phase 4 definition
- [ADR 003: JWT Authentication](../adr/003-jwt-authentication.md) — Phase 4 auth pattern
- [ADR 006: Phase 3 Auth Strategy](../adr/006-phase3-auth-strategy.md) — Token endpoint designed for RxDB compat
- [ADR 007: Phase 4 Local-First Strategy](../adr/007-phase4-local-first-strategy.md) — Soft-delete, conflict resolution, local vs. server authority
- [RxDB Documentation](https://rxdb.info/)
- [RxDB Replication Protocol](https://rxdb.info/replication.html)
- [Dexie.js](https://dexie.org/) — Apache-2.0 IndexedDB wrapper
