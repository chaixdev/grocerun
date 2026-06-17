# Ticket: Per-store item ordering with auto-sort on add

**Status:** planned
**Source:** intake 2026-06-16, GROCERUN-7
**Branch:** —

## Background

Items in shopping lists are already grouped by section. Within each section they appear in add-order (FIFO by `createdAt`). This ticket adds intra-section ordering so items within a section follow store-layout order rather than add-order.

Sections already have `order` with working DnD reorder (`PATCH sections/reorder` + `SortableList`). Items have no `order` field — catalog listings sort by `purchaseCount DESC, name ASC`, list items sort by `createdAt ASC`.

## User-Facing Goal

Items in shopping lists display in store-layout order (sections → items). Adding a known item auto-lands in its section position. Reordering during a shopping trip persists to future trips for that store.

## Acceptance Criteria

- List items grouped by section, sorted within section by `item.order ASC NULLS LAST, item.name ASC`
- DnD reorder within sections in **shopping mode only** — not planning mode
- Reorder persists across lists for the same store
- Adding an existing item to a list places it in its section position (natural consequence of sort key — no special code)
- New items (never positioned, `order = NULL`) sort alphabetically within their section
- Crash-safe: lost reorder is acceptable — user redoes next trip
- Reorder sent as batch `PATCH items/reorder` on shopping mode end

## Scope

- Add `order Int?` (nullable) to `Item` model (Prisma + RxDB). `NULL` = unpositioned, non-`NULL` = positioned
- Add `@@index([sectionId, order])`
- `PATCH items/reorder` endpoint: `{ sectionId: string, storeId: string, orderedItemIds: string[] }`
- `ReorderItemsSchema` DTO (Zod: `z.object({ sectionId, storeId, orderedItemIds })`)
- `GET lists/:id`: sort key `section.order ASC, item.order ASC NULLS LAST, item.name ASC`
- `ListItemWithItem` type: include `order: number | null`
- RxDB `itemToSyncDoc`: include `order` in pull; push handler does NOT push `order` (server-authoritative)
- `PATCH items/:id` does NOT accept `order` from body; if `sectionId` changes, reset `order` to `NULL`
- Per-section DnD in list view (reuse `SortableList`) — shopping mode only
- In-memory reorder diff during shopping, batch `PATCH items/reorder` on mode end
- `useReorderItems` hook: direct `api.patch('/items/reorder', ...)` — NOT through RxDB push

## Non-Scope

- Aisles — section is the canonical term
- Per-list custom ordering — all lists inherit catalog order
- Cross-section drag-and-drop — logged as separate intake (FEATURE-INTAKE.md)
- Store catalog reorder UI — **rejected.** Order mutations without a sync context (shopping mode) create data inconsistency risk
- `PATCH items/:id` does NOT accept `order`
- Periodic order compaction — integer growth is cosmetic at realistic scale
- Reorder in planning mode — UI restricted to shopping mode only

## Emergent Ordering

Order is not pre-configured — it emerges from actual shopping trips. When new items appear alongside positioned items for the first time, the bump algorithm makes a **best guess** that places new items where the user dragged them relative to known items, but does not know their correct position relative to catalog items not in the current list.

Order improves with each trip, converging toward true store layout without a settings page. If an item is never in a list alongside another, their relative order doesn't matter yet.

## Relevant Context

- Items already `storeId`-scoped in the current model
- Only one active list per store — no concurrent reorder risk
- `Section.order` + `PATCH sections/reorder` exists as reference pattern
- `components/ui/sortable.tsx` (SortableList, SortableItem, SortableDragHandle) — proven DnD
- `ListEditor.tsx` lines 313-325 already group list items by section
- Shopping mode locks list-scope data but item ordering touches catalog data — acceptable: store-scope data editable outside shopping mode (store name, section order/name) does not intersect with `Item.order`

## Affected Areas

| Area | Files |
|------|-------|
| Prisma schema | `apps/server/prisma/schema.prisma` |
| Migration | New migration file |
| Server items | `apps/server/src/items/items.controller.ts`, `items.service.ts` |
| Server lists | `apps/server/src/lists/lists.service.ts` |
| Shared DTOs | `apps/_shared/dtos/src/index.ts` |
| RxDB schema | `apps/web/src/core/rxdb/schema.ts` |
| RxDB sync | `apps/server/src/sync/collections/item-sync.ts` |
| RxDB mutations | `apps/web/src/core/lib/useRxMutation.ts` (no changes — order excluded from push) |
| List view | `apps/web/src/features/lists/components/ListEditor.tsx` |
| DnD | New hook `useReorderItems` (follows `useReorderSections` pattern) |

## Implementation Outline

