# Sync Overfetch Analysis

> **Created:** 2026-06-12
> **Status:** Open
> **Triggers:** A single client-side mutation (e.g., toggling a list item) generates 6–7 HTTP requests.

## Current state

1. User toggles a list item → `useToggleItem` writes directly to RxDB (optimistic local write).
2. RxDB push replication sends `POST /api/v1/sync/listItem/push` to the server.
3. Server processes push, then calls `sseBroadcast.notifyChanged()` to **all** household members (including the pusher).
4. Every connected client receives `SYNC_CHANGED` SSE event.
5. Client handler fires `RESYNC` into **all 6** pull-stream Subjects.
6. Each Subject triggers a pull: `GET /sync/{collection}/pull` — 6 calls.
7. Total: **1 push + 6 pulls = 7 requests** for a single toggle.

The SSE resync on the originating client is redundant — the local RxDB already has the correct state (optimistic write). The collection-scoped resyncs are wasteful because only `listItem` changed, yet `section`, `item`, `list`, `household`, and `store` are also re-pulled.

## Root causes

| # | Cause |
|---|-------|
| 1 | `SYNC_CHANGED` handler broadcasts to **all** pull streams, not scoped to affected collection(s) |
| 2 | `notifyChanged` includes the originating user (the pusher) in the SSE broadcast — they already have the latest data |
| 3 | The server pushes are colocated with REST mutations — a list-item toggle could be a single-source-of-truth write without needing SSE echo-back |

## Options to evaluate

### A. Scope SSE resync to affected collections only
- Parse `event.data.collections` in the client `SYNC_CHANGED` handler.
- Map collection names to specific `pullStream$` Subjects.
- Only fire `RESYNC` to the streams that match.
- **Impact:** 1 push + 1–2 pulls instead of 1+6.
- **Risk:** Need a `Map<collectionName, Subject>` instead of the current flat `Set`.

### B. Skip notifying the originating user
- Server `notifyChanged` excludes the user who triggered the push.
- Requires threading the pusher's ID to `SseBroadcastService` (already available in controller).
- Other clients still get full broadcast — unchanged for them.
- **Impact on pusher:** 1 push + 0 pulls (their local state is already correct).
- **Risk:** If push fails silently (conflict), the originating user won't know. Need conflict fallback.

### C. Bundle pull endpoints
- Server exposes `GET /sync/pull?collections=listItem,list&...`
- Client pulls all collections in one request, fanning results to each RxDB collection.
- **Impact:** 1 push + 1 bundled pull instead of 1+6.
- **Risk:** Major refactor of RxDB `replicateRxCollection` pattern. RxDB doesn't natively support merged-stream replication.

### D. Inline REST mutation results
- Instead of broadcasting SSE for local-first writes, return the updated document from the REST push endpoint.
- Client applies the server response directly to RxDB (optimistic + authoritative merge).
- SSE is only used for cross-client notification, not for self-echo.
- **Impact:** 1 push (with response body used as truth source) + SSE for other clients.
- **Risk:** Changes push response format. Needs careful conflict resolution.

### E. Batch/debounce resync signals
- Client-side: accumulate `RESYNC` signals over a ~200ms window, then fire a single pull per collection.
- Already have some debouncing through RxDB's `retryTime: 10_000` but that's for errors, not for intentional batching.
- **Impact:** Multiple rapid mutations within a window → 1 push each, but pulls batched.
- **Risk:** Adds latency for cross-client sync (other clients see changes slightly later).

## Recommendation priorities

Analyze in order:

1. **(A) Scoped resync** — lowest risk, immediate impact, clean architecture. The `SYNC_CHANGED` event already carries `{ collections: [...] }`. The client just needs to read it.
2. **(A + B combined) Scoped resync + skip self-notify** — eliminates redundancy for the originating user entirely.
3. **(C) Bundled pull** — evaluate if RxDB's pull handler can be adapted. May be too invasive given RxDB constraints.
4. **(D) Inline REST results** — evaluate for Phase 5+ when evaluating overall sync architecture.

## Related

- Bug 2 fix series (identity mismatch): `assignedTo` now stores Google OIDC `sub` everywhere
- Resync hook fixes: 15 mutation hooks now have `resync*()` in `onSuccess`
- `initDatabase()` now calls `resyncAll()` + `startPeriodicResync()` for fresh starts
