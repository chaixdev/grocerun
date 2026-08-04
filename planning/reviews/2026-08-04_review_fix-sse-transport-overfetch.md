# Review: fix/sse-transport-overfetch

## Summary

The branch correctly introduces collection-aware client routing, access-query memoization,
and a single NestJS `SseBroadcastService` instance. However, the broader audit found three
high-severity correctness regressions: push self-exclusion suppresses reconciliation and
all other same-user sessions, REST broadcast manifests omit collections actually changed
by cascades or side effects, and the client watchdog cannot observe the server's comment
heartbeats. These can leave clients stale or force a healthy SSE connection to reconnect
continuously. **Verdict: Request Changes.**

## Findings

### GROCERUN-61-01 — User-level exclusion suppresses reconciliation and other devices

**Severity:** HIGH
**Files:** `apps/server/src/sync/sync.controller.ts:71-80`, `apps/server/src/sync/sse-broadcast.service.ts:40-48`
**Tracks:** Logic & Correctness; Data & Persistence

**Problem:** `notifyChanged(..., user.userId)` excludes every SSE connection registered
under the pushing user ID, not only the connection that originated the push. A push from
one tab/device therefore suppresses notification to the user's other tabs/devices. More
importantly, accepted pushes can require a follow-up pull on the originating client:
`pushListItems` assigns server-authoritative `createdAt`, and soft-deleted restores may use
a canonical row ID different from the submitted ID. The implementation itself says these
values converge "on the next pull", but the new exclusion removes that pull trigger. This
can leave local state permanently divergent until another mutation, visibility change, or
reconnect happens.

**Fix:** Do not exclude by user ID. The safe minimal fix is to keep notifying all household
members and rely on collection-scoped routing to reduce the pusher's cost to one targeted
pull. If avoiding the originating connection remains required, introduce an opaque
connection/client ID and exclude only that connection after proving every accepted push
response contains enough canonical state for immediate reconciliation.

### GROCERUN-61-02 — Collection manifests omit rows changed by REST mutations

**Severity:** HIGH
**Files:** `apps/server/src/stores/stores.service.ts:89-99`, `apps/server/src/sections/sections.service.ts:85-111`, `apps/server/src/lists/lists.service.ts:134-237`, `apps/server/src/lists/lists.service.ts:345-387`
**Tracks:** Logic & Correctness; Data & Persistence

**Problem:** Before this branch, `SYNC_CHANGED` caused all six collections to pull, so the
producer-side `collections` arrays were advisory. They are now authoritative, but several
arrays do not describe all changed tables:

- Deleting a store soft-deletes `listItem`, `list`, `item`, `section`, and `store`, but
  broadcasts only `['store', 'section']`.
- Deleting a section sets matching items' `sectionId` to null, but broadcasts only
  `['section']`.
- Adding a new catalog item through `addItemToList` can create/restore both an `item` and a
  `listItem`, but broadcasts only `['list', 'listItem']`.
- Completing a list increments catalog item statistics, but broadcasts only
  `['list', 'listItem']`.

Other connected clients now leave the omitted RxDB collections stale. Local mutation hooks
also omit several of these resyncs, so the REST caller is not consistently protected.

**Fix:** Audit every REST mutation and emit the complete set of changed RxDB collections.
At minimum: store delete should include all affected collections; section delete should
include `item`; add-item paths that create/restore catalog items should include `item`; list
completion should include `item`. Prefer named, typed collection-manifest constants or
returning mutation effects from domain operations so future cascades cannot silently drift.

### GROCERUN-61-03 — Comment heartbeats never reset the client watchdog

**Severity:** HIGH
**Files:** `apps/server/src/sync/sync.controller.ts:131-134`, `apps/web/src/core/rxdb/database.ts:625-645`
**Tracks:** Logic & Correctness; Structure & Quality

**Problem:** The server sends SSE heartbeats as comments (`: heartbeat`), which EventSource
correctly ignores. The client watchdog resets only for dispatched `open`, `message`, or
named events. On an otherwise healthy idle stream, no JavaScript event occurs after
`open`, so the 20-second watchdog fires even though the server wrote a heartbeat at 15
seconds. The browser then closes and reconnects a healthy stream every 20 seconds, causing
full initial `RESYNC` pulls, unnecessary auth/database traffic, and connection churn.