### Part A — Schema + Server (2 days)
1. Add `order Int?` to Prisma `Item`, add `@@index([sectionId, order])`, run migration
2. Add `order?: number` to `ItemDocType` (optional, nullable)
3. Add `ReorderItemsSchema` DTO: `{ sectionId: z.string(), storeId: z.string(), orderedItemIds: z.array(z.string()) }`
4. `PATCH items/reorder` — bump+compact algorithm (transactional, `$transaction()`)
5. Update `GET lists/:id` sort to `section.order ASC, item.order ASC NULLS LAST, item.name ASC`
6. Update `itemToSyncDoc` to include `order` in pull; verify push handler excludes `order`
7. Server unit tests: reorder endpoint, sort logic
8. `PATCH items/:id`: reset `order` to `NULL` when `sectionId` changes

### Part B — Web (2-3 days)
1. `useReorderItems` hook: direct `api.patch('/items/reorder', ...)` — NOT RxDB push
2. Per-section `SortableList` in `ListEditor` — shopping mode only
3. In-memory reorder diff (array of `{ sectionId, orderedItemIds[] }` diffs), batch send on mode end
4. List view sort by section→item order (natural consequence of updated `GET lists/:id`)
5. Component tests for DnD, e2e for section-grouped order

## Server Algorithm — Bump + Compact

Operates per-section, server-side, within `this.prisma.$transaction()`.

**Key invariant:** `NULL` = never positioned. Non-`NULL` = positioned. All positioned items form a contiguous block at the start of the section. Compaction maintains this.

**Algorithm:**

1. **Validate:** All `orderedItemIds` belong to `storeId`, match the given `sectionId`, and are not soft-deleted. Reject with 400 if any fail.

2. **Read state:** Fetch all non-deleted items in the section: `{ id, order }`. Build `orderMap`. Unpositioned items have `order = null`.

3. **Normalize:** Extract all positioned items from the reorder array (preserving array order). Check if their existing `order` values are strictly ascending left-to-right. An item is repositioned if its existing `order` does not match this linearization — i.e., it appears before an item with a lower `order` or after an item with a higher `order`. Repositioned items are treated as unpositioned for this run: remove their `order` from `orderMap`. Items with equal `order` values (shouldn't happen in practice) are both treated as repositioned.

4. **Assign positions:** Iterate through the reorder array. For each item:
   - If positioned (order in `orderMap`): it stays at its current order (already bumped as an anchor). Track as anchor.
   - If unpositioned (no order in `orderMap`): insert before the next anchor. Count unpositioned items before that anchor. Bump the section: `UPDATE Item SET order = order + N WHERE sectionId = ? AND order >= anchorOrder AND deleted = false`. Assign the unpositioned block `[anchorOrder, anchorOrder + N - 1]` in reorder-array order. Update `orderMap` for bumped items.

   **Tiebreaker for unpositioned items within a block:** reorder-array order for visible items. Invisible catalog items that get bumped are NOT assigned — they just get their order incremented and stay in `orderMap`.

5. **Tail assignment:** After the last anchor, any remaining unpositioned items in the reorder array get assigned sequentially starting from `maxOrder + 1`.

6. **Compaction:** After assignment, renumber all non-`NULL` items in the section to `1, 2, 3, ...` (consecutive, starting from 1). NULLs are not touched. This keeps integer values bounded and means `0` is never used (eliminating the `0`-as-sentinel problem entirely).

7. **Notify:** `this.notify.byStore(storeId, ['item'])` — triggers RxDB pull for all connected clients.

**All-NULL fallback:** If no item in the section has a non-`NULL` order, assign sequential positions from 1 in reorder-array order.

**Crash safety:** Reorder diff held in memory. Crash = lost, user redoes next trip. Acceptable — item ordering is not transactional data.

**Concurrent reorders:** `$transaction()` serializes. Last write wins. Acceptable given single active list per store.

## Edge Cases

| Case | Behavior |
|------|----------|
| Section has no positioned items (all NULL) | Assign sequential from 1 in reorder-array order |
| Item moved to different section via `PATCH items/:id` | `order` reset to `NULL` on section change |
| Item soft-deleted then restored | `order` persists; gets normalized on next reorder |
| New item added mid-trip (not in reorder diff) | Stays `NULL` until included in a future reorder |
| Equal-order collision (two positioned items with same order) | Treated as repositioned by normalize step (not strictly monotonic) |
| Empty reorder array | No-op (or reject with 400) |
| Concurrent reorder from another device | `$transaction()` serializes; last-write-wins |

## Test Strategy

- **Unit (server):** bump algorithm with positioned + new items; all-NULL fallback; normalize step (non-monotonic detection); compaction produces consecutive 1..N; sectionId change resets order
- **Component (web):** DnD within section (shopping mode only); sort order display
- **E2E:** add items to list, reorder in shopping mode, end trip, reopen list — verify order persists
- **Manual/UAT:** crash recovery acceptable (redo); offline reorder queued

## Risks

- **Offline + concurrent:** last-write-wins. Acceptable — single active list per store.
- **In-memory reorder diff:** lost on crash. Acceptable — item ordering is not transactional.
- **Nullable `order` + NULLS LAST:** Prisma typed API can't express `NULLS LAST` natively. Must sort in application code or use raw SQL. App-level sort (Option A from review) is recommended.
