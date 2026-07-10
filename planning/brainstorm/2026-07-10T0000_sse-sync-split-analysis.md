# Brainstorm: SSE Sync Collection Split Analysis

**Date:** 2026-07-10T0000
**Status:** analysis complete, awaiting user comments
**Source:** Oracle pre-implementation review for GROCERUN-32 (notification data model)
**Trigger:** Architectural question — is the current 6-collection sync split optimal, or should collections be consolidated?

---

## Oracle Report (Verbatim)

### Current Split Assessment

**The collection split is architecturally correct. The transport layer is not.**

#### What works

The 6-collection split correctly aligns with two orthogonal axes: **access scope** and **lifecycle/mutation pattern**.

| Collection | Access scope | Lifecycle | Push? |
|-----------|-------------|-----------|-------|
| `household` | `userId → householdIds` (direct membership) | Rare admin changes | No |
| `store` | `userId → householdIds → stores` | Rare admin changes | No |
| `section` | `userId → householdIds → stores → sections` | Rare + bulk reorder | No |
| `list` | `userId → householdIds → stores → lists` | State machine (PLANNING→SHOPPING→COMPLETED) | No |
| `item` | `userId → householdIds → stores → items` | High-frequency during shopping | **Yes** |
| `listItem` | `userId → householdIds → stores → lists → listItems` | Highest-frequency (toggle, qty) | **Yes** |

The local-first vs. server-authoritative split (ADR-007 Decision 3) is the right cut. Items and listItems are the only collections where offline writes matter during shopping. Everything else is configuration/admin data that goes through REST. Merging a push-enabled collection with a pull-only one would be architecturally incoherent.

#### What doesn't work (but it's not the split's fault)

**1. SSE routing is not actually collection-scoped — despite the protocol doc claiming it is.**

The protocol doc (`rxdb-sync-protocol.md:397-398`) states:
> SSE fan-out is collection-scoped: The `SYNC_CHANGED` event includes a `collections` array. The client only emits `'RESYNC'` into the pull Subjects for the affected collections.

But the actual code (`database.ts:622-628`) does **not** parse the `collections` array:

```typescript
src.addEventListener('SYNC_CHANGED', () => {  // ← no event param used
    resetWatchdog()
    for (const subject of sharedPullStreams) {  // ← Set, not Map
      subject.next(RESYNC_SIGNAL)              // ← broadcasts to ALL 6 streams
    }
})
```

`sharedPullStreams` is a `Set<Subject>` — there's no way to route to a specific collection. The server already sends `{ collections: ['store'] }` in the payload, but the client throws it away. This is the root cause of the overfetch problem documented in `sync-overfetch-analyze.md`: a single listItem toggle generates 1 push + 6 pulls = 7 requests, when it should be 1 push + 1 pull.

**2. Access query redundancy is real but minor.**

Five collections (`store`, `section`, `list`, `item`, `listItem`) each call `getAccessibleStoreIdsForSync(userId)` on every pull batch. That's 5 Prisma queries doing the same household→store join. But with batch sizes of 50-100, the access query is ~1% of the pull cost. Not worth consolidating collections to fix — a simple per-request memo cache on `SyncDeps` would eliminate it without touching the collection structure.

**3. Initial load makes 6 sequential HTTP requests.**

On `resyncAll()`, all 6 pull streams emit `RESYNC` simultaneously. RxDB fires 6 parallel HTTP requests. This is 6 round-trips on cold start. For a household with 3 stores × 10 sections × 50 items × 5 lists × 20 listItems, this is 6 requests totaling maybe 200KB. Not great, but not a real bottleneck — it happens once per session and resolves in parallel.

#### What the split does NOT cause

- **Checkpoint independence is a feature, not a bug.** A section reorder (`reorderSections`) advances only the section checkpoint. Stores, items, and lists are untouched. If sections were nested in stores, a reorder would advance the store checkpoint, forcing clients to re-pull store documents that didn't change.
- **Tombstone isolation is a feature.** A deleted section's tombstone is delivered through the section pull only. It doesn't pollute the store pull response.
- **SSE granularity is a feature.** The server can say "only `section` changed" and (once routing is fixed) only sections get re-pulled. Nesting would force coarser notifications.

---

### Consolidation Options

#### Option A: Fold sections into stores (nested pull, separate RxDB collections)

**What**: `GET /sync/store/pull` returns store documents with embedded `sections[]`. Client pull handler writes stores to `stores` collection and sections to `sections` collection.

