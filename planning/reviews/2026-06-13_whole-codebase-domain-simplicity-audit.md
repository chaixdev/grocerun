# Whole-Codebase Domain And Simplicity Audit

Date: 2026-06-13

Scope: `apps/server`, `apps/web`, `packages/dto`, relevant `wiki/` and `planning/` docs.

Review stance: code is liability. Prefer fewer moving parts, fewer ownership modes, fewer duplicate paths, and invariants encoded close to the write boundary. Avoid DRY that conflates responsibilities, but remove repeated logic when repetition is hiding divergent behavior.

Product invariants used for this audit:

- Shareable households with common stores, store layouts, shopping lists per store.
- Dual list lifecycle: planning mode and shopping mode, with completed history.
- Mobile-first UX.
- Local-first and offline-capable reads/writes where intended.
- Mixed ownership: some entities are server-authoritative, some support local-first push.
- Soft-delete/tombstone sync for replicated business entities.

## Executive Summary

The codebase has a mostly coherent domain shape: `Household -> Store -> Section/Item/List -> ListItem`, with RxDB pulling six collections and the server retaining authority for household/store/section/list lifecycle. The biggest maintainability issue is not lack of abstraction; it is too many partially overlapping ownership paths. A few entities are REST-only, two are push-replicated, and several business operations still exist in both REST and sync forms. That split is workable only if write ownership and invariants are explicit and enforced at every boundary.

The highest-risk problems are data consistency risks in sync push handlers and local cache cleanup. Current sync push code trusts client-supplied parent identifiers and timestamps too much. The frontend also uses replicated deletes as a local eviction mechanism after household removal, which can turn an access-control/cache operation into destructive shared-data tombstones.

From a simplicity perspective, the next phase should prioritize removing ambiguous ownership and tightening invariants, not adding another abstraction layer. The mature direction is: make server time authoritative, validate immutable parent relationships on sync writes, reject unsupported pushes clearly, make cache eviction non-replicating by construction, and document the exact local-first boundary as an enforceable contract.

## Remediation Quality Review

The first version of this audit framed many recommendations as small fixes. That was useful for locating the fault lines, but it is not sufficient for long-term stability. The local-first boundary is foundational architecture, so the remediation should be treated as an explicit sync contract with tests and failure-mode handling, not as isolated patches.

For the three critical findings, the durable fixes should establish system rules:

- Local cache eviction and domain deletion must be different operations at the API level, not just different call sites.
- Server replication metadata must be server-authored, even when business content is client-authored.
- Sync push must validate canonical aggregate membership from stored data, not from the client's claimed document shape.

The suggestions below are therefore written as stability-focused remediations. Tactical steps are acceptable only when they move the code toward those contracts rather than merely masking the current symptom.

## Remediation Maturity Classification

Not every finding deserves the same treatment. Some are bugs that can be fixed locally. Others expose missing contracts and should not be handled as one-off patches. The durable remediation plan should classify them this way:

### Architectural Contracts

These findings should become explicit domain/sync contracts with shared enforcement and tests:

- C1, M1: Local eviction versus replicated domain deletion. This is one contract, not two separate bugs.
- C2: Server-owned replication ordering. This is part of the sync protocol.
- C3, H1, H2, M14: Aggregate membership validation. `Item`, `Section`, `List`, and `ListItem` relationships must be validated from canonical stored state.
- H3: Catalog delete semantics. The app needs an explicit policy for whether catalog items can be deleted while active list items reference them.
- H5, D1: Server-authoritative versus local-first write ownership. Unsupported pushes must fail loudly, and docs must describe the same boundary as code.
- H7: Local optimistic success versus server business acceptance. The UI needs an accepted/pending/rejected model for local-first writes, not only a local-write success toast.
- H10: Offline scope for list lifecycle. Either lifecycle transitions are local-first/queued or clearly online-only.
- H11, H12: List lifecycle concurrency and active-list-per-store invariants. These should be enforced atomically at the server boundary.
- M13, D4: Shopping lifecycle/history and collaboration semantics. The domain model and docs should encode whether completed trips and multi-person shopping are first-class requirements.

### Durable Engineering Hardening

These findings are narrower, but should still be solved with reusable conventions or test coverage, not incidental line edits:

- H4: Invitation lifecycle must be tied to household lifecycle.
- H6: Collection-specific resync calls should be reviewed as a class of issue, not only the current `sections` bug.
- H8: Pending local writes need an explicit flush/settle contract before terminal actions like complete trip.
- H9: Local uniqueness should be deterministic or visibly reconciled; otherwise double taps and multi-tab usage remain fragile.
- M2: Soft-delete-aware projections should become the default for counts/summaries.
- M3: Optional filter parameters should either validate access or be absent; silent fallback should not be a pattern.
- M4: Sync endpoint query parsing should use DTO/schema validation, not ad hoc parsing.
- M5, M6, M11: RxDB query/subscription behavior should be made mobile-safe as a system property: no stale commits, no broad recomputes when avoidable, no aggressive offline polling.
- M7: SSE auth should have an explicit token lifecycle strategy.
- M8: Partial update semantics should consistently distinguish unchanged, set, and clear.
- M9: Screens should not mix REST fallback rendering with local-only mutation readiness without an explicit syncing state.
- M10: Completed-list rendering should use completed-domain values, not planning values.
- M12: API response parsing should tolerate valid HTTP success shapes.
- D2, D3, D5: Documentation drift should be handled by making canonical architecture docs current and marking older docs superseded.

