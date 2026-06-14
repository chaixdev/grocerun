# Phase 5: Active Shopping Sync Simplification

> **Status:** Planned  
> **Branch:** `feature/phase-4-rxdb`  
> **Created:** March 25, 2026  
> **Last updated:** June 8, 2026

---

## Purpose

Phase 5 supersedes the broad "whole-app local-first" interpretation of Phase 4.
The new target is narrower and more defensible:

```text
Server-first app management
+
Local-first active shopping session
+
Shared sync/invalidation layer for convergence
```

The product goal is not to make every domain editable offline. The product goal is
to make shopping reliable in poor connectivity while still supporting live partner
updates when connectivity is available.

---

## North Star

For active shopping data:

```text
User action
-> local RxDB write
-> UI updates immediately
-> RxDB push retries until online
-> server validates, canonicalizes, writes
-> server emits sync invalidation
-> all clients pull deltas
-> RxDB updates
-> UI reconciles calmly
```

For server-first app management commands:

```text
User action
-> REST command
-> server writes canonical state
-> server emits sync invalidation
-> clients pull deltas
-> RxDB updates
-> UI updates
```

The important simplification is that **shared UI-visible state should enter the
client through RxDB pull**, regardless of whether the source was a local shopping
write, a spouse's update, or a REST command.

---

## Scope Decision

### Local-first write scope

Keep local-first writes for the active shopping workflow:

- Active list item add/remove
- Check/uncheck
- Planned quantity changes
- Purchased quantity changes
- Item records created as part of adding a list item
- Item catalog reads needed by active shopping autocomplete

### Server-first command scope

Keep these server-authoritative:

- Households
- Membership and invitations
- Stores
- Sections and section reorder
- Profile/auth
- Start shopping
- Cancel shopping
- Complete shopping trip

These operations either manage permissions, perform multi-row transactions, mutate
data RxDB cannot fully model, or have weak offline value compared with their
complexity.

---

## Guardrails From Original Phase 5

The original Phase 5 plan had a useful simplification rubric. Keep it as a
constraint on this refocus.

Use the 3am test for every sync abstraction:

- Does this abstraction remove repeated business logic, or only repeated syntax?
- Does it make failure modes clearer, or hide them?
- Would a new engineer understand it faster than duplicated explicit code?
- If removed, would the code become more honest?
- If someone gets called out of bed for a production sync issue, can they find
  and fix it without reconstructing hidden control flow?

Implementation guardrails:

- Do not build a generic sync DSL.
- Do not optimize for DRY if it makes stack traces or control flow harder to follow.
- Do not hide ownership boundaries behind config objects unless they improve debugging.
- Prefer explicit, local code over reusable but opaque infrastructure.
- RxDB pull is the only shared UI data ingress.
- Local-first writes are opt-in, not the default.
- Server authority for permissions, locks, lifecycle transitions, and canonical
  conflict decisions must remain obvious in code.

---

## Step 1: Stabilize Current Sync

Goal: stop silent sync failure before changing architecture shape.

Tasks:

- Add token expiry handling to the sync path.
- Make RxDB pull, push, and SSE reconnect refresh token on `401` and retry once.
- Surface delayed/failed sync in the active shopping UI.
- Keep diagnostics optional and non-critical.
- Ensure `item` REST updates emit sync invalidation until they are fully routed
  through the active-shopping sync model.
- Preserve the useful diagnostics overlay, but keep diagnostic event emission as
  best-effort observability only.

Acceptance criteria:

- Sync recovers after JWT expiry without requiring a manual page reload.
- Offline changes made with an expired token push after reconnect + refresh.
- Diagnostics can be disabled without changing sync behavior.
- Item metadata edits made on one client are seen by other clients via sync pull.

---

## Step 2: Simplify Invalidation

Goal: replace ad hoc resync paths with one server-originated invalidation model.

Tasks:

- Introduce a single sync event shape, for example:

```json
{
  "type": "SYNC_CHANGED",
  "collections": ["listItem", "item", "list"],
  "reason": "listItem.push"
}
```

- Centralize server notification behind one helper such as
  `notifySyncChanged(userIds, collections, reason)`.
- Use the helper from sync push handlers and REST command handlers.
- Replace hook-level `resync*()` calls after REST writes where the server can emit
  the invalidation instead.
- Remove redundant `resync*()` calls from local-first mutation `onSuccess` handlers;
  push replication plus server invalidation should drive convergence.
- Keep a broad manual "force resync" only for diagnostics/recovery.

Acceptance criteria:

- A server write has exactly one standard way to tell clients what to pull.
- Client hooks do not need to know which REST command affects which local cache.
- Healthy SSE avoids polling; polling is only degraded-mode fallback.
- Mobile foregrounding triggers an immediate pull through the same invalidation path.

