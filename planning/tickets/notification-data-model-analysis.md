# Ticket Analysis: GROCERUN-32 — Notification data model + server API + sync

## Clarity Assessment

| Dimension | Assessment | Verdict |
|-----------|-----------|---------|
| **Goal Clarity** | Persist user-facing household notifications (activity feed data layer). Server creates notification records on mutations, clients sync them via pull-only RxDB collection. | Clear |
| **Acceptance Criteria** | Implied by title: (1) Prisma Notification model, (2) REST API for notifications, (3) sync integration as pull-only collection. Needs explicit AC — see below. | Clear enough |
| **Technical Scope** | Server: Prisma schema + migration, NestJS notifications module, sync collection handler, notification creation in existing services. Shared: DTOs. Web: RxDB notification schema + replication wiring. | Clear |
| **Dependencies** | Child of GROCERUN-11 (Household activity feed epic). No other ticket dependencies — builds on existing sync infrastructure. GROCERUN-33 (#11b) depends on this. | Clear |
| **Test Strategy** | Unit tests for notification service + sync handler. Server integration tests for REST API + notification creation. Web component tests for RxDB schema. E2E: notification sync journey. | Clear enough |

**Verdict: PROCEED** — All dimensions are sufficiently clear to produce a concrete implementation plan.

---

## Affected Code

### Server (`apps/server/`)

| File | Current behavior | Change |
|------|-----------------|--------|
| `prisma/schema.prisma` | 11 models, no Notification | Add `Notification` model |
| `prisma/migrations/` | Existing migrations | New migration for Notification table |
| `src/sync/sync.service.ts` | `SyncCollection` = 6 collections, `SUPPORTED_COLLECTIONS` array, switch dispatch | Add `'notification'` to type, array, switch, and `getHouseholdMemberIds` |
| `src/sync/sync.types.ts` | `SyncDocument`, `PullResponse`, `SyncCheckpoint` | No change (generic types work) |
| `src/sync/sync-helpers.ts` | `pullByAccess()` generic pull handler | No change (reuse as-is) |
| `src/sync/collections/` | 6 collection sync handlers (store-sync.ts, item-sync.ts, etc.) | Add `notification-sync.ts` |
| `src/sync/sync-deps.ts` | Access helpers for stores/households | Add `getAccessibleNotificationHouseholdIds` or reuse `getAccessibleHouseholdIdsForSync` |
| `src/shared/notification.service.ts` | Fire-and-forget SSE broadcast (byStore, byHousehold) | No change — stays as SSE sync helper |
| `src/shared/shared.module.ts` | Exports NotificationService, PrismaService, etc. | Export new UserNotificationService |
| `src/items/items.service.ts` | Calls `notify.byStore()` after mutations | Add `userNotify.createForHousehold()` calls |
| `src/lists/lists.service.ts` | Calls `notify.byStore()` after mutations | Add `userNotify.createForHousehold()` calls |
| `src/stores/stores.service.ts` | Calls `notify.byHousehold()` after mutations | Add `userNotify.createForHousehold()` calls |
| `src/sections/sections.service.ts` | Calls `notify.byStore()` after mutations | Add `userNotify.createForHousehold()` calls |
| `src/households/households.service.ts` | Calls `notify.byHousehold()` after mutations | Add `userNotify.createForHousehold()` calls |
| `src/invitations/invitations.service.ts` | Calls `notify.byHousehold()` on invitation complete | Add `userNotify.createForHousehold()` calls |

### New server files

| File | Purpose |
|------|---------|
| `src/notifications/notifications.module.ts` | NestJS module |
| `src/notifications/notifications.controller.ts` | REST API: list, mark read, mark all read |
| `src/notifications/notifications.service.ts` | Query + mark-read logic |
| `src/notifications/user-notification.service.ts` | Notification creation + SSE dispatch (dual-dispatch) |
| `src/notifications/notification-sync.ts` | Sync document converter |
| `src/notifications/dto/` | NestJS DTOs (if needed beyond shared) |

### Shared (`apps/_shared/dtos/`)

| File | Change |
|------|--------|
| `src/index.ts` | Add `NotificationSchema`, `NotificationDto`, `NotificationType` enum |

### Web (`apps/web/`)

| File | Current behavior | Change |
|------|-----------------|--------|
| `src/core/rxdb/schema.ts` | 6 RxDB schemas | Add `NotificationSchema` + `NotificationDocType` |
| `src/core/rxdb/database.ts` | 6 collections, `RXDB_NAME = 'grocerun-v9'` | Add notification collection, bump `RXDB_NAME` to `'grocerun-v10'`, add `startNotificationReplication()` + `resyncNotification()` |
| `src/core/rxdb/collections.ts` | (if exists) Collection name exports | Add `'notification'` |

---

## Solution Designs

### Option A: Infrastructure Only (Minimal — S)

**Scope:** Prisma model + migration + shared DTOs + NestJS notifications module (REST read API only) + sync pull collection + RxDB schema. No notification creation in existing services.

**Files:**
- `prisma/schema.prisma` — Add Notification model
- `prisma/migrations/xxx_notification/` — Migration
- `apps/_shared/dtos/src/index.ts` — NotificationSchema, NotificationDto
- `apps/server/src/notifications/` — Module, controller (GET list, PATCH read), service
- `apps/server/src/sync/sync.service.ts` — Add 'notification' to SyncCollection
- `apps/server/src/sync/collections/notification-sync.ts` — Pull handler
- `apps/web/src/core/rxdb/schema.ts` — NotificationRxSchema
- `apps/web/src/core/rxdb/database.ts` — Collection + replication wiring

**Pros:** Smallest change, zero risk to existing mutation paths, clean data layer.
**Cons:** No notifications are ever created — #11b can't function without a creation path. The sync pulls an empty collection.
**Risk:** Low

### Option B: Full Data Pipeline (Balanced — M) — RECOMMENDED

**Scope:** Everything in Option A PLUS a `UserNotificationService` that creates notification records and dispatches SSE, wired into existing mutation services.

**Files (additional vs Option A):**
- `apps/server/src/notifications/user-notification.service.ts` — `createForHousehold(householdId, type, actorId, entityType, entityId, message)` → creates N notification records (one per household member except actor) + calls `sseBroadcast.notifyChanged(memberIds, {collections: ['notification'], reason: 'notification_created'})`
- `apps/server/src/items/items.service.ts` — Call `userNotify.createForHousehold()` on add/update/delete
- `apps/server/src/lists/lists.service.ts` — Call on create/complete/delete
- `apps/server/src/stores/stores.service.ts` — Call on add
- `apps/server/src/sections/sections.service.ts` — Call on add
- `apps/server/src/households/households.service.ts` — Call on member join/leave
- `apps/server/src/invitations/invitations.service.ts` — Call on invitation accepted

**Notification creation pattern:**
```typescript
// In items.service.ts after creating an item:
await this.userNotify.createForHousehold({
  householdId,
  type: 'item_added',
  actorId: userId,
  actorName: userName,
  entityType: 'item',
  entityId: item.id,
  message: `${userName} added ${item.name} to ${storeName}`,
});
// Existing SSE sync call stays:
this.notify.byStore(storeId, ['item'], 'item_added');
```

**Pros:** Complete data pipeline — notifications are created, synced, and ready for #11b UI. #11b only needs React hooks + bell component.
**Cons:** Touches 6 existing services. Each needs constructor injection of `UserNotificationService`.
**Risk:** Medium — existing service tests need updating, but changes are additive (new call after existing mutations, no change to existing logic).

### Option C: Preferences + Enum Table (Strategic — L)

**Scope:** Everything in Option B PLUS a `NotificationPreference` model (per-user per-type opt-in/opt-out), notification types as a Prisma enum table, and batch creation optimization.

**Pros:** Future-proof, supports notification preferences from day one.
**Cons:** Over-engineering for MVP. Preferences can be added later without schema migration pain (additive). Enum table adds complexity for no current value.
**Risk:** Medium-High — scope creep, more surface area to test.

---

## Recommendation

**Option B: Full Data Pipeline.**

Rationale:
1. #11a is the data foundation — without notification creation, the entire pipeline is hollow.
2. The `UserNotificationService` cleanly separates user-facing notifications from the existing SSE sync `NotificationService`.
3. Changes to existing services are purely additive (new call after existing mutations).
4. #11b can then focus purely on UI (bell, toast, hooks) without touching server code.
5. Aligns with ADR-007: notifications are server-authoritative (transactional side effects, server confirmation required).

---

## Architecture Alignment

- **Relevant ADRs:** ADR-007 (Phase 4 Local-First Strategy) — notifications are server-authoritative per criteria (2) transactional side effects and (3) requires server confirmation. Pull-only sync, no push.
- **Relevant rules:** `wiki/rules/rxdb.md` — explicit `startXReplication` + `resyncX` pattern, no factory abstraction. `wiki/rules/coding-standards.md` — Zod at API boundaries, constructor injection, no `any`.
- **Relevant technical designs:** `wiki/technical-design/rxdb-sync-protocol.md` — new collection follows existing pull-only pattern (like store, section, list, household).
- **Current project-status constraints:** Phase 4 active (RxDB local-first shopping). Notification sync extends the existing protocol, doesn't change it.
- **Potential tension:** None. The notification collection is a natural addition to the existing sync protocol. The `UserNotificationService` is a new concern, not a modification of existing `NotificationService`.
- **User decision needed:** No.
- **Conclusion:** Aligned.

---

## Test Strategy

### Unit tests
- **`UserNotificationService`** — Test `createForHousehold()`: creates N records for N members, excludes actor, dispatches SSE with correct member IDs. Mock PrismaService + SseBroadcastService.
- **`NotificationsService`** — Test `list()`, `markRead()`, `markAllRead()`: correct Prisma queries, filtering by userId + household access.
- **`notification-sync.ts`** — Test `notificationToSyncDoc()`: correct field mapping, ISO-8601 date conversion.

### Server integration tests
- **REST API:** `GET /notifications` returns only current user's notifications, filtered by household access. `PATCH /notifications/:id/read` marks as read. `PATCH /notifications/read-all` marks all as read.
- **Notification creation:** After item creation via API, a notification record exists in DB for all household members except the actor.
- **Sync pull:** `GET /sync/notification/pull` returns notifications filtered by user, respects checkpoint pagination.
- **SSE dispatch:** After mutation, SSE event includes `['notification']` in collections.

### Web component tests
- **RxDB schema:** Notification collection creates, documents validate against schema, `updatedAt` index works.
- **Replication:** Pull-only replication fetches from `/sync/notification/pull`, no push endpoint called.

### E2E journey semantics
- **Affected:** New journey — "User sees notification after household member adds item." This is a new journey, not a modification of existing ones.
- **Existing journeys:** Unaffected — notification creation is additive, doesn't change existing mutation behavior.

### Manual/UAT
- User A adds an item → User B sees a notification in the bell (once #11b is done).
- For #11a: verify via API that notification records exist after mutations.
- Verify sync: two browser sessions, one creates an item, the other pulls notifications via sync.

---

## Dependencies & Blockers

- **No blockers.** All infrastructure exists (sync protocol, SSE, RxDB, Prisma).
- **Blocks:** GROCERUN-33 (#11b — Notification bell UI + dual-dispatch hooks) depends on this ticket.
- **Parent:** GROCERUN-11 (Household activity feed epic).