**Trade-offs:**
- **Pro**: Eliminates 1 HTTP round-trip on initial load and on store/section changes (5 collections → 4).
- **Pro**: Section access is implicitly derived from store access — no separate `getAccessibleStoreIdsForSync` call for sections.
- **Con**: Breaks RxDB's `replicateRxCollection` model. The store pull handler would need to write to two collections, which is not how `replicateRxCollection` works. You'd need a custom replication wrapper or a "virtual" store collection that fans out to sections.
- **Con**: Checkpoint coupling. A section reorder advances the store checkpoint. Next pull returns the store (unchanged) + all sections. The store payload is wasted bandwidth.
- **Con**: SSE routing becomes ambiguous. When a section changes, do you send `['store']` (which includes sections) or `['section']`? If `['store']`, then section-only changes trigger store re-pulls for any client not using the nested endpoint.
- **Con**: Tombstone delivery for sections must go through the store pull. A deleted section's tombstone is embedded in the store response, which means the client must diff the sections array to find tombstones — losing RxDB's native tombstone handling.
- **Effort**: High. Custom replication logic, checkpoint redesign, SSE routing changes, tombstone handling rewrite.

**Verdict**: Not worth it. The benefit (1 fewer round-trip) is dwarfed by the complexity of breaking RxDB's per-collection replication model.

#### Option B: Fold stores into households

**What**: `GET /sync/household/pull` returns household documents with embedded `stores[]` (and potentially their sections).

**Trade-offs:**
- **Pro**: Eliminates 2 round-trips on initial load (4 collections → 2).
- **Con**: Massive over-fetching. A household with 5 stores, each with 20 sections, produces a huge document. Any store change re-pulls the entire household payload.
- **Con**: Checkpoint coupling at the highest level. Any store or section change advances the household checkpoint, forcing all household members to re-pull the entire household tree.
- **Con**: The user explicitly flagged this as the over-anchoring extreme.
- **Con**: Household mutations (member join/leave, ownership transfer) would advance the checkpoint and force re-pulling all stores.
- **Effort**: High, and wrong direction.

**Verdict**: Rejected. This is the over-anchoring extreme the user correctly wants to avoid.

#### Option C: Bundle pull endpoints (multi-collection pull)

**What**: Server exposes `GET /sync/pull?collections=store,section&updatedAt=...&id=...` that returns results for multiple collections in one response. Client still has 6 RxDB collections with 6 replications, but the pull handler batches requests.

**Trade-offs:**
- **Pro**: Reduces HTTP round-trips from 6 to 1-2 on initial load and on SSE-triggered resyncs.
- **Pro**: Keeps RxDB's per-collection replication model intact (each collection still has its own checkpoint).
- **Con**: Major refactor of the pull handler. Each collection's `replicateRxCollection` pull handler would need to coordinate with others to batch requests. RxDB doesn't natively support merged-stream replication.
- **Con**: Checkpoint management becomes complex — the bundled endpoint needs to handle different checkpoints per collection and return per-collection checkpoints.
- **Con**: Error handling is coupled — if one collection's pull fails, do you fail the entire batch?
- **Effort**: High. This is the most invasive option.

**Verdict**: Evaluate for Phase 5+ if round-trip count becomes a measured bottleneck. Not justified now — the real problem is SSE routing, not collection count.

#### Option D: Keep split, fix transport layer (recommended)

**What**: Keep 6 collections as-is. Fix the two transport-layer problems:
1. **Scope SSE routing**: Change `sharedPullStreams` from `Set<Subject>` to `Map<string, Subject>`. Parse `event.data.collections` in the `SYNC_CHANGED` handler and only emit `RESYNC` to matching streams.
2. **Skip self-notify**: Server excludes the originating user from `notifyChanged` for push-triggered SSE (their local state is already correct from the optimistic write).

**Trade-offs:**
- **Pro**: Minimal change, immediate impact. A listItem toggle goes from 1 push + 6 pulls = 7 requests to 1 push + 0 pulls (self) or 1 push + 1 pull (other clients).
- **Pro**: No collection structure changes, no checkpoint coupling, no RxDB abstraction breakage.
- **Pro**: The server already sends `{ collections: ['listItem'] }` — the client just needs to read it.
- **Con**: Doesn't reduce initial-load round-trips (still 6 parallel requests on cold start).
- **Con**: Still 6 independent replications with 6 checkpoints to manage.
- **Effort**: Low. ~50 lines of client code (Map instead of Set, parse event data). ~10 lines of server code (exclude pusher from notifyChanged).