### Opportunistic Cleanup

These are valid but should not displace stability work:

- L1: Wake lock should only apply to the active lock holder.
- L2: Canonical terminology would reduce future UI drift.
- L3: `{ success: true }` return shapes can be improved when touching endpoints, but are not a stability priority by themselves.

The practical implication: do not create 32 unrelated tickets. Group them into a few durable workstreams: sync contract hardening, aggregate invariant enforcement, local-first UX acceptance model, lifecycle/offline policy, and documentation canonicalization.

## UX Follow-Up Separation

Several findings identify places where the UI should surface sync gaps, pending states, conflicts, offline limits, or clearer domain language. That surfacing is valuable and needed, but it should not be implemented as isolated alerts or copy changes directly from this audit. The product needs a short UX refinement phase first so the direction is coherent, mobile-first, and grounded in how households actually plan and shop.

The audit should therefore split remediation into two follow-up tracks:

### Non-UX Stability Track

These can proceed without waiting for UX direction because they enforce correctness, data safety, or architecture contracts below the presentation layer:

- C1: Separate local eviction from replicated domain deletion.
- C2: Make replication ordering server-authored.
- C3: Validate sync updates/deletes against canonical aggregate parents.
- H1: Prevent cross-store `ListItem` links.
- H2: Prevent cross-store/deleted-section item assignments.
- H3: Define and enforce catalog item delete semantics.
- H4: Tie invitation lifecycle to household lifecycle.
- H5: Reject or conflict unsupported server-authoritative pushes.
- H11: Make shopping lock acquisition atomic.
- H12: Enforce active-list-per-store semantics at the server boundary, once the product decision is confirmed.
- M1: Make membership removal converge without relying only on ephemeral SSE.
- M2: Make summary counts soft-delete-aware.
- M3: Remove silent fallback for inaccessible household filters.
- M4: Validate sync endpoint query parameters.
- M5: Prevent stale async RxDB query commits.
- M6: Make fallback resync mobile/offline safe.
- M7: Define SSE token lifecycle and reduce token exposure.
- M12: Parse valid empty HTTP success responses.
- D2, D3, D5: Correct stale technical documentation.

### UX Refinement Track

These affect user mental models or interaction design and should be grouped into a dedicated pass before implementation:

- H6: Section mutation freshness. The technical bug is simple, but the broader question is how quickly configuration changes should appear and whether users need visible syncing affordances.
- H7: Local-first optimistic writes and server rejection. This needs a coherent pending/accepted/rejected interaction model, not one-off toasts.
- H8: Quantity edit debounce versus trip completion. The fix affects shopping flow, confidence, and terminal action design.
- H9: Duplicate add-item reconciliation. The user-facing behavior for double taps, duplicate usuals, and concurrent household edits needs product language.
- H10: Offline boundary for list lifecycle. The app must decide whether start/cancel/complete are offline-capable or clearly online-only.
- M8: Clear section/default unit semantics. This affects form behavior and the meaning of “Uncategorized” or blank units.
- M9: REST fallback while local DB is not ready. This needs a loading/syncing state that does not feel broken on mobile.
- M10: Completed-list quantity display. This is a product decision about whether history shows planned, purchased, or both.
- M11: Broad subscriptions/full reads. The remediation is technical, but prioritization depends on which views must feel instant on mobile.
- M13: Lifecycle timestamps. Trip history UX should determine whether `startedAt`/`completedAt` are first-class fields.
- D1, D4: Local-first scope and shopping collaboration docs. UX/product language must align with the architecture: observer-only shopping versus multi-shopper collaboration.
- L1: Wake-lock behavior for observers. This should be decided as part of shopping-mode UX.
- L2: Planning/shopping terminology. This needs a small vocabulary pass across routes, cards, list detail, and completion flows.
- L3: Mutation return shapes only matter to UX if immediate canonical data improves feedback.

Recommended follow-up for the UX track:

- Run a refinement pass around the end-to-end household shopping journey: create list, plan items, enter shopping mode, shop with possible offline/conflict states, complete trip, review history.
- Define user-facing states for local-first writes: local pending, synced, rejected, offline queued, locked by another shopper, and sync recovering.
- Decide whether the product promises offline completion or only offline item editing.
- Decide whether collaboration in shopping mode is observer-only or eventually multi-writer.
- Only then implement UX surfacing so the app does not accumulate inconsistent toasts, banners, badges, and copy.

## Severity Summary

- Critical: 3
- High: 12
- Medium: 14
- Low: 3

## Critical Findings

### C1. Local Cache Cleanup Can Replicate Destructive Deletes To Shared Server Data

References:

- `apps/web/src/core/rxdb/database.ts:306`
- `apps/web/src/core/rxdb/database.ts:329`
- `apps/web/src/core/rxdb/database.ts:573-599`
- `apps/web/src/core/rxdb/household-cleanup.ts:12-17`
- `apps/web/src/features/households/hooks/useInvitations.ts:113-117`

`items` and `listItems` have push replication enabled, but `removeHouseholdSubtreeFromLocalDb()` calls `doc.remove()` for those collections when a user leaves a household. In RxDB, `remove()` creates replicated tombstones for push-enabled collections. That means a local ACL/cache eviction can become a server-side item/list-item delete that affects the remaining household.

This violates the core local-first ownership model: leaving a household should remove local visibility, not mutate shared shopping data.

Robust remediation:

- Introduce an explicit distinction between **domain deletion** and **local eviction** in the local data layer. A developer should not be able to accidentally use a replicated delete API for access-control cleanup.
- Replace household leave/removal cleanup with a non-replicating strategy by construction. The safest mature option is to reset or recreate the local RxDB database after membership changes, then rehydrate from server-authoritative access. This is heavier than selective deletion, but it aligns with the security boundary and avoids relying on undocumented RxDB internals.
- If selective eviction is retained for UX/performance, put it behind a clearly named local-only adapter such as `evictHouseholdFromLocalCache()`, backed by tests proving that no push rows are emitted for `items` or `listItems`.
- Add a server-side defense as a second line: tombstone pushes for `items` and `listItems` must verify current membership and canonical parent state before mutating. If the user lost access or the parent was deleted, the server should return a tombstone conflict for local convergence, not apply a business delete.
- Add regression coverage for member leave, owner household delete, missed SSE, offline queued writes, and app restart after membership removal.

### C2. Sync Push Persists Client-Controlled `updatedAt`, Breaking Checkpoint Correctness

References:

- `apps/server/src/sync/collections/item-sync.ts:86-103`
- `apps/server/src/sync/collections/item-sync.ts:106-149`
- `apps/server/src/sync/collections/list-item-sync.ts:121-140`
- `apps/server/src/sync/collections/list-item-sync.ts:143-199`
- `apps/server/src/sync/sync.types.ts:14`

Push handlers store `newDocumentState.updatedAt` directly. A stale, backdated, future-dated, or malicious client timestamp can corrupt pull pagination. Backdating can make other clients with newer checkpoints never see the write. Future dating can advance checkpoints beyond later server changes.

For a local-first app, this is an architectural invariant: clients can originate data, but server replication checkpoints must be server-clock ordered.

Robust remediation:

- Make `updatedAt` a server-owned replication field everywhere it participates in checkpoints. Client payloads may carry user-authored content, but not authoritative replication order.
- Treat client timestamps, if needed at all, as separate metadata such as `clientEditedAt`; never use them for pull checkpoints, conflict ordering, or `@updatedAt` replacement.
- Update sync push handlers so accepted writes use database/server time, preferably inside the same transaction that validates access and aggregate membership.
- Define the conflict contract explicitly: `assumedMasterState.updatedAt` compares against the server-authored value; after accepted writes, the client converges by pulling the canonical server row.
- Add clock-skew tests with backdated and future-dated client payloads. These tests should prove that other clients still receive writes in checkpoint order and that future-dated client clocks cannot advance checkpoints past later server writes.
- Consider a future `revision` or monotonic server sequence if timestamp precision or SQLite ordering becomes a scaling concern. Do not introduce it preemptively unless timestamp tests expose instability.

### C3. Sync Push Can Mutate Rows Outside The Claimed Parent

References:

- `apps/server/src/sync/collections/item-sync.ts:49-67`
- `apps/server/src/sync/collections/item-sync.ts:78-104`
- `apps/server/src/sync/collections/list-item-sync.ts:56-65`
- `apps/server/src/sync/collections/list-item-sync.ts:102-141`

The sync handlers verify access using parent identifiers from the pushed document (`storeId` or `listId`), then update or delete by row `id`. If `current` already exists, the code does not prove that the existing row's real parent matches the pushed parent. A bad client can provide an accessible parent but target an existing row from a different store/list.

This is a DDD aggregate-boundary violation: immutable parent identity is part of the aggregate relationship and must not be trusted from the command payload.

Robust remediation:

- Define immutable aggregate ownership for replicated documents: an existing `Item` cannot move stores through sync push; an existing `ListItem` cannot move lists or point to a different catalog item through sync push.
- For every update/delete, load the current row and validate authorization against the row's canonical stored parent, not the pushed parent fields.
- Reject or conflict any pushed document whose claimed parent identifiers differ from the current row's stored identifiers. Treat parent changes as separate explicit domain commands if they are ever needed.
- For `ListItem`, validate the full aggregate relationship in one place: list exists, list is active, item exists, item is active, and item.storeId equals list.storeId.
- Move these checks into a small sync/domain invariant module used by both REST and sync paths. This is not a repository abstraction; it is invariant enforcement for aggregate membership.
- Add adversarial sync tests where the payload claims an accessible parent but the row ID belongs to another store/list. The expected result is no mutation of the foreign row and a deterministic conflict/tombstone response.

## High Findings

### H1. `ListItem` Sync Can Link Items Across Stores

References:

- `apps/server/src/sync/collections/list-item-sync.ts:56-65`
- `apps/server/src/sync/collections/list-item-sync.ts:152-199`
- `apps/server/prisma/schema.prisma:127-132`

`ListItem` has separate FKs to `List` and `Item`, but the schema cannot enforce that the list and item belong to the same store. The sync handler validates the list, but does not validate that `itemId` belongs to `list.storeId` and is not deleted.

Robust remediation:

- Before create/restore/update, fetch the item with `id`, `deleted: false`, and `storeId: list.storeId`.
- Reject or conflict if it does not match.
- Put this in a shared domain invariant module because REST add-item and sync add-item both need the same invariant.

### H2. `sectionId` Can Point To Deleted Or Cross-Store Sections

References:

- `apps/server/src/items/items.service.ts:22-43`
- `apps/server/src/lists/lists.service.ts:195-216`
- `apps/server/src/sync/collections/item-sync.ts:94-103`
- `apps/server/src/sync/collections/item-sync.ts:116-149`
- `apps/server/prisma/schema.prisma:83-84`

The database only proves that a section exists. It does not prove that the section belongs to the item's store or is active. REST and sync writes can assign an item to a section from another store or a soft-deleted section.

Robust remediation:

- Add a single `assertSectionBelongsToStore(sectionId, storeId)` domain helper.
- Call it from REST item update, REST add-item, and item sync push.
- Allow `null` intentionally for uncategorized items.

### H3. Item Sync Delete Leaves Active List Items Pointing At Deleted Catalog Items

References:

- `apps/server/src/sync/collections/item-sync.ts:78-83`
- `apps/server/src/lists/lists.service.ts:114-119`
- `apps/server/prisma/schema.prisma:127-132`

An item `_deleted` push marks the catalog item deleted but does not cascade or reject if active list items reference it. REST list detail includes `item: true` without filtering deleted items, so active lists can continue showing deleted catalog rows.

Robust remediation:

- Simplest: reject item `_deleted` pushes until catalog deletion is a deliberate feature.
- If deletion is required, soft-delete dependent active `ListItem`s in the same transaction.

### H4. Deleted Households Can Still Be Joined Through Active Invitations

References:

- `apps/server/src/invitations/invitations.service.ts:59-112`
- `apps/server/src/invitations/invitations.service.ts:143-177`
- `apps/server/src/shared/cascade-soft-delete.ts:62-82`
- `apps/server/prisma/schema.prisma:188-199`

Household soft-delete does not revoke invitations, and invitation join/detail queries do not require `household.deleted: false`. An old active token can attach a user to a soft-deleted household.

Robust remediation:

- Revoke active invitations inside `cascadeSoftDeleteHousehold()` or immediately around it.
- Add `household.deleted: false` checks to invitation detail and join paths.

### H5. Server-Authoritative Sync Pushes Are Silently Accepted

References:

- `apps/server/src/sync/sync.service.ts:97-106`

For `section`, `list`, `store`, and `household`, push returns `[]`, which tells RxDB that all pushed rows were accepted. If a client accidentally writes one of those collections locally, the server drops it and the client may believe it has synced.

This is a dangerous convenience. The code is simpler locally, but it hides ownership bugs.

Robust remediation:

- Reject unsupported pushes with a clear 400/409, or return master-state conflicts/tombstones so clients roll back.
- Keep the server-authoritative boundary explicit.

### H6. Section Mutations Resync The Wrong Collection

References:

- `apps/web/src/features/stores/hooks/useSections.ts:22`
- `apps/web/src/features/stores/hooks/useSections.ts:80-121`

Section create/update/delete/reorder call `resyncStores()` instead of `resyncSections()`. The UI can remain stale until SSE or fallback polling catches up.

Robust remediation:

- Import and call `resyncSections()` for section mutations.
- Only resync stores when store metadata changes.

### H7. Local-First Mutations Report Success Before Server Acceptance Is Observable

References:

- `apps/web/src/core/lib/useRxMutation.ts:82-99`
- `apps/web/src/core/rxdb/database.ts:446-453`
- `apps/web/src/features/lists/components/ListEditor.tsx:85-87`

`useRxMutation` reports success after local RxDB writes. Push conflicts and server rejections are only visible inside replication, and are not surfaced to users. With stale lock state, a user can locally mutate a locked shopping list and only later converge away from their own change.

This is a UX/domain consistency issue more than a code-style issue. Local-first does not mean every local write is business-accepted.

Robust remediation:

- Add centralized push conflict/error reporting for `items` and `listItems`.
- Show a toast or locked-state refresh when the server rejects a local write.
- Keep the existing optimistic local UX, but make conflict reconciliation visible.

### H8. Debounced Quantity Edits Can Race With Completing A Trip

References:

- `apps/web/src/features/lists/components/ListItemRow.tsx:97-123`
- `apps/web/src/features/lists/components/ListEditor.tsx:294-307`

Quantity changes flush after 300ms or on row unmount. Opening the summary and completing the trip does not unmount rows, so the last quantity change can be missing when the server completes the list and increments item stats.

Robust remediation:

- Expose a flush-pending-writes mechanism and call it before opening summary and before completion.
- Alternatively, avoid debounce for shopping-mode purchased quantity, where correctness matters more than request reduction.

### H9. Add-Item Has No Deterministic Local Uniqueness

References:

- `apps/web/src/core/rxdb/schema.ts:112-113`
- `apps/web/src/core/rxdb/schema.ts:178-179`
- `apps/web/src/features/lists/hooks/useAddItem.ts:50-109`

`useAddItem()` does find-then-insert for `items` and `listItems` without a transaction and without local composite uniqueness for `(storeId, name)` or `(listId, itemId)`. Double taps, multiple tabs, and concurrent users can create duplicate local rows until server conflict resolution catches up.

Robust remediation:

- Use deterministic IDs for local-created rows where the domain identity is composite, such as normalized `storeId + name` for item creation and `listId + itemId` for list item creation.
- If deterministic IDs are too disruptive, add explicit duplicate-conflict UI handling after server reconciliation.

### H10. Offline Boundary Is Inconsistent For Core Shopping Lifecycle

References:

- `apps/web/src/core/rxdb/database.ts:191-196`
- `apps/web/src/features/lists/hooks/useLists.ts:11-22`
- `apps/web/src/features/lists/hooks/useLists.ts:86-125`

Item/list-item edits are local-first, but list creation and status transitions are REST-only. A shopper can edit items offline but cannot reliably start, cancel, or complete shopping offline.

This may be a valid product tradeoff, but it is not currently obvious in the UX or docs.

Robust remediation:

- Choose one explicit policy: make list lifecycle transitions queued/local-first, or mark them online-only in the UI.
- Do not leave lifecycle ownership implicit.

### H11. Shopping Lock Acquisition Has A Race

References:

- `apps/server/src/lists/lists.service.ts:391-412`

Two users can read a `PLANNING` list concurrently and both update it to `SHOPPING`; the last write wins while both callers may see success.

Robust remediation:

- Use conditional `updateMany({ where: { id, status: 'PLANNING', deleted: false }, data: ... })`.
- Require `count === 1`; otherwise return a conflict and force refresh.

### H12. Active-List-Per-Store Is Not Enforced Strongly Enough

References:

- `apps/server/src/lists/lists.service.ts:47-65`
- `apps/web/src/features/stores/hooks/useStoreDirectory.ts:33-39`
- `apps/web/src/features/lists/components/StoreLists.tsx:24-38`

The server checks for an existing non-completed list before creating a new one, but the schema does not enforce one active list per store, and the check/create flow is not atomic. The frontend assumes the invariant differently in different places: store cards pick one active list, store detail can show several.

Robust remediation:

- Enforce the invariant server-side with an atomic transaction/conditional create strategy.
- If multiple active lists are allowed, represent that consistently in all UI.

## Medium Findings

### M1. Member Removal Depends On Ephemeral SSE Instead Of Pullable Tombstones

References:

- `apps/server/src/households/households.service.ts:84-94`
- `apps/server/src/sync/collections/household-sync.ts:24-36`

After a user leaves, they are disconnected from the household. Future pulls can no longer return that household, including a tombstone, because access is gone. If `HOUSEHOLD_REMOVED` SSE is missed, stale local household data can remain indefinitely.

Robust remediation:

- Prefer resetting local DB after leave.
- Longer term, add durable membership-removal tombstones or membership history visible only to the removed user.

### M2. Deleted List Items Are Counted In Server Summaries

References:

- `apps/server/src/lists/lists.service.ts:75-82`
- `apps/server/src/household-overview/household-overview.service.ts:30-33`

`_count: { select: { items: true } }` counts all related list items, including soft-deleted rows. Counts can drift from visible list contents.

Robust remediation:

- Use filtered relation counts where available: `items: { where: { deleted: false } }`.
- If not supported cleanly, compute active counts in a small projection query.

### M3. Inaccessible Household Requests Fall Back To Another Household

References:

- `apps/server/src/stores/stores.service.ts:16-32`

If a caller passes an inaccessible or nonexistent `householdId`, the service silently returns stores from the user's first accessible household. That hides authorization bugs and can display the wrong household's stores.

Robust remediation:

- If `householdId` is provided, call `verifyHouseholdAccess()` and fail on denial.
- Only default to the first household when no ID is provided.

### M4. Sync `batchSize` Is Not Validated

References:

- `apps/server/src/sync/sync.controller.ts:35-47`
- `apps/server/src/sync/sync.service.ts:49-57`

`parseInt()` can yield `NaN`, zero, or negative numbers. Those values flow into Prisma `take` and can cause errors or surprising pagination.

Robust remediation:

- Add a small parse helper: finite integer, min 1, max 500, otherwise default or 400.

### M5. `useRxQuery` Can Commit Stale Async Results Out Of Order

References:

- `apps/web/src/core/lib/useRxQuery.ts:116-148`

SSE, local writes, subscriptions, and periodic pulls can trigger overlapping `compute()` calls. A slower old computation can overwrite newer data, creating flicker or stale UI.

Robust remediation:

- Add a monotonically increasing request version inside `triggerUpdate()`.
- Only commit the latest request's result.

