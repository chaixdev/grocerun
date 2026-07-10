# Ticket: GROCERUN-32 — Notification data model + server API + sync

**Status:** planned
**Source:** GROCERUN-11 (Household activity feed epic), FEATURE-INTAKE.md "Household activity feed" + "Push notifications for household events"
**Branch:** (not yet started)
**Plane:** GROCERUN-32, child of GROCERUN-11, estimate: M
**Blocks:** GROCERUN-33 (#11b — Notification bell UI + dual-dispatch hooks)

## Background

The household activity feed epic (#11) needs a data foundation: persisted user-facing notifications that sync to client devices. Currently, the only notification mechanism is a fire-and-forget SSE broadcast (`NotificationService`) that tells clients to re-pull sync collections — there are no persisted notification records, no notification API, and no notification sync collection.

This ticket creates the full server-side data pipeline: Prisma model, REST API, sync integration, and notification creation in existing mutation services. #11b will build the client-side bell UI and React hooks on top of this.

## User-Facing Goal

A household member performs an action (adds an item, completes a list, joins the household). Other household members see a notification about it. This ticket delivers the data layer — actual UI comes in #11b.

## Acceptance Criteria

1. **Prisma Notification model exists** with fields: id, createdAt, updatedAt, deleted, deletedAt, householdId, userId, type, actorId, actorName, entityType, entityId, message, readAt, category, dismissedAt. Migration applied.
2. **Shared DTOs exist** — `NotificationSchema` (Zod) + `NotificationDto` type in `apps/_shared/dtos/`.
3. **REST API works:**
   - `GET /notifications` — returns current user's notifications (filtered by household access), sorted newest-first, paginated.
   - `PATCH /notifications/:id/read` — marks a single notification as read.
   - `PATCH /notifications/read-all` — marks all unread notifications as read.
4. **Sync pull collection works** — `GET /sync/notification/pull` returns notifications for the current user, checkpoint-paginated, respecting the tombstone window.
5. **RxDB notification collection exists** — schema, doc type, pull-only replication wired in `database.ts`, `RXDB_NAME` bumped.
6. **SSE routing is collection-scoped** — `sharedPullStreams` changed from `Set<Subject>` to `Map<string, Subject>`, `SYNC_CHANGED` events parsed for `collections` array, RESYNC only emitted to matching streams. (Prerequisite for efficient notification dispatch.)
7. **Self-notify skipped on push** — pusher's userId excluded from `SseBroadcastService.notifyChanged` so optimistic local writes don't trigger redundant re-pulls.
8. **Access queries memoized** — `getAccessibleStoreIdsForSync`/`getAccessibleHouseholdIdsForSync` cached per-request so 5 collections don't each make the same Prisma query.
9. **Notifications are created on key mutations** (staged — prove pattern first, then expand):
   - Stage 1 (prove pattern): Store added
   - Stage 2 (expand): Section added, List created, List completed, Invitation accepted (member joined)
10. **SSE dispatch** — notification creation triggers `SYNC_CHANGED` with `['notification']` collection so connected clients re-pull.
11. **Existing `NotificationService` renamed** — SSE sync broadcast helper renamed to `SseSyncBroadcastService` to disambiguate from `UserNotificationService`. New `UserNotificationService` handles user-facing notifications.
12. **All tests pass** — unit, server integration, web component. No regressions in existing tests.

## Scope

### In scope
- **SSE transport fixes** (prerequisite): collection-scoped SSE routing, skip self-notify on push, memoize access queries
- Prisma `Notification` model + migration (touches 3 models: Notification, User, Household)
- Shared Zod DTOs for notifications
- NestJS `NotificationsModule`: controller (REST read/mark-read) + `NotificationsService`
- `UserNotificationService` in `SharedModule` (global): creates notification records + dispatches SSE
- Rename existing `NotificationService` → `SseSyncBroadcastService`
- Sync integration: `'notification'` pull-only collection
- RxDB notification schema + pull replication wiring
- Notification creation calls (staged): prove with 1 service, expand to 4 total

### Non-scope
- Notification bell UI, toast component, React hooks (#11b)
- Push notifications / service worker (future, significant scope per FEATURE-INTAKE.md)
- Notification preferences / opt-out per type
- Notification types as enum table (string type field is sufficient for MVP)
- Notification deletion by user (soft-delete via sync tombstone is enough)
- Real-time collaboration features (chat, presence)

## Relevant Context

### ADRs
- **ADR-007** (Phase 4 Local-First Strategy): Notifications are server-authoritative per criteria (2) transactional side effects, (3) requires server confirmation. Pull-only sync, no push. Aligns with existing server-authoritative collections (store, section, list, household).

### Coding rules
- `wiki/rules/rxdb.md`: Explicit `startNotificationReplication()` + `resyncNotification()` pattern — no factory abstraction. All schemas version 0, primary key `id` (cuid2).
- `wiki/rules/coding-standards.md`: `strict: true`, Zod at API boundaries, constructor injection, no `any`, conventional commits.
- `wiki/rules/prisma.md`: Soft-delete pattern (`deleted`, `deletedAt`), `@@index([updatedAt, id])` for sync checkpoint.
- `wiki/rules/nestjs.md`: Module structure, validation.

### Technical designs
- `wiki/technical-design/rxdb-sync-protocol.md`: New pull-only collection follows existing pattern. `pullByAccess()` helper reused. SSE `SYNC_CHANGED` event with `{collections, reason}` payload.

### Project status constraints
- Phase 4 active (RxDB local-first shopping). This extends the sync protocol, doesn't change it.
- `RXDB_NAME` bump required — existing clients will re-sync all collections on first load after upgrade (acceptable, same as previous bumps).

## Affected Areas

| Area | Files | Change type |
|------|-------|-------------|
| Server schema | `apps/server/prisma/schema.prisma` | New model + relations on User, Household |
| Server migration | `apps/server/prisma/migrations/` | New migration |
| Server notifications | `apps/server/src/notifications/` (new) | New module (REST API only) |
| Server sync | `apps/server/src/sync/sync.service.ts`, `apps/server/src/sync/collections/notification-sync.ts` (new) | Additive + push() exhaustiveness |
| Server shared | `apps/server/src/shared/shared.module.ts`, `apps/server/src/shared/notification.service.ts` | Rename + export new service |
| Server SSE | `apps/server/src/sync/sse-broadcast.service.ts` | Skip self-notify on push |
| Server services | `stores.service.ts`, `sections.service.ts`, `lists.service.ts`, `invitations.service.ts` | Additive (new call after mutations) |
| Shared DTOs | `apps/_shared/dtos/src/index.ts` | Additive |
| Web RxDB | `apps/web/src/core/rxdb/schema.ts`, `apps/web/src/core/rxdb/database.ts` | Additive + RXDB_NAME bump + SSE routing fix |

## Implementation Outline

### Phase 0: SSE Transport Fixes (Prerequisite)

0a. **Fix SSE routing** (`apps/web/src/core/rxdb/database.ts`):
    - Change `sharedPullStreams` from `Set<Subject>` to `Map<string, Subject>` (keyed by collection name)
    - Parse `event.data` in `SYNC_CHANGED` handler to extract `collections` array
    - Only emit `RESYNC` to matching streams, not all streams
    - Update `registerPullStream` to accept collection name + subject
    - ~50 lines

0b. **Skip self-notify on push** (`apps/server/src/sync/sse-broadcast.service.ts`, `apps/server/src/sync/sync.service.ts`):
    - Thread pusher's `userId` to `SseBroadcastService.notifyChanged`
    - Exclude pusher from the SSE recipient list (their local state is already correct from optimistic write)
    - ~10 lines

0c. **Memoize access queries** (`apps/server/src/sync/sync.service.ts`):
    - Cache `getAccessibleStoreIdsForSync` / `getAccessibleHouseholdIdsForSync` per-request (or 5-second TTL)
    - Eliminates 5 redundant Prisma queries during `resyncAll()`
    - ~15 lines

0d. **Rename `NotificationService` → `SseSyncBroadcastService`** (`apps/server/src/shared/`):
    - Rename file, class, and all 6 import sites (items, lists, stores, sections, households, invitations services)
    - Prevents permanent confusion with `UserNotificationService`
    - ~9 files touched, mechanical rename

### Phase 1: Data Model + DTOs

1. **Prisma Notification model** (`apps/server/prisma/schema.prisma`):
   ```prisma
   model Notification {
     id          String    @id @default(cuid())
     createdAt   DateTime  @default(now())
     updatedAt   DateTime  @updatedAt
     deleted     Boolean   @default(false)
     deletedAt   DateTime?

     householdId String
     household   Household @relation(fields: [householdId], references: [id])
     userId      String
     user        User      @relation(fields: [userId], references: [id])

type        String
      actorId     String
      actorName   String
      entityType  String
      entityId    String?
      message     String
      readAt      DateTime?
      category    String?
      dismissedAt DateTime?

      @@index([updatedAt, id])
      @@index([userId, readAt])
    }
    ```
    Add `notifications Notification[]` relation to `User` and `Household` models.
    Note: `category` and `dismissedAt` are nullable columns added now to avoid migration churn in #11b. `category` for bell grouping (items/lists/members), `dismissedAt` distinct from `readAt` (read = seen in feed, dismissed = cleared from bell).

2. **Migration**: `npx prisma migrate dev --name add_notification_model`

3. **Shared DTOs** (`apps/_shared/dtos/src/index.ts`):
   ```typescript
   export const NotificationTypeSchema = z.enum([
     'store_added', 'section_added',
     'list_created', 'list_completed',
     'member_joined',
   ]);

   export const NotificationSchema = z.object({
     id: z.string(),
     updatedAt: z.string(),
     _deleted: z.boolean(),
     householdId: z.string(),
     userId: z.string(),
     type: NotificationTypeSchema,
     actorId: z.string(),
     actorName: z.string(),
     entityType: z.string(),
     entityId: z.string().nullable(),
     message: z.string(),
     readAt: z.string().nullable(),
     category: z.string().nullable(),
     dismissedAt: z.string().nullable(),
   });
   export type NotificationDto = z.infer<typeof NotificationSchema>;
   ```

### Phase 2: NestJS Notifications Module

4. **`UserNotificationService`** (`apps/server/src/shared/user-notification.service.ts`):
   - Lives in `SharedModule` (global), not `NotificationsModule` — same pattern as `SseSyncBroadcastService`
   - Constructor: `PrismaService`, `SseBroadcastService`
   - `createForHousehold({ householdId, type, actorId, entityType, entityId, message, category? })`:
     - Fetch household members + actor name in one query: `prisma.household.findUnique({ include: { users: { select: { id: true, name: true } } } })`
     - Exclude actor from recipient list
     - Create one `Notification` record per member via `prisma.notification.createMany()`
     - Call `sseBroadcast.notifyChanged(recipientIds, { collections: ['notification'], reason: 'notification_created' })`
     - Fire-and-forget pattern (log errors, don't block mutation)

5. **`NotificationsService`** (`apps/server/src/notifications/notifications.service.ts`):
   - Constructor: `PrismaService`
   - `list(userId, { limit, offset })` — query `prisma.notification.findMany({ where: { userId, deleted: false }, orderBy: { createdAt: 'desc' }, take, skip })`
   - `markRead(userId, notificationId)` — verify ownership, set `readAt = now()`
   - `markAllRead(userId)` — `prisma.notification.updateMany({ where: { userId, readAt: null, deleted: false }, data: { readAt: now() } })`

6. **`NotificationsController`** (`apps/server/src/notifications/notifications.controller.ts`):
   - `@Controller('notifications')` with `@UseGuards(AuthGuard)`
   - `@Get()` — list, query params for pagination
   - `@Patch(':id/read')` — mark single read
   - `@Patch('read-all')` — mark all read

7. **`NotificationsModule`** (`apps/server/src/notifications/notifications.module.ts`):
   - Providers: `NotificationsService` (REST read/mark-read queries only)
   - Exports: none (REST API module, not consumed by other modules)
   - Imports: `PrismaModule` (or rely on global `PrismaService`)

8. **Register in `AppModule`** — add `NotificationsModule` to imports.

9. **Export `UserNotificationService` from `SharedModule`** — it lives in `SharedModule` (global), not `NotificationsModule`. Same pattern as `SseSyncBroadcastService`. `NotificationsModule` only contains the REST API (controller + `NotificationsService`).

### Phase 3: Sync Integration

10. **`notification-sync.ts`** (`apps/server/src/sync/collections/notification-sync.ts`):
    ```typescript
    export function notificationToSyncDoc(n: Notification): SyncDocument {
      return {
        id: n.id,
        updatedAt: n.updatedAt.toISOString(),
        _deleted: n.deleted,
        householdId: n.householdId,
        userId: n.userId,
        type: n.type,
        actorId: n.actorId,
        actorName: n.actorName,
        entityType: n.entityType,
        entityId: n.entityId,
        message: n.message,
        readAt: n.readAt?.toISOString() ?? null,
      };
    }

    export async function pullNotifications(deps, checkpoint, limit, userId): Promise<PullResponse> {
      return pullByAccess({
        deps, checkpoint, limit, userId,
        model: deps.prisma.notification,
        toDoc: notificationToSyncDoc,
buildBaseFilter: async (d, u) => {
           // Notifications are filtered by userId, not household access.
           // Do NOT add `deleted: false` here — buildPullWhere handles tombstones.
           return { userId: u };
         },
      });
    }
    ```
    Note: `buildBaseFilter` uses `userId` directly — notifications are personal, not household-scoped for sync purposes. The `householdId` field is for reference/display only.

11. **Update `SyncService`** (`apps/server/src/sync/sync.service.ts`):
    - Add `'notification'` to `SyncCollection` type
    - Add `'notification'` to `SUPPORTED_COLLECTIONS` array
    - Add case in `pull()` switch → `pullNotifications(deps, checkpoint, limit, userId)`
    - Add `case 'notification': return [];` to `push()` switch (notifications are pull-only, no push handler — matches section/list/store/household pattern)
    - Do NOT add a case to `getHouseholdMemberIds()` — that function is only called from the push() handler, and notifications have no push path. Adding it would be unreachable dead code.

### Phase 4: RxDB Client Schema

12. **Notification RxDB schema** (`apps/web/src/core/rxdb/schema.ts`):
    ```typescript
    export interface NotificationDocType {
      id: string;
      updatedAt: string;
      householdId: string;
      userId: string;
      type: string;
      actorId: string;
      actorName: string;
      entityType: string;
      entityId: string | null;
      message: string;
      readAt: string | null;
    }

    export const notificationSchema: RxJsonSchema<NotificationDocType> = {
      version: 0,
      primaryKey: 'id',
      type: 'object',
      properties: {
        id: { type: 'string', maxLength: 30 },
        updatedAt: { type: 'string', format: 'date-time', maxLength: 30 },
        householdId: { type: 'string', maxLength: 30 },
        userId: { type: 'string', maxLength: 30 },
        type: { type: 'string' },
        actorId: { type: 'string', maxLength: 30 },
        actorName: { type: 'string' },
        entityType: { type: 'string' },
        entityId: { type: ['string', 'null'], maxLength: 30 },
        message: { type: 'string' },
        readAt: { type: ['string', 'null'], format: 'date-time' },
      },
      required: ['id', 'updatedAt', 'householdId', 'userId', 'type', 'actorId', 'actorName', 'entityType', 'message'],
      indexes: ['updatedAt'],
    };
    ```

13. **Database wiring** (`apps/web/src/core/rxdb/database.ts`):
    - Add `notification` to `GrocerunCollections` type
    - Add `notificationSchema` to `addCollections()` call
    - Bump `RXDB_NAME` from `'grocerun-v9'` to `'grocerun-v10'`
    - Add `let notificationPullStream$: Subject<void> | null = null`
    - Add `export function resyncNotification()` — emits into pull stream
    - Add `function startNotificationReplication(collection)` — calls `startPullReplication({ collection, basePath: '/api/v1/sync/notification', replicationIdentifier: 'grocerun-notification-sync-v1', pullStream$: notificationPullStream$, enablePush: false })`
    - Call `startNotificationReplication(notificationCollection)` in `initDb()`
    - Register pull stream via `registerPullStream(notificationPullStream$)`

### Phase 5: Notification Creation in Existing Services (Staged)

14. **Stage 1 — Prove the pattern with one creation point:**

    Wire `UserNotificationService` into `stores.service.ts`. After `createStore()` + existing `notify.byHousehold()` call, add:
    ```typescript
    this.userNotify.createForHousehold({
      householdId, type: 'store_added', actorId: userId,
      entityType: 'store', entityId: store.id,
      message: `added store "${store.name}"`,
      category: 'stores',
    }).catch(err => this.logger.error('Notification creation failed', err));
    ```

    Verify end-to-end: Prisma record created → SSE dispatched → client re-pulls notification collection → RxDB document appears. Unit + integration tests confirm the pattern works.

15. **Stage 2 — Expand to remaining creation points:**

    Once Stage 1 is verified, add notification creation to:
    - **`sections.service.ts`** (after `createSection`): `type: 'section_added'`, `category: 'stores'`
    - **`lists.service.ts`** (after `createList`): `type: 'list_created'`, `category: 'lists'`
    - **`lists.service.ts`** (after `completeList`): `type: 'list_completed'`, `category: 'lists'`
    - **`invitations.service.ts`** (after `joinHousehold`): `type: 'member_joined'`, `category: 'members'`

    Note: `items.service.ts` has no REST create/delete — items are created via sync push or `lists.service.ts:addItemToList`. `households.service.ts` has no member-join method — joining happens in `invitations.service.ts:joinHousehold`. `lists.service.ts` has no `deleteList` method.

    **Important:** Notification creation is fire-and-forget (same pattern as existing `notify` calls). Errors are logged but don't block the mutation. The mutation has already succeeded by the time notification creation runs.

16. **Actor name resolution in `UserNotificationService.createForHousehold`** — single query, fold actor name into household member fetch:
    ```typescript
    async createForHousehold({ householdId, type, actorId, entityType, entityId, message, category }) {
      const household = await this.prisma.household.findUnique({
        where: { id: householdId },
        include: { users: { select: { id: true, name: true } } },
      });
      if (!household) return;
      const actor = household.users.find(u => u.id === actorId);
      const actorName = actor?.name ?? 'Unknown';
      const recipientIds = household.users.filter(u => u.id !== actorId).map(u => u.id);
      if (recipientIds.length === 0) return;
      await this.prisma.notification.createMany({
        data: recipientIds.map(userId => ({
          householdId, userId, type, actorId, actorName,
          entityType, entityId, message, category,
        })),
      });
      this.sse.notifyChanged(recipientIds, { collections: ['notification'], reason: 'notification_created' });
    }
    ```
    One query instead of two — the household member fetch already includes `name`, so the actor is found in the result array.

## Test Strategy

### Unit tests
- **`UserNotificationService`** — `createForHousehold()`: creates N records for N-1 members (excludes actor), dispatches SSE with correct recipient IDs, handles missing household/user gracefully, fire-and-forget error handling.
- **`NotificationsService`** — `list()`: correct Prisma query, pagination. `markRead()`: ownership check, sets `readAt`. `markAllRead()`: updates only current user's unread.
- **`notificationToSyncDoc()`** — Correct field mapping, ISO-8601 conversion, null handling for `entityId` and `readAt`.

### Server integration tests
- `GET /notifications` — returns only current user's notifications, sorted newest-first, respects pagination.
- `PATCH /notifications/:id/read` — marks as read, 403 if not owner.
- `PATCH /notifications/read-all` — marks all unread as read.
- `GET /sync/notification/pull` — returns notifications for current user, checkpoint pagination works, tombstone window respected.
- **Tombstone delivery test** — create notification, soft-delete it, pull, verify `_deleted: true` in result. (Would catch the `deleted: false` in buildBaseFilter bug.)
- After `POST /stores` (create store), a notification record exists in DB for all household members except the actor.
- After mutation, SSE event includes `['notification']` in collections array.
- **SSE routing test** — `SYNC_CHANGED` with `['notification']` only triggers notification pull, not other collections.
- **Self-notify skip test** — push mutation does not send SSE to the pusher.

### Web component tests
- Notification RxDB collection creates and validates documents against schema.
- Pull-only replication fetches from `/sync/notification/pull`.
- No push endpoint called (verify `enablePush: false`).

### E2E journey semantics
- **New journey:** "User sees notification after household member adds item" — two authenticated sessions, one adds an item, the other syncs and has a notification record in local RxDB.
- **Existing journeys:** Unaffected — notification creation is additive, doesn't change existing mutation behavior or sync protocol.

### Manual/UAT
- Two browser sessions (different users, same household). User A adds an item. User B's client syncs and has a notification record (verify via RxDB devtools or API). This is the data-layer validation; visual bell comes in #11b.

## Documentation Impact Guess

| Document | Update needed? | What |
|----------|---------------|------|
| `wiki/technical-design/rxdb-sync-protocol.md` | Yes | Add 'notification' to collection list (7 collections), note it's pull-only, personal (userId-filtered). Update all ~15 "six collections" references to "seven". |
| `planning/tickets/PROJECT-STATUS.md` | Yes | Mark #11a as in-progress / completed |
| `wiki/rules/rxdb.md` | Yes | Update "6 collections" to "7 collections" in 3 places (lines 11, 71, 78) |
| New ADR | No | No architectural decision needed — follows existing patterns |
| New technical design | Maybe | If notification creation pattern needs codification (dual-service: SseSyncBroadcastService for sync SSE, UserNotificationService for persisted notifications) |

## Risks / Open Questions

1. **Actor name lookup adds a DB query per notification creation.** Resolved: fold actor name into the household member query (one query, not two). The household fetch already includes `users.name`, so the actor is found in the result array.

2. **`createMany` for N members is one query, not N.** Prisma `createMany` is a single INSERT — efficient for small households (2-5 members).

3. **`RXDB_NAME` bump causes full re-sync.** All existing clients will re-pull all collections on first load after upgrade. This is the same as previous bumps and is acceptable. The sync protocol handles this gracefully (checkpoint reset → full pull).

4. **Notification volume.** Every store/section/list/invitation mutation creates notifications. For a household of 4, that's 3 records per mutation. Over time, this grows. Mitigation: soft-delete + tombstone window handles cleanup. Future: add a cleanup job or TTL. Not in scope for MVP.

5. **Resolved: `UserNotificationService` placement.** Lives in `SharedModule` (global), not `NotificationsModule`. Same pattern as `SseSyncBroadcastService`. `NotificationsModule` only contains the REST API.

6. **Resolved: Notification creation is fire-and-forget.** Same as existing SSE notifications. If notification creation fails, the mutation still succeeded. The notification is a nice-to-have, not a consistency requirement.

7. **Household deletion cascade doesn't soft-delete notifications.** `cascadeSoftDeleteHousehold` soft-deletes Store→Section→Item→List→ListItem→Household but not Notification. Orphaned notifications remain queryable by `userId` for up to 30 days (tombstone window). Probably fine — members see notifications about a now-deleted household. Acknowledged, not blocking.

8. **`SseBroadcastService` is provided in both `SharedModule` and `SyncModule`.** Pre-existing duplicate. Not introduced by this plan. `UserNotificationService` in `SharedModule` gets the global instance. Worth cleaning up as a follow-up.

## Implementation Notes

(To be filled during implementation)

## Deviations from Plan

(To be filled during implementation)

## Gotchas / Rationale

(To be filled during implementation)

## Follow-Ups

- GROCERUN-33 (#11b): Notification bell UI + dual-dispatch React hooks
- Notification preferences (opt-out per type) — future
- Push notifications (service worker) — future, significant scope
- Notification cleanup/TTL policy — future
- Activity feed UI (full feed view, not just bell) — future, part of #11 epic
- Collection consolidation: fold sections into stores (see `planning/brainstorm/2026-07-10T0000_sse-sync-split-analysis.md`) — separate refactor ticket
- Clean up `SseBroadcastService` duplicate provider in `SharedModule` + `SyncModule` — pre-existing smell
- Update `wiki/technical-design/rxdb-sync-protocol.md` to fix misleading SSE routing claim (doc says collection-scoped, code didn't implement it — now fixed in Phase 0)