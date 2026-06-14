# ADR 007: Phase 4 Local-First Strategy

**Status:** Accepted  
**Date:** 2026-03-23  
**Deciders:** Development Team  
**Context:** Phase 4 — RxDB Local-First Migration

---

## Context

Phase 4 replaces React Query + REST fetching with RxDB local-first architecture. The browser
stores domain data in IndexedDB (via RxDB + Dexie.js), queries resolve instantly from the
local database, and a background replication protocol syncs changes with the NestJS backend.

This ADR documents three architectural decisions that govern how the local-first system
behaves:

1. How deletions are handled (soft-delete)
2. How conflicts between clients are resolved
3. Which operations are local-first vs. server-authoritative

---

## Decision 1: Soft-Delete (Big Bang)

### Problem

RxDB replication requires tombstones. When a record is deleted, a marker must remain in the
database so that other clients — which may be offline — learn about the deletion on their
next sync pull. With hard deletes, the row disappears and offline clients never learn it was
removed, causing deleted records to reappear.

### Decision

Add `deleted Boolean @default(false)` and `deletedAt DateTime?` to all 6 domain models
(Household, Store, Section, Item, List, ListItem) in a single Prisma migration. All
`prisma.*.delete()` calls become `prisma.*.update({ deleted: true, deletedAt: now })`.
All queries add `where: { deleted: false }` to exclude tombstones.

This is a backward-compatible backend change — existing API endpoints continue to work
identically, they just filter out soft-deleted rows.

### Consequences

- Cascade deletes (e.g., deleting a Store cascades to its Sections, Items, Lists, ListItems)
  must be reimplemented as soft-delete cascades in application code, since Prisma's
  `onDelete: Cascade` only triggers on hard deletes.
- A tombstone cleanup job will eventually be needed to purge records that have been
  `deleted = true` for longer than a threshold (e.g., 30 days). Not required for initial
  launch.

---

## Decision 2: Conflict Resolution (Server Wins + Shopping Lock + Guard Rails)

### Problem

When two household members edit the same data while one or both are offline, their changes
will eventually reach the server. A conflict strategy is needed.

### Decision

**Server wins** as the base strategy (RxDB default). When a client pushes a change, it
includes what it believes the server state to be (`assumedMasterState`). If the server
state has changed since then, the server rejects the push and sends back the current state.
The client silently adopts the server's version.

**Shopping lock** eliminates the highest-frequency conflict scenario. When a user enters
shopping mode (`startShopping`), the list is locked to that user via an `assignedTo` field.
The server rejects list item mutations from anyone else while the list is in SHOPPING status.
Entering shopping mode is an online-only action — the user must have connectivity to acquire
the lock. The offline benefit kicks in during the trip if connection drops.

**Guard rails** handle remaining edge cases:
- Uniqueness constraint violations (`Item[storeId, name]`, `ListItem[listId, itemId]`)
  return proper conflict responses instead of 500 errors
- `completeList` is idempotent — double-completion doesn't double-count `purchaseCount`
- State machine transitions (PLANNING → SHOPPING → COMPLETED) are validated server-side

### Rejected Alternatives

- **Last-write-wins (LWW):** Can silently lose edits with no advantage over server-wins for
  this domain.
- **Field-level merge:** Complex to implement and test. Overkill for grocery list data where
  conflicts are rare and low-severity.

### Consequences

- Multi-person split-aisle shopping (two people shopping the same list simultaneously in
  different aisles) is not supported. This is a future feature that would need its own
  design (per-section assignment or item claiming), not a conflict resolution concern.
- Conflict rejection during push is silent from the user's perspective — their local state
  gets overwritten by the server's version. For grocery lists this is acceptable (low
  severity). If this becomes a problem, toast notifications could be added.

---

## Decision 3: Local-First vs. Server-Authoritative Operations

### Problem

Not all operations fit the local-first model of "write locally, sync later." Some are
inherently transactional, multi-user, or have server-side effects. The system needs a clear
rule for which operations go through RxDB and which are direct API calls.