### M6. Periodic Resync Is Too Aggressive For Mobile/Offline Conditions

References:

- `apps/web/src/core/rxdb/database.ts:204-208`
- `apps/web/src/core/rxdb/database.ts:501-504`
- `apps/web/src/core/rxdb/database.ts:555-569`

When SSE is down, all replicated collections resync every five seconds. On mobile and offline networks, this is battery-expensive and can create noisy failed requests.

Robust remediation:

- Pause fallback pulls when `navigator.onLine === false`.
- Use exponential backoff.
- Prefer visibility-based resync over hidden-tab polling.

### M7. SSE Auth Has Token-In-URL And Weak Refresh Semantics

References:

- `apps/web/src/core/rxdb/database.ts:513-520`
- `apps/web/src/core/rxdb/database.ts:555-568`

EventSource requires query-param auth here, which can leak tokens through logs. Reconnect also calls `openSharedSyncStream(url)` without force-refresh, so expired-token loops are possible depending on OIDC cache behavior.

Robust remediation:

- Force-refresh token on SSE reconnect after auth errors.
- Prefer an EventSource replacement that supports `Authorization` headers, or issue short-lived SSE-specific tokens.

### M8. Edit Item Cannot Clear Section Or Default Unit Reliably

References:

- `apps/web/src/features/lists/components/EditItemDialog.tsx:53-59`
- `apps/web/src/features/lists/hooks/useItems.ts:18-22`
- `apps/server/src/items/items.service.ts:38-42`

The UI appears to allow clearing section/default unit, but undefined fields are omitted or converted inconsistently. The old value can remain.

Robust remediation:

- Model clearing explicitly with `null` in DTOs and client hooks.
- Keep `undefined` meaning “unchanged” only if partial update semantics are intended.

### M9. List Detail REST Fallback Can Render A Screen That Local Mutations Cannot Use

References:

- `apps/web/src/features/lists/hooks/useListQueries.ts:102-108`
- `apps/web/src/features/lists/hooks/useAddItem.ts:44-48`

`useListDetail()` can fall back to REST if the local list is missing, but `useAddItem()` fails if the list is not in RxDB. The user can see a usable-looking screen where local-first actions fail.

Robust remediation:

- If rendering REST fallback, disable local mutations and show “syncing” until local data arrives.
- Or remove the fallback and make local sync readiness explicit.

### M10. Completed List Read-Only Quantity Loses Purchased Quantity Semantics

References:

- `apps/web/src/features/lists/components/ListItemRow.tsx:78-80`
- `apps/web/src/features/lists/components/ListItemRow.tsx:150-153`

Shopping mode distinguishes planned quantity from purchased quantity, but completed/read-only rows display planned `quantity`, not `purchasedQuantity ?? quantity`. Completed history can misrepresent what was actually bought.

Robust remediation:

- In read-only/completed mode, display `purchasedQuantity ?? quantity`.
- Optionally show planned quantity as secondary context when it differs.

### M11. Broad RxDB Subscriptions And Full-Collection Reads Will Scale Poorly

References:

- `apps/web/src/features/lists/hooks/useListQueries.ts:181-182`
- `apps/web/src/features/lists/hooks/useDashboard.ts:32-37`
- `apps/web/src/features/stores/hooks/useStoreDirectory.ts:27-31`

Several hooks subscribe to or read entire collections, causing unrelated changes to recompute active views. This matters on mobile, where local data and battery are constrained.

Robust remediation:

- Filter subscriptions by `storeId`, `listId`, or household where possible.
- Extract shared projection helpers only where it reduces repeated full-collection scans without hiding domain logic.

### M12. API Client Assumes Successful Responses Always Have JSON

References:

- `apps/web/src/core/lib/api.ts:76-86`
- `apps/web/src/core/lib/api.ts:113-115`

Successful `204 No Content` responses will throw during `res.json()`, causing false client failures after server success.

Robust remediation:

- Handle `204`, empty `content-length`, or non-JSON content before parsing.
- Return `undefined` for empty successful responses.

### M13. Lifecycle Timestamps Are Missing For A Completed-Shopping Domain

References:

- `apps/server/prisma/schema.prisma:102-112`
- `apps/server/src/lists/lists.service.ts:365-384`
- `wiki/architecture/domain-model.md:67-75`
- `planning/tickets/user-stories/US-09-shopping-lifecycle.md:22-23`

The docs describe `startedAt`/`completedAt`, but the schema only has `status`, `assignedTo`, and `updatedAt`. Using `updatedAt` as completion date conflates domain lifecycle with arbitrary metadata changes.

Robust remediation:

- Add explicit lifecycle timestamps if completed trip history matters.
- If not in scope, update docs and UI copy to avoid implying durable trip timing.

### M14. Duplicate REST And Sync Mutation Paths Need A Smaller Shared Invariant Layer

References:

- `apps/server/src/lists/lists.service.ts:133-238`
- `apps/server/src/sync/collections/item-sync.ts:39-167`
- `apps/server/src/sync/collections/list-item-sync.ts:45-221`