---

## Step 3: Fix Tombstones

Goal: eliminate ghost local data after deletes, membership changes, and reconnects.

Tasks:

- Make tombstone pull the correctness mechanism for all synced collections.
- Ensure deleted children of deleted stores/households remain visible to sync pulls
  long enough for clients to receive `_deleted: true`.
- Stop relying on `HOUSEHOLD_REMOVED` as the only correctness path. It may remain
  as an optimization, but reconnect pull must be sufficient.
- Split normal access queries from sync visibility queries where needed.
- Define tombstone retention, for example 30 days before purge.
- Remove or replace local purge behavior that creates push-retry loops after a
  membership/access change.

Acceptance criteria:

- A client offline during a store/household delete removes all affected local rows
  after reconnect through normal sync.
- Leaving/removal from a household does not create infinite push retry loops.
- Deleted rows do not reappear from stale local IndexedDB state.

---

## Step 4: Narrow Local-First Writes

Goal: reduce the sync write surface to the data that genuinely benefits from
offline-first behavior.

Tasks:

- Keep push replication for `item` and `listItem`.
- Do not expand local-first writes to households, stores, sections, invitations,
  profile, or membership.
- Decide whether `list` push is required. Prefer server-first for list lifecycle
  commands unless there is a concrete offline-shopping need.
- Review remaining REST mutations explicitly and classify them server-first unless
  they support active-shopping offline behavior.
- Delete or explicitly disable unused server push handlers for non-local-first
  collections.
- Keep pull replication for read-through cache only where it supports active
  shopping rendering.

Acceptance criteria:

- There is no unused "future maybe" push path for admin/config collections.
- Active shopping remains offline-capable.
- Admin/config operations remain simpler, server-authoritative REST commands.

---

## Step 5: Make Active Shopping Robust

Goal: support faraday-cage shopping and spouse-at-home live updates through the
same convergence loop.

Tasks:

- Enforce shopping lock rules in sync push, not just in the UI.
- Handle duplicate item creation by canonicalizing `(storeId, normalizedName)`.
- Handle duplicate list items by canonicalizing `(listId, itemId)`.
- Define and document simple conflict rules:
  - `isChecked`: server last accepted write wins.
  - `quantity` / `purchasedQuantity`: server last accepted write wins.
  - duplicate item: canonical server item wins.
  - duplicate list item: canonical server list item wins.
  - remove item: tombstone wins unless server rejects for permissions.
  - complete trip: online-only server command.
- Add pending/failed/conflict sync state where users need feedback.

Acceptance criteria:

- Two clients can edit the same active list online and converge through sync.
- A shopper can make list-item changes offline and push them after reconnect.
- Duplicate offline item additions do not break push replication.
- Non-lock-holders cannot mutate shopping list items by bypassing the UI.

---

## Step 6: Reduce UI Jitter

Goal: make sync feel calm instead of visually snapping between local, remote, and
server-normalized states.

Tasks:

- Track local pending writes separately from server-confirmed state.
- Avoid blindly resetting optimistic checked/quantity state on every RxDB emission
  while a row has an active pending edit.
- Fix shopping quantity semantics so changing purchased quantity checks the item
  when that is the intended product behavior.
- Flush debounced quantity writes on unmount instead of discarding visible changes.
- Narrow RxDB subscriptions so unrelated collection changes do not rebuild the
  whole active list view.
- Remove non-reactive REST fallbacks for RxDB-backed active shopping screens. If
  data has not replicated yet, show loading/not-found states instead of rendering
  one-off REST data that will not receive live updates.
- Use specific RxDB selectors for active-list subscriptions instead of broad
  collection-wide subscriptions where practical.
- Preserve row identity and display order unless section/order data actually changes.

Acceptance criteria:

- Rapid quantity taps do not flicker or revert while sync is running.
- Remote spouse updates appear predictably without moving unrelated rows.
- A visible local edit is either committed, marked pending, or shown as failed; it
  is not silently dropped.

---

## Step 7: Delete Transitional Code

Goal: remove the old migration surface area once the refocused model is stable.

Tasks:

- Remove unused server push handlers for collections that are no longer local-first.
- Remove special cleanup paths that are no longer required for correctness once
  tombstone sync is reliable.
- Remove hook-level manual resync calls that duplicate server invalidation.
- Remove stale Phase 3 / React Query assumptions from docs and comments.
- Delete dead server sync code left behind after collection-module extraction.
- Keep dependency and CVE hygiene as a follow-up cleanup stream after sync behavior
  is stable.
- Keep periodic resync only as degraded fallback, not as normal operation.
- Keep diagnostics tooling if useful, but keep it clearly separated from sync
  correctness.

Acceptance criteria:

- The implementation has one obvious active-shopping sync path.
- Server-first commands have one obvious REST + invalidation path.
- Docs and code no longer imply a broad whole-app local-first write strategy.

---

## Implementation Notes (June 2026)

### Step 1: Token Refresh — Already Implemented

Token expiry handling on 401 + force-refresh + single retry already exists in
`apps/web/src/core/rxdb/database.ts` (lines 392-401 for pull, lines 431-432 for
push). No further work needed.

### Step 2: `resync*()` Calls — Intentionally Kept

The plan states: "Remove hook-level manual resync calls that duplicate server
invalidation." During the June 2026 codebase audit cleanup, we evaluated removing
the ~19 `resync*()` calls from mutation hook `onSuccess` callbacks and decided
against it.

**Rationale for keeping them:**

The SSE stream (RESYNC/SYNC_CHANGED events) is the primary invalidation path.
When SSE is healthy, the server-emitted events trigger RxDB re-pulls and the
manual `resync*()` calls are redundant because RxDB's checkpoint mechanism
ignores duplicate pulls.

However, when SSE is **down** (connection drops, proxy timeout, network blip),
the only remaining path is the periodic 5-second fallback timer. Without the
manual `resync*()` calls, a user clicking "Create List" or "Start Shopping"
would experience up to 5 seconds of lag before the UI updates. This is visible
and jarring — a regression from current behavior.

**Cost of keeping them:** each `resync*()` call triggers a lightweight pull
request. The server-side checkpoint mechanism prevents duplicate data transfer.
The client-side cost is one extra network round-trip per REST mutation — ~10ms
on LAN, acceptable on all connections.

**Decision:** Keep manual `resync*()` calls as cheap insurance against SSE
outages. Revisit if the SSE fallback timer is reduced (e.g., from 5s to 1s) or
if a WebSocket-based push notification replaces SSE entirely.

**Carry-forward status:** The "remove resync calls" task is intentionally
deferred, not forgotten. Documented here so future readers understand the
trade-off.

---

These items from the original Phase 5 audit remain valid, but they are now mapped
to the refocused active-shopping strategy.

| Original audit item | Phase 5 step | Carry-forward decision |
|---------------------|--------------|------------------------|
| Push writes should notify household members, not only same-user sessions | Step 2 | Keep, but implement via standard targeted sync invalidation |
| Household subtree purge can create ghost delete push loops | Step 3 | Keep, but solve through tombstone correctness and expected access-loss handling |
| `useListDetail` REST fallback is non-reactive | Step 6 | Keep; active shopping screens should wait for RxDB or show not-found |
| 5s periodic resync is wasteful when SSE is healthy | Step 2 | Keep; polling is degraded fallback only |
| Mobile background-to-foreground needs immediate resync | Step 2 | Keep; foreground should trigger pull/invalidation handling |
| Local-first mutation `onSuccess` resync calls are redundant | Step 2 | Keep; local writes converge through push + server invalidation |
| `useStoreLists` and active list hooks over-fetch/recompute | Step 6 | Keep where it affects active shopping jitter/performance |
| Broad collection subscriptions cause cascade recomputes | Step 6 | Keep; narrow selectors where practical |
| Dead code in `sync.service.ts` after collection split | Step 7 | Keep if still present |
| Client ID format differs from server IDs | Step 7 | Optional cleanup only; not a behavior blocker |
| SSE auth token in query string | Step 1 | Accepted short-term tradeoff; revisit only if token lifetime/logging risk changes |
| `useMutation` stale callback identity | Step 7 | Optional cleanup only; not a sync correctness issue |
| Remaining REST mutations were previously planned as local-first | Step 4 | Reclassify; do not migrate by default |

---

## Explicit Non-Carry-Forward

The old Phase 5 plan included a Tier 4 to convert remaining REST mutations to
local-first. That direction is intentionally not carried forward as written.

Replacement rule:

- Active shopping writes may be local-first.
- Admin/config writes remain server-first unless a concrete offline-shopping use
  case justifies the added sync surface.

---

## First Implementation Slice

The highest-value first PR should be a sync hardening slice:

1. Add token refresh handling to replication.
2. Add `SYNC_CHANGED` event support.
3. Make item REST updates notify.
4. Enforce shopping lock in `pushListItems()`.
5. Handle duplicate item push conflicts.
6. Fix quantity-change jitter/semantics.

This addresses the most likely real-world failures without redesigning the whole
app at once.

---

## References

- [Phase 4: RxDB Foundation and Active Shopping Baseline](./PHASE-4-MIGRATION.md)
- [ADR 007: Phase 4 Local-First Strategy](../adr/007-phase4-local-first-strategy.md)
- [RxDB Replication Protocol](https://rxdb.info/replication.html)