### Decision

**Local-first operations** (through RxDB, work offline):

| Operation | Notes |
|-----------|-------|
| `createStore` | |
| `updateStore` | |
| `deleteStore` | Soft-delete |
| `createSection` | |
| `updateSection` | |
| `deleteSection` | Soft-delete |
| `createList` | |
| `addItemToList` | May also create a new Item; both written locally |
| `removeItemFromList` | Soft-delete |
| `toggleListItem` | During shopping, lock holder only |
| `updateListItemQuantity` | During shopping, lock holder only |
| `updateItem` | |
| `searchItems` / `getTopItemsForStore` | Instant from local RxDB index |

**Server-authoritative operations** (direct API calls, require connectivity):

| Operation | Reason |
|-----------|--------|
| `startShopping` | Sets shopping lock — must be confirmed by server |
| `cancelShopping` | Releases shopping lock |
| `completeList` | Transaction: sets status + increments purchaseCount/lastPurchased |
| `reorderSections` | Atomic bulk update of N section order values, conflict-prone |
| `createHousehold` | Creates M:N membership in implicit join table |
| `deleteHousehold` | Multi-user membership change |
| `leaveHousehold` | Multi-user membership change |
| `createInvitation` | Server-side token generation |
| `joinHousehold` | Membership change |
| `revokeInvitation` | |
| `updateProfile` | Infrequent, NextAuth-managed |

### The Rule

An operation is **server-authoritative** if any of these apply:
1. It modifies data RxDB can't see (implicit join tables, NextAuth-managed models)
2. It has transactional side effects beyond the primary write (e.g., `completeList`)
3. It requires server confirmation for correctness (locks, token generation)
4. It performs atomic bulk updates that are conflict-prone (e.g., reorder)

Everything else is local-first.

### Consequences

- Server-authoritative operations show an error or disable their UI controls when offline.
  This is acceptable because these operations are either infrequent (household management,
  profile updates) or mark phase transitions (start/complete shopping) that naturally happen
  when the user has connectivity.
- New features should be evaluated against the rule above to determine their category.
  Default to local-first unless one of the four conditions applies.

---

## Decision 4: Migration Approach (Collection-by-Collection)

### Decision

Introduce RxDB incrementally, one collection at a time. Start with Section as the proof
of concept (simplest model — 4 fields, no relations, no server-computed state). Validate
the full sync cycle end-to-end before adding more collections.

Sequencing:
- **Phase 4a:** Section (proof of concept — sync, multi-tab, offline edit → reconnect)
- **Phase 4b:** Item, List, ListItem (core shopping flow)
- **Phase 4c:** Store, Household (remaining models) + offline UX + React Query removal

### Consequences

- Both React Query and RxDB coexist during transition (see Decision 5).
- Each collection is migrated fully before moving to the next — no model is ever
  split across both layers simultaneously.
- The transition window is narrowed to model boundaries, not component boundaries.

---

## Decision 5: Hook Interface Preservation During Migration

### Decision

React Query hooks are replaced with RxDB equivalents **behind the same interface**.
A hook like `useStore(id)` retains its call signature and return shape but swaps its
internals from `useQuery(fetch...)` to a RxDB `collection.findOne().$` observable
subscription. Components are never touched during migration — the hook file is the
sole migration boundary.

Once all hooks are migrated, React Query is removed as an unused dependency.

### Rejected Alternative

**React Query reading from RxDB** (keeping `useQuery` but pointing `queryFn` at RxDB)
was rejected as pointless indirection. React Query's value is network-caching and
stale/loading/error state management — none of which apply when the data source is
already a local database. Two reactivity systems for the same data with no benefit.

### Consequences

- During transition, unmigrated hooks still call the NestJS API directly. This is
  acceptable — the old endpoints remain functional throughout Phase 4.
- Hooks are the contract between data layer and UI. This decision preserves that
  contract across the migration with zero component churn.