The code has two write paths for item/list-item creation and updates: REST service logic and sync push logic. They are not identical, and each must remember section validation, item/list store matching, soft-delete restore, duplicate handling, shopping lock, timestamps, and notification behavior.

This is not a call for a repository pattern. Prisma can stay direct. The missing “part” is a very small domain command/invariant function, not a generalized persistence abstraction.

Robust remediation:

- Extract only invariant checks and canonicalization helpers shared by REST and sync.
- Avoid a broad service layer that simply wraps Prisma.

## Low Findings

### L1. Wake Lock Is Enabled For Read-Only Viewers Of A Locked Shopping List

References:

- `apps/web/src/features/lists/components/ListEditor.tsx:80-88`

A household member watching a list they cannot edit still activates screen wake lock. On mobile this is surprising and battery-expensive.

Robust remediation:

- Use `useScreenWakeLock(isShoppingMode && isLockHolder)`.

### L2. Planning/Shopping Terminology Is Inconsistent

References:

- `apps/web/src/routes/lists.tsx:33-35`
- `apps/web/src/features/lists/components/StoreLists.tsx:36-45`
- `apps/web/src/features/stores/components/StoreDirectory/StoreCard.tsx:98-105`
- `apps/web/src/features/lists/components/ListEditor.tsx:450-467`

The same concept appears as “Lists”, “Active Runs”, “trip”, “shopping list”, “planning”, and “Go Shopping”. This makes the dual-mode model harder to reason about and increases copy/logic drift.

Robust remediation:

- Pick canonical user-facing terms for list entity and lifecycle states.
- A tiny `listStatusCopy` helper is enough; avoid a broad content system.

### L3. Some Server Methods Return `{ success: true }` Despite Coding Standards Preferring Entity Returns

References:

- `apps/server/src/households/households.service.ts:67`
- `apps/server/src/stores/stores.service.ts:86`
- `apps/server/src/sections/sections.service.ts:82`
- `apps/server/src/lists/lists.service.ts:282`

The standard says to prefer typed entity returns. `{ success: true }` is not harmful by itself, but it makes the client rely on follow-up resync for data it could receive directly.

Robust remediation:

- Leave this alone unless touching the endpoint.
- When changing a mutation, return the canonical updated entity only if the client benefits immediately.

## Documentation And Architecture Drift

### D1. Local-First Write Scope Is Contradictory

References:

- `wiki/adr/007-phase4-local-first-strategy.md:109-125`
- `planning/tickets/PHASE-5-SIMPLIFICATION.md:63-91`
- `apps/web/src/core/rxdb/database.ts:298-329`
- `apps/server/src/sync/collections/list-sync.ts:1-6`
- `apps/web/src/features/lists/hooks/useLists.ts:11-18`

ADR 007 says stores, sections, lists, items, and list-items are local-first. Current code only pushes `item` and `listItem`; list lifecycle is REST-only.

Robust remediation:

- Amend/supersede ADR 007: RxDB pull caches six collections; local-first push is currently limited to `item` and `listItem` active-shopping writes.

### D2. `assignedTo` Identity Is Documented Inconsistently

References:

- `wiki/rules/coding-standards.md:228-230`
- `planning/tickets/PROJECT-STATUS.md:222-228`
- `apps/server/src/lists/lists.controller.ts:83-99`
- `apps/server/src/lists/lists.service.ts:409-412`
- `apps/web/src/features/lists/components/ListEditor.tsx:81-86`

Current code stores and compares Google OIDC `sub`. `PROJECT-STATUS.md` says a prior identity fix uses DB `userId`, which is stale.

Robust remediation:

- Decide the canonical identity and update docs.
- Current code is internally aligned on OIDC `sub`.

### D3. RxDB `assignedTo` Length Looks Like CUID, Not OIDC Subject

References:

- `apps/web/src/core/rxdb/schema.ts:120-140`

`assignedTo` has `maxLength: 30`. If it stores provider `sub`, this may be too narrow depending on the OIDC provider.

Robust remediation:

- Relax the schema length for `assignedTo`, or document the provider-sub length guarantee.

### D4. Collaboration Docs Contradict Shopping Lock Behavior

References:

- `wiki/architecture/domain-model.md:137-144`
- `wiki/adr/007-phase4-local-first-strategy.md:69-72`
- `wiki/adr/007-phase4-local-first-strategy.md:90-92`
- `apps/server/src/shared/shopping-lock.ts:9-25`
- `apps/server/src/sync/collections/list-item-sync.ts:84-99`

Some docs say another household member can check off items while User A shops. Current architecture only allows observation by non-lock-holders.

Robust remediation:

- Make shopping collaboration semantics canonical in one domain document: non-lock-holders can watch live updates but cannot mutate a `SHOPPING` list.
- Link the shopping-lock rule from user stories, architecture docs, and coding standards so future UI or sync changes do not revive split-aisle multi-writer assumptions accidentally.

### D5. Framework And Package Docs Are Stale

References:

- `planning/tickets/PROJECT-STATUS.md:52-62`
- `apps/web/package.json:5-15`
- `apps/web/package.json:35-48`
- `package.json:3-5`
- `package.json:24-29`
- `wiki/development/devops-philosophy.md:82-120`
- `planning/archive/e2e-testing-2026-01/e2e-testing-setup.md:237-287`