**Fix:** Send a named heartbeat event (for example `event: HEARTBEAT\ndata: {}\n\n`) and
register a matching client listener that only resets the watchdog. Alternatively remove
the client watchdog and rely on EventSource/network error handling. Add fake-timer coverage
that advances beyond 20 seconds while heartbeats arrive and asserts no reconnect occurs.

### GROCERUN-61-04 — Shared SyncService cache is not request-scoped

**Severity:** MEDIUM
**File:** `apps/server/src/sync/sync.service.ts:31-53,64-100`
**Tracks:** Logic & Correctness; Structure & Quality

**Problem:** Nest services are singleton-scoped, so `accessCache` is shared by concurrent
requests. Each pull/push clears the same map at method entry. Interleaved requests can evict
one another's promises, and a future handler that performs two separated accesses can lose
the promised "within one request" memoization. The cache cannot currently leak one user's
IDs to another because keys include user IDs, but its lifetime contract is incorrect and
performance becomes timing-dependent under concurrency.

**Fix:** Create a fresh cache inside each `pull()`/`push()` invocation and pass it into a
request-local `SyncDeps`, or construct one `deps` object with closure-local memoized
promises per operation. Avoid request-scoping the entire Nest provider solely for this.

### GROCERUN-61-05 — SSE technical design is materially stale

**Severity:** MEDIUM
**File:** `wiki/technical-design/sse-resync-broadcast.md`
**Tracks:** Structure & Quality; Architecture Alignment

**Problem:** The canonical design still describes `NotificationService`, all-stream
`SYNC_CHANGED` routing, pusher notifications, a 25-second heartbeat, nonexistent
`unregisterAll`, nonexistent E2E files, and failure handling that is not implemented
(`res.write` exceptions are described as silently caught). This branch changes the protocol
semantics, so the stale document will mislead future changes and reviews.

**Fix:** Update the design after the correctness fixes are settled. Document the exact
collection-manifest contract, actual heartbeat/watchdog behavior, singleton provider
ownership, and real test inventory. Remove claims about nonexistent APIs and tests.

## Priority Action Items

| Order | Finding | Action |
|---|---|---|
| 1 | GROCERUN-61-01 | Restore targeted reconciliation and same-user multi-device delivery. |
| 2 | GROCERUN-61-02 | Correct every mutation's collection manifest and add cascade/side-effect tests. |
| 3 | GROCERUN-61-03 | Make heartbeat observable to the watchdog or remove the watchdog. |

## Test Gaps

- No test proves a push-created/restored document converges to server-authoritative fields.
- No test covers two SSE connections for the same user when one session pushes.
- No test verifies cascade/side-effect collection manifests for store deletion, section
  deletion, list item creation, or list completion.
- No fake-timer test covers an idle healthy SSE connection beyond the watchdog deadline.
- No concurrency test covers overlapping pull/push calls against `SyncService`.
- The repository contains no SSE E2E spec despite the technical design claiming two exist.

## Positive Notes

- The duplicate `SseBroadcastService` provider was correctly removed, restoring one
  application-wide connection registry.
- Malformed/empty/missing collection payloads retain a safe all-collection fallback.
- The focused routing helper is small and directly tested.
- Access cache keys include user IDs, preventing cross-user result reuse.
- Full uncached tests pass: server 144, web 102, DTO 52.

## Architecture Alignment

- **Relevant ADRs:** ADR 007 (local-first split), ADR 008 (testing strategy).
- **Relevant designs:** `rxdb-sync-protocol.md`, `sse-resync-broadcast.md`,
  `data-sync-and-concurrency.md`.
- **Current constraint:** six independent RxDB collections with targeted SSE-triggered pull.
- **Potential tension:** optimization must not remove required convergence or same-user
  multi-device propagation.
- **Conclusion:** aligned in direction, blocked by correctness details above.