**Verdict**: This is the clear winner. It addresses the actual measured problem (overfetch) without touching the collection architecture.

---

### Recommendation

**Keep the 6-collection split as-is. Add notification as a 7th collection. Fix the SSE routing.**

#### Reasoning

1. **The collection split is not the problem.** The split correctly separates entities by access scope and lifecycle. Sections have independent lifecycles from stores (bulk reorder is a distinct operation). Stores have independent lifecycles from households (store mutations don't cascade to household membership). Items and listItems are correctly split from each other (items are per-store metadata; listItems are per-list instances with shopping lock semantics).

2. **The actual problem is transport inefficiency.** The `sync-overfetch-analyze.md` ticket correctly identifies that a single listItem toggle generates 7 HTTP requests. But the root cause is the client ignoring the `collections` array in `SYNC_CHANGED` events, not the number of collections. Fixing SSE routing (Option D) reduces this to 1-2 requests with minimal code change.

3. **Consolidation would trade a minor, fixable inefficiency for permanent architectural complexity.** Folding sections into stores breaks RxDB's `replicateRxCollection` model, couples checkpoints between unrelated lifecycles, and complicates tombstone handling. The benefit (1 fewer round-trip) is negligible compared to the cost.

4. **The access query redundancy is fixable without consolidation.** A per-request memo cache on `SyncDeps.getAccessibleStoreIdsForSync` (keyed by `userId`) would eliminate the 5 redundant Prisma queries during a `resyncAll()` without touching collection structure.

5. **Initial-load round-trips are not a measured bottleneck.** 6 parallel HTTP requests on cold start, each returning 50-100 small JSON documents, resolves in a single RTT window. The steady-state cost (SSE-triggered resyncs) is far more impactful because it happens on every mutation.

#### Concrete action items (ordered by impact/effort ratio)

1. **Fix SSE routing** — Change `sharedPullStreams` from `Set<Subject>` to `Map<string, Subject>`. Parse `event.data.collections` in `SYNC_CHANGED` handler. Only emit `RESYNC` to matching streams. (~50 lines, `database.ts`)
2. **Skip self-notify on push** — Thread pusher's `userId` to `SseBroadcastService.notifyChanged` and exclude it. (~10 lines, `sync.service.ts` + `sse-broadcast.service.ts`)
3. **Memoize access queries** — Cache `getAccessibleStoreIdsForSync` / `getAccessibleHouseholdIdsForSync` per-request (or with a 5-second TTL) so 5 collections don't each make the same Prisma query. (~15 lines, `sync.service.ts`)
4. **Update the protocol doc** — The doc claims collection-scoped SSE routing, but the code doesn't implement it. Either implement it (step 1) or fix the doc. Currently the doc is misleading.

---

### Impact on Notification Collection

**The notification collection (GROCERUN-32) reinforces the principle that collections should be split by access scope, not by entity hierarchy.**

Notifications are **user-scoped**, not household-scoped:
- Access filter: `userId = currentUser` (not `householdId IN accessibleHouseholdIds`)
- Lifecycle: created by server on mutations, never pushed by client
- No relationship to the household→store→section/item/list→listItem hierarchy

This means:
1. **Notifications must be a separate collection.** They can't be folded into any household-scoped collection because their access scope is different. A user's notifications span multiple households.
2. **Notification SSE routing must be scoped.** When a notification is created, the SSE event should include `['notification']` in the collections array. Once SSE routing is fixed (action item 1 above), only the notification collection gets re-pulled — not all 7 collections.
3. **Notification pull should NOT call `getAccessibleStoreIdsForSync`.** Its access filter is `userId = currentUser`, which is a direct Prisma query on the Notification table. This is simpler and faster than the household-derived access checks.
4. **The notification collection is pull-only** (server-authoritative per ADR-007 criteria 2 and 3). This aligns with household/store/section/list, not with item/listItem.

**The notification collection does not change the analysis.** It's a natural 7th collection that follows the same pull-only pattern as the existing server-authoritative collections. The only design consideration is ensuring the SSE routing fix (action item 1) is in place before or alongside the notification collection, so that notification creation doesn't trigger re-pulls of all 6 existing collections.

#### One caveat for notifications

The `notification-data-model-analysis.md` proposes that `UserNotificationService.createForHousehold()` calls `sseBroadcast.notifyChanged(memberIds, { collections: ['notification'], reason: 'notification_created' })`. This is correct — but only if the client actually scopes the resync to `['notification']`. Without the SSE routing fix, creating a notification would trigger 7 pulls (6 existing + 1 notification), which is exactly the overfetch problem. **The SSE routing fix is a prerequisite for the notification collection to be efficient.**

---

## Orchestrator Addendum: Embedding Sections into Stores

### Oracle's "Breaks replicateRxCollection" Claim — Clarified

The oracle's claim that folding sections into stores "breaks RxDB's `replicateRxCollection` model" was about **one specific approach**: separate RxDB collections with a nested pull endpoint (store pull returns stores with embedded `sections[]`, pull handler writes to both `stores` and `sections` RxDB collections). That approach *does* break the model — `replicateRxCollection` expects one collection per replication stream, one checkpoint, one set of conflict resolution.

But there's a simpler approach the oracle didn't consider:

**Embed sections as an array on the store RxDB document.** No separate sections collection at all.

```
Store document = {
  id, name, householdId, updatedAt,
  sections: [{ id, name, sortOrder, deleted }]
}
```

This works naturally with `replicateRxCollection`:
- One collection, one checkpoint, one pull endpoint
- When a section changes, bump the store's `updatedAt` (cascade)
- Deleted sections: remove from the array (or mark `deleted: true` in the array)
- No dual-write, no broken abstraction

### Why They're Separate Now

Historical: each Prisma model got its own sync collection. The pattern was "one model = one sync collection = one RxDB collection = one checkpoint." No one evaluated whether store+section should be one collection — they followed the pattern. A store is thin (`id, name, householdId` + timestamps). Sections are the meaningful children. There's no structural reason they must be separate.

### Trade-offs of Embedding

| | Separate (current) | Embedded |
|---|---|---|
| Section reorder | Re-pulls only changed sections | Re-pulls entire store doc (all sections) |
| Checkpoint independence | Section checkpoint advances independently | Store checkpoint advances (sections are sub-docs) |
| Tombstone handling | Native RxDB per-section tombstones | Manual — remove from array or mark deleted |
| Payload size | Section pull returns only sections | Store pull returns store + all sections |
| Collection count | 6 | 5 |
| Complexity | Standard pattern | Need cascade timestamp update on section mutations |

For a store with 5-20 sections, the payload difference is negligible. The checkpoint coupling means a section reorder forces a re-pull of the store document too — but that's one tiny document.

### What Gets Simpler with Embedding

- One fewer sync collection (pull handler, sync doc converter, checkpoint, `startXReplication`/`resyncX` function)
- One fewer RxDB collection (schema, doc type, replication wiring)
- Section access is free — comes with store access, no separate `getAccessibleStoreIdsForSync` call
- One fewer SSE routing target
- Adding notification later makes 6 collections instead of 7

### What Gets More Complex

- Section mutations (create, reorder, rename, delete) must cascade-update the parent store's `updatedAt` — otherwise sync doesn't pick them up
- Sync doc converter must join sections into the store document (Prisma `include: { sections: true }`)
- Section "tombstones" are manual — remove from array or mark `deleted: true` in the array, not native RxDB tombstones
- Client queries change from `sectionsCollection.find()` to `storesCollection.findOne().sections`

The cascade timestamp update is the main new complexity: any section mutation does `prisma.store.update({ where: { id: storeId }, data: { updatedAt: new Date() } })` after the section change. One line per mutation site.

### Net Assessment

Fewer moving parts, fewer concepts, fewer endpoints — but slightly more work at each mutation site. For a system that's growing (notifications coming next, more features after), fewer collections is a structural simplification that compounds.

The refactor touches: sections service, sync layer, RxDB schema, and client reads. Non-trivial but cleaner to do before adding a 7th collection than after.

### Other Consolidation Opportunities to Explore

#### Systematic Fold Analysis

Constraints: **access scope** (must match), **push/pull** (must match), and **parent-child** (must nest naturally).

| Fold | Access scope match? | Push/pull match? | Parent-child? | Viable? |
|------|---------------------|-------------------|---------------|---------|
| Sections → Stores | ✓ (both household→store) | ✓ (both pull-only) | ✓ (section is child of store) | **Yes** |
| Stores → Households | ✓ (both household-scoped) | ✓ (both pull-only) | ✓ (store is child of household) | **Maybe** |
| Lists → Stores | ✓ (both household→store) | ✓ (both pull-only) | ✓ (list is child of store) | **Yes** |
| Items → Stores | ✓ | ✗ (items push, stores pull) | ✓ | **No** |
| ListItems → Lists | ✓ | ✗ (listItems push, lists pull) | ✓ | **No** |
| Items ↔ ListItems | ✓ (both push) | ✓ | ✗ (different parents, different fields) | **No** |
| Notifications → anything | ✗ (user-scoped) | — | — | **No** |

#### Fold 1: Sections → Stores (already analyzed above)

- **Collections:** 6 → 5
- **Payload:** Store doc includes all sections. For 5-20 sections per store, negligible.
- **Checkpoint coupling:** Section mutation bumps store `updatedAt`. Re-pulls store doc (thin + sections).
- **New complexity:** Cascade timestamp on section mutations. Manual section tombstones (array removal).
- **Simplification:** One fewer collection, sync handler, RxDB schema, replication function, SSE target.
- **Lifecycle cost:** Low — sections are admin-style mutations (create, reorder, rename). Coupling to store is cheap.

#### Fold 2: Lists → Stores

Store document: `{ id, name, householdId, updatedAt, sections: [...], lists: [{ id, name, state, ... }] }`

- **Collections:** 6 → 5 (or 4 if combined with Fold 1)
- **Payload:** Store doc now includes lists too. A store might have 5-20 lists. Still manageable.
- **Checkpoint coupling:** List state change (PLANNING→SHOPPING→COMPLETED) bumps store `updatedAt`. This means a shopping state transition forces re-pull of all sections and all other lists for that store.
- **New complexity:** Cascade timestamp on list mutations (create, complete, delete, rename). Manual list tombstones.
- **Lifecycle concern:** Lists are more dynamic than sections. A list state machine transition is a user-facing event that happens during active shopping. Coupling it to the store checkpoint means every list state change re-pulls the entire store document including all sections and all other lists. For a store with 20 lists and 20 sections, that's a bigger payload on every list interaction.
- **Simplification:** One fewer collection, sync handler, RxDB schema, replication function, SSE target.

#### Fold 3: Stores → Households

Household document: `{ id, name, ownerId, members, updatedAt, stores: [{ id, name, sections: [...], lists: [...] }] }`

- **Collections:** 6 → 3 (household absorbs stores, sections, lists; items and listItems remain)
- **Payload:** Household doc includes all stores, all sections, all lists. For 3 stores × 15 sections × 10 lists = ~450 sub-documents. Getting heavy.
- **Checkpoint coupling:** ANY store, section, or list mutation bumps household `updatedAt`. Full re-pull of the entire household tree. This is the over-anchoring extreme.
- **Member change impact:** Household membership change (member join/leave) bumps `updatedAt`, forcing all remaining members to re-pull all stores, sections, and lists — even though none of that data changed.
- **New complexity:** Cascade timestamp from section→store→household and list→store→household. Two levels of cascade.
- **Simplification:** Three fewer collections, sync handlers, RxDB schemas, replication functions, SSE targets.

#### Compound Options

| Option | Folds | Collections | Notable trade-off |
|--------|-------|-------------|-------------------|
| **A** | Sections → Stores | 5 | Section mutation re-pulls store (thin) |
| **B** | Lists → Stores | 5 | List state change re-pulls store (medium) |
| **C** | Sections + Lists → Stores | 4 | Both above, combined |
| **D** | Sections + Lists → Stores → Households | 3 | Everything couples to household checkpoint |
| **E** | Stores → Households only (no section/list fold) | 5 | Store change re-pulls household (thin, but member changes too) |

#### The Real Question: Lifecycle Coupling

The access scope and push/pull constraints eliminate most folds. The remaining decision is purely about **lifecycle coupling** — how much checkpoint coupling are you willing to accept in exchange for fewer collections?

- **Sections** are low-frequency, admin-style mutations (create, reorder, rename). Coupling to store is cheap.
- **Lists** have a state machine that transitions during active shopping. Coupling to store means every list interaction re-pulls all sections and other lists for that store. More expensive.
- **Stores → Households** couples everything to the household checkpoint, including membership changes. This is the extreme.

#### Tentative Conclusion

**Fold sections into stores (low lifecycle cost), keep lists separate (state machine is too active), keep stores separate from households (membership changes shouldn't cascade).**

That gives 5 collections: household, store (with embedded sections), list, item, listItem — plus notification as 6th.

This fold is deferred to a separate refactor ticket. The notification implementation plan proceeds with the current 6-collection structure plus SSE transport fixes.

---

## User Comments

(To be added by user)

---

## Promotion Decision

(To be decided after user comments)