Docs still reference Next.js/NextAuth/PostgreSQL-era assumptions in places, while current code is Vite + TanStack Router + oidc-spa 10 + Prisma 7.5 + SQLite.

Robust remediation:

- Update current-status docs.
- Mark old Next.js/NextAuth docs historical if they are not worth maintaining.

## DDD And Aggregate Observations

The aggregate boundaries are mostly understandable:

- `Household` owns membership and contains stores.
- `Store` owns layout sections, catalog items, and shopping lists.
- `List` owns list items and lifecycle state.
- `Item` is a store-scoped catalog entry reused by list items.

The most fragile aggregate boundaries are the cross-store relationships that the schema cannot enforce by itself:

- `Item.sectionId` must belong to the same store.
- `ListItem.itemId` must belong to the same store as `List.storeId`.
- `ListItem.listId + itemId` uniqueness must remain active-row scoped.
- `List.status + assignedTo` must change atomically when entering shopping mode.

These are not places for broad abstraction. They are places for explicit invariant enforcement at write boundaries. A mature, maintainable direction would be a small shared domain-invariant layer with comprehensive tests, not repositories or generic domain services.

## Simplicity And Maintainability Assessment

What is appropriately simple:

- Prisma is used directly in services; no repository layer is needed.
- Server-authoritative collections are kept mostly REST-only.
- RxDB schemas are explicit and easy to inspect.
- The explicit per-collection replication setup is verbose but understandable, and project rules already document why a factory was avoided.

What is too complex or ambiguous:

- `database.ts` combines database construction, replication, SSE, diagnostics, retry behavior, periodic polling, and cache eviction in one large module. Splitting by responsibility could help, but only if it clarifies ownership. A generic replication factory is not the answer if it reintroduces request storms.
- The local-first boundary is too implicit. The app has six replicated collections, but only two push. That is fine, but every unsupported push must fail loudly.
- Add-item and list-item mutation behavior exists across REST, RxDB local hooks, and sync handlers. This is the highest-maintenance area because it crosses domain, offline, and sync concerns.
- Documentation drift is now a real risk because contributors can read mutually incompatible rules about local-first scope and shopping collaboration.

## Recommended Remediation Roadmap

1. Sync contract hardening.
   Define the sync protocol contract in code and docs: server-owned replication timestamps, unsupported push behavior, accepted/conflict/tombstone semantics, and membership-loss behavior. This workstream covers C1, C2, H5, H7, M1, M4, M7, and D1.

2. Aggregate invariant enforcement.
   Build a small invariant layer for relationships the database cannot fully express: item-store, section-store, list-item-store, immutable parent ownership, soft-delete visibility, and active-list-per-store semantics. This workstream covers C3, H1, H2, H3, H11, H12, and M14.

3. Local-first UX acceptance model.
   Make optimistic local writes visibly pending until server acceptance is known, and visibly rejected when server invariants reject them. Add deterministic local identity or explicit reconciliation for duplicated local writes. This workstream covers H7, H8, H9, M5, M9, and M10.

4. Offline and lifecycle policy.
   Decide whether list creation/start/cancel/complete are local-first queued commands or online-only server commands. Add lifecycle timestamps if completed trips are a product concept, and make shopping collaboration semantics canonical. This workstream covers H10, M13, and D4.

5. Mobile-safe data projection and sync behavior.
   Reduce broad local recomputes, avoid aggressive offline polling, and make soft-delete-aware projections the default for user-visible counts. This workstream covers M2, M5, M6, and M11.

6. Documentation canonicalization.
   Update or supersede stale framework, identity, local-first, and collaboration docs. Make one source canonical for architecture and one source canonical for domain lifecycle semantics. This workstream covers D2, D3, D5, and the documentation side of D1/D4.

7. Opportunistic cleanup.
   Address wake-lock scope, terminology consistency, API empty-response parsing, invitation lifecycle tie-off, and return-shape cleanup as part of related feature or hardening work. These are worthwhile, but should not interrupt sync and invariant hardening.

## Verification Required For Remediation

- Sync push cannot update/delete an item by `id` when payload `storeId` belongs to another accessible store.
- Sync push cannot create a `ListItem` whose item belongs to another store.
- Item update/add rejects cross-store or deleted section IDs.
- Leaving a household does not produce server-side item/list-item tombstones.
- Unsupported pushes for `section`, `list`, `store`, `household` produce rollback/conflict behavior.
- Concurrent `startShopping` calls allow only one lock holder.
- Completing a trip after a recent quantity edit persists the final purchased quantity.
- Missed `HOUSEHOLD_REMOVED` or post-leave reload does not retain stale household data locally.
- Backdated and future-dated client `updatedAt` values cannot cause skipped pulls or checkpoint jumps.
- Server summaries and dashboard counts exclude soft-deleted list items.
- Local-first rejected writes are visible to the user and converge without silent data loss.
- Offline/SSE-down mobile sessions back off instead of polling all collections every five seconds indefinitely.
- Documentation tests are not needed, but architecture docs must be reviewed in the same PR as any local-first boundary change.
