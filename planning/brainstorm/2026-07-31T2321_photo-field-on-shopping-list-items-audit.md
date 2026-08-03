# Oracle Audit: Photo field on shopping list items

**Date:** 2026-07-31
**Reviewer:** Oracle (deepseek-v4-pro)
**Brainstorm reviewed:** `planning/brainstorm/2026-07-31T2321_photo-field-on-shopping-list-items.md`
**Ticket:** GROCERUN-14

## Verdict

The brainstorm is well-reasoned on the *product* decisions (capture mechanism,
Dexie blob store, REST/sync split, single photo, public URLs). But it is
materially incomplete on the *mechanics* of how `photoUrl` actually flows
through the existing sync and REST paths, and it contains one conceptual
mismatch with the soft-delete architecture. Several required code touch-points
are invisible in the document. Would not promote to a ticket without addressing
the items below.

---

## 1. Missing Concerns

### 1.1 No mention of the dual item-update path (REST + sync push)

The brainstorm repeatedly claims `photoUrl` "just syncs normally via existing
JSON push/pull" (Q4, Q5) and is "just another string attribute like `note`"
(Q4). But item metadata in this codebase flows through **two** paths, and the
brainstorm names neither:

- **Local-first push:** `useUpdateItem`
  (`apps/web/src/features/lists/hooks/useItems.ts:15`) uses `useRxMutation` →
  writes to RxDB → pushes via `POST /api/v1/sync/item/push`. The push handler
  `pushItems` (`apps/server/src/sync/collections/item-sync.ts:95-106`)
  explicitly persists `name`, `sectionId`, `defaultUnit`, `note` — but **not**
  `photoUrl` (which doesn't exist yet).
- **REST update:** `PATCH /api/v1/items/:id` → `ItemsService.updateItem`
  (`apps/server/src/items/items.service.ts:36-44`) persists `name`, `sectionId`,
  `defaultUnit`, `note` — but **not** `photoUrl`.

The `note` field (the cited precedent from GROCERUN-44) is handled in **both**
paths. To follow that precedent, `photoUrl` must be added to:
1. `item-sync.ts` push handler `data` object (lines 97-105 and 120-128 and
   144-153)
2. `item-sync.ts` `itemToSyncDoc` mapper (lines 177-200) — with the same
   conditional-spread pattern used for `note`
3. `items.service.ts` `updateItem` `data` object (lines 38-43)
4. `UpdateItemSchema` in `apps/_shared/dtos/src/index.ts` (lines 10-16)
5. `useItems.ts` `UpdateItemInput` and `derivePatch` (lines 6-25)

The brainstorm says "No protocol changes" (Q5) — technically true for the wire
format, but misleading because it implies no handler changes are needed. The
handler and mapper changes are required and unmentioned.

### 1.2 No mention of the shared DTO package

Per `wiki/rules/coding-standards.md` rule 2: "Every API endpoint has a Zod DTO
in the shared package — no hand-parsing." The upload endpoint needs a DTO in
`@grocerun/dto`, and `UpdateItemSchema` needs `photoUrl` added. The brainstorm
never references `apps/_shared/dtos/` at all.

### 1.3 No mention of the existing `imageUrl` precedent on Store

`Store.imageUrl` already exists in both Prisma (`schema.prisma:50`) and RxDB
(`schema.ts:256`). The brainstorm doesn't reference this existing
image-URL-on-a-domain-model precedent. Is `imageUrl` on Store actually used?
If so, how is it set, displayed, and lifecycle-managed? If not, it's dead
schema that should inform whether `photoUrl` on Item follows the same pattern
or diverges. Either way, the brainstorm should acknowledge the precedent.

### 1.4 Photo replacement and removal flow is underspecified

Q9 says "Same for photo removal" (as adding) but specifies nothing:
- When a user removes a photo, does the client clear `photoUrl` on the Item doc
  and push? Does the server call `StorageDriver.delete()` for the old file?
- When a user *replaces* a photo, the old file becomes an orphan on the server.
  The brainstorm proposes a janitor for hard-deleted items (Q7) but not for
  photo-replacement orphans.
- The `StorageDriver.delete()` method exists (Q3 lists it) but the brainstorm
  never specifies when it is called outside the hard-delete janitor scenario.

### 1.5 No Cache-Control / content-type headers specified for the media endpoint

Q10 decides public unguessable URLs but specifies only
`Referrer-Policy: no-referrer`. Missing:
- `Cache-Control` headers (public? max-age? immutable? — these URLs are
  permanent per Q10, so `immutable` would be appropriate, but it's not stated).
- `Content-Type` (must be `image/jpeg` or derived from the uploaded file — the
  brainstorm hardcodes `.jpg` in the URL but doesn't specify
  validation/normalization of uploaded formats).
- `X-Content-Type-Options: nosniff` (prevents MIME sniffing of uploaded content
  — important for user-uploaded binary served publicly).

---

## 2. Architectural Misalignment

### 2.1 The hard-delete janitor contradicts the soft-delete-only architecture

Q7 says: "Hard-delete Item: server janitor task deletes photos for hard-deleted
items (photo not associated to any existing item)."

But the codebase **never hard-deletes domain models**.
`wiki/technical-design/soft-delete-cascade.md` states explicitly: "The
application never issues `DELETE FROM` on domain tables." ADR 007 says a
tombstone cleanup job "will eventually be needed... Not required for initial
launch." There is no hard-delete mechanism and no janitor task today.

This means:
- Photos for soft-deleted items will **never** be cleaned up under the current
  architecture. The brainstorm's Q7 cleanup plan references a mechanism that
  doesn't exist.
- The brainstorm should either (a) explicitly accept that photos for
  soft-deleted items accumulate indefinitely (acceptable for v1, but say so),
  or (b) tie photo cleanup to the future tombstone cleanup job (when it
  eventually exists), or (c) propose a photo-specific cleanup that runs when
  items have been soft-deleted beyond the 30-day tombstone window (matching
  `TOMBSTONE_WINDOW_MS` in `sync-helpers.ts`).

### 2.2 ServeStaticModule will intercept the `/media/` route

The brainstorm proposes `GET /media/items/<uuid>.jpg`. But `app.module.ts:31-35`
configures `ServeStaticModule` with `exclude: ['/api/v1/{*path}', '/health']`.
The global prefix is `api/v1` (`main.ts:30-32`). A route at `/media/` would be:
- Intercepted by ServeStaticModule (which tries to serve a file from the SPA
  dist folder), OR
- If the controller is registered with the global prefix, it becomes
  `/api/v1/media/` — which IS excluded from ServeStaticModule but contradicts
  the brainstorm's URL design.

The brainstorm doesn't address this routing conflict. The media endpoint either
needs to live under `/api/v1/media/` (consistent with the global prefix,
excluded from ServeStatic) or the ServeStatic exclude pattern needs updating.
This is a concrete implementation blocker.

### 2.3 No Service Worker exists, but Q5 proposes one for prefetch

Q5 says: "the client must proactively fetch the photoUrl image and cache it
locally (Service Worker cache or Dexie blob store)."

But `wiki/technical-design/offline-persistence.md` explicitly states: "Service
Worker / Cache API: Offline support is IndexedDB-only via Dexie. No Service
Worker cache strategy is used for sync data." There is no Service Worker in the
web app.

The "or Dexie blob store" alternative is the only viable one, but the
brainstorm presents it as a casual either/or. The Dexie blob store from Q2 is
described with `pendingUpload: boolean` for upload-pending blobs.
Downloaded/cached photos are a different record shape (no `pendingUpload`,
keyed by `photoUrl` or `itemId`). The brainstorm doesn't distinguish these
record types or specify the prefetch storage schema.

---

## 3. Tension with Prerequisites (GROCERUN-51, GROCERUN-53)

### 3.1 The StorageDriver interface signature is assumed but not validated

The brainstorm assumes GROCERUN-53 delivers `put`, `get`, `delete`, `url` with
`LocalFsStorageDriver` and `S3StorageDriver`. But:
- The `url()` method's contract is critical: does it return a relative path
  (requiring the server to serve the file) or an absolute URL (presigned S3
  URL)? The brainstorm's Q10 public-URL design depends on `url()` returning a
  path that the NestJS server can serve via a media controller. If GROCERUN-53's
  `url()` returns something else, the media endpoint design needs adjustment.
- The `put()` method's contract: does it accept a `Buffer` or a `Stream`? The
  multipart upload handler needs to pipe the file to `put()`. This interface
  detail affects the upload controller implementation.
- The brainstorm should note these as assumptions to validate against
  GROCERUN-53's actual interface when it lands, rather than treating
  GROCERUN-53 as a black box.

### 3.2 ConfigService (GROCERUN-51) must deliver `STORAGE_DRIVER` and storage path config

The brainstorm says `STORAGE_DRIVER=local|s3` config swap. But it doesn't
enumerate the config variables that GROCERUN-51's validated ConfigService must
provide:
- `STORAGE_DRIVER` (selector)
- `STORAGE_LOCAL_FS_PATH` (filesystem root for `LocalFsStorageDriver`)
- `STORAGE_BASE_URL` or similar (for constructing public URLs)
- Possibly `STORAGE_S3_BUCKET`, `STORAGE_S3_REGION`, etc. for the stubbed S3
  driver

GROCERUN-51 is a prerequisite but the brainstorm doesn't list the config
surface it depends on. This risks GROCERUN-51 being closed without the storage
config, blocking GROCERUN-14.

---

## 4. Implementation Blind Spots

### 4.1 RxDB schema version bump: no migration strategy stated

Q2 says "Just add `photoUrl?: string` to itemSchema (version bump)." The schema
file's own comment (`schema.ts:5-6`) says: "bump `version` when fields change
and provide a migration strategy." The brainstorm provides no migration
strategy.

Adding an optional field to a JSON schema is generally safe (existing documents
without the field remain valid), but RxDB requires a migration function when
the version bumps. The brainstorm should specify:
- New version number (1).
- Migration function: no-op (or explicitly set `photoUrl: undefined` for
  existing docs).
- Whether the `replicationIdentifier` needs to change (it shouldn't — the
  replication identifier is separate from schema version, but this should be
  stated).

### 4.2 Prisma migration not mentioned

Adding `photoUrl String?` to the Item model requires a Prisma migration
(`npx prisma migrate dev --name add-item-photo-url`). The brainstorm describes
the current Item schema in detail (lines 53-58) but never mentions the
migration. Per `wiki/rules/prisma.md` rule 7: "All schema changes go through
`npx prisma migrate dev`." This is a straightforward additive migration
(nullable column) but it's a required step that's invisible in the brainstorm.

### 4.3 Document-level server-wins conflict resolution can silently drop photoUrl

ADR 007 Decision 2 establishes **server-wins** as the conflict strategy: "If the
server state has changed since then, the server rejects the push and sends back
the current state. The client silently adopts the server's version." This is
**document-level**, not field-level (ADR 007 explicitly rejected field-level
merge as "complex to implement and test. Overkill for grocery list data").

The brainstorm Q4 rejects `photoThumbnail` partly because of "Conflict surface"
— but the same conflict surface applies to `photoUrl`. Scenario:

1. Member A captures a photo, uploads it, patches the item with `photoUrl`.
   Pushes.
2. Concurrently, Member B edits the item's `note` field. Pushes.
3. One push wins (server-wins). The other is rejected — the client adopts the
   server's version.
4. If B's push wins, A's `photoUrl` is silently lost. The photo file is
   orphaned on the server (uploaded but no item references it).

The brainstorm doesn't acknowledge this. With document-level server-wins, **any
concurrent edit to an item with a photo can silently drop the photoUrl and
orphan the file**. This is the same severity as losing a `note` edit (which ADR
007 accepts as "low severity"), but the difference is that losing `photoUrl`
also orphans a binary file on the server with no cleanup path. The brainstorm
should at minimum acknowledge this as an accepted trade-off consistent with ADR
007, and note the orphaned-file implication.

### 4.4 Multipart body size limit not addressed

The brainstorm mentions ~200KB compressed photos and multipart upload.
NestJS/Express default body size limits may reject this. `main.ts` sets no body
size limit, and no multer/FileInterceptor configuration is mentioned. The
brainstorm should specify the max upload size (e.g., 5MB to allow for
less-aggressive compression) and note that the upload controller needs
`@UseInterceptors(FileInterceptor(...))` with an explicit `limits` config.

### 4.5 Prefetch trigger point unspecified

Q5 says "When items are loaded/synced, the client must proactively fetch the
photoUrl image." But where does this prefetch logic live? Options:
- In the RxDB pull handler (after receiving documents, fetch images) — but the
  pull handler is in `database.ts` and shouldn't have image-fetching concerns.
- In a React effect watching the item query results — but this runs
  per-component-mount, not per-sync.
- In a dedicated background service — but the brainstorm doesn't propose one.

The brainstorm doesn't specify the prefetch trigger, error handling (404 for
deleted photos, network failures, quota), or how the prefetched blobs are
associated with items for display in the popover.

### 4.6 Dexie blob store schema is underspecified for the download-cache use case

Q2 describes the Dexie blob store with `pendingUpload: boolean` — a single
record shape for upload-pending blobs. But the store must also hold:
- **Downloaded/cached photos** (from prefetch or from other members' uploads) —
  these have no `pendingUpload`, are keyed by `itemId` or `photoUrl`, and need
  a different lifecycle.
- **Upload-pending photos** — `pendingUpload: true`, keyed by `itemId`.

The brainstorm doesn't distinguish these record types or specify the Dexie
schema (table name, indexes, fields). The orphan cleanup ("delete Dexie blobs
whose itemId no longer exists in RxDB") needs to handle both types, and the "no
longer exists" check needs to account for soft-deleted items (which still exist
in RxDB as tombstones with `_deleted: true`).

---

## 5. Things That Would Make Me Uncomfortable Shipping As Designed

### 5.1 The public-URL security model is stated but not fully bounded

Q10's public unguessable URLs are a reasonable KISS choice for product photos.
But the brainstorm underweights the permanence problem:
- URLs are "permanent unless explicitly rotated" — but there is **no rotation
  mechanism** in v1. If a URL leaks, it works forever.
- The URL is stored in every household member's local RxDB database (it syncs
  as `photoUrl`). If a member leaves the household,
  `removeHouseholdSubtreeFromLocalDb` clears their local DB — but any URL they
  saw before leaving works forever.
- `Referrer-Policy: no-referrer` prevents referrer leakage but not browser
  history, bookmarks, screenshots, or shared-device access.

This is probably acceptable for product photos (not sensitive data), but the
brainstorm should state the threat model explicitly: "We accept that leaked
photo URLs are permanent and irrevocable in v1. Product photos are not
sensitive. Rotation is a future ticket." The current "Acceptable for v1 given
the data sensitivity level" is too vague.

### 5.2 No acceptance criteria or test plan

The brainstorm has no testing section. Per `wiki/rules/coding-standards.md` §4
and `wiki/rules/testing-standards.md`, features need defined test scenarios.
For this feature, the critical scenarios are:
- Offline capture → reconnect → upload → sync → other client sees photo.
- Concurrent edit conflict: photo set + note edited simultaneously — what's the
  expected outcome?
- Photo prefetch for shopping mode: enter offline → open popover → photo
  displays.
- Soft-delete item with photo: photo file persists (no cleanup), no error.
- Photo replacement: old file orphaned (accepted) or cleaned (needs mechanism).

The brainstorm should list these as acceptance criteria before promotion to a
ticket.

---

## Summary: Required Before Promotion

| # | Issue | Severity | Action |
|---|-------|----------|--------|
| 1 | Dual item-update path (push + REST) not addressed | **High** | ~~Enumerate all 5 code touch-points~~ **Revised after code investigation:** REST `PATCH /api/v1/items/:id` is dead code — web client never calls it (only ref is in deleted `scripts/verify-gro-11.ts`). Real touch-points are sync-only: `item-sync.ts` push handler + mapper, `UpdateItemSchema` in shared DTO, `useItems.ts` derivePatch, RxDB `itemSchema`. **Add code cleanup:** remove dead REST `updateItem` endpoint + `items.service.ts` `updateItem` method + stale header comment in `item-sync.ts` line 7 ("Item metadata updates go through REST") |
| 2 | Hard-delete janitor contradicts soft-delete-only architecture | **High** | ~~Replace with soft-delete-aligned cleanup~~ **Resolved:** GROCERUN-60 created for tombstone cleanup job (permanent delete of stale soft-deleted records + photo file cleanup). GROCERUN-14 v1 accepts indefinite photo accumulation for soft-deleted items. Photo cleanup deferred to GROCERUN-60. |
| 3 | ServeStaticModule intercepts `/media/` route | **High** | ~~Place media under `/api/v1/media/`~~ **Resolved:** Media served via NestJS controller at `/api/v1/media/items/:filename`. StorageDriver `url()` is the abstraction point: `LocalFsStorageDriver.url()` returns `/api/v1/media/items/<uuid>.jpg` (controller streams file), `S3StorageDriver.url()` returns presigned S3 URL (client fetches directly). Client never knows which driver is active — just fetches whatever URL `photoUrl` contains. Consistent with global prefix, avoids ServeStaticModule conflict, and seamless driver swap. |
| 4 | No Service Worker exists; Q5 proposes one | **Medium** | **Auto-resolved:** Drop SW mention. Codebase explicitly decided no SW (`offline-persistence.md`). Dexie blob store is the only prefetch mechanism. |
| 5 | RxDB schema migration strategy unspecified | **Medium** | **Auto-resolved:** Version 0 → 1, no-op migration (optional field, existing docs remain valid). `replicationIdentifier` unchanged. Standard RxDB practice. |
| 6 | Prisma migration not mentioned | **Medium** | **Auto-resolved:** `npx prisma migrate dev --name add-item-photo-url`. Required step, not a design decision. |
| 7 | Document-level conflict can silently drop photoUrl + orphan file | **Medium** | **Auto-resolved:** ADR 007 server-wins already accepted for all item fields. Orphaned file handled by GROCERUN-60 (tombstone cleanup). Same severity as losing a `note` edit. Accepted trade-off. |
| 8 | Shared DTO (`@grocerun/dto`) not mentioned | **Medium** | **Auto-resolved:** Add `photoUrl: z.string().optional()` to `UpdateItemSchema`. Upload endpoint gets a DTO. Implementation detail, follows `note` precedent. |
| 9 | StorageDriver interface assumptions unvalidated | **Medium** | **Auto-resolved:** Resolved by item #3 decision. `url()` returns a fetchable URL (local: controller path, S3: presigned). `put()` accepts Buffer. Validate against GROCERUN-53 when it lands. |
| 10 | ConfigService config surface not enumerated | **Medium** | **Auto-resolved:** Required env vars: `STORAGE_DRIVER`, `STORAGE_LOCAL_FS_PATH`, `STORAGE_BASE_URL`. Add to GROCERUN-51 scope. Not a GROCERUN-14 design decision. |
| 11 | Multipart body size limit not addressed | **Low** | **Auto-resolved:** 5MB max upload size. `FileInterceptor` with explicit `limits` config. Reasonable default for photo uploads. |
| 12 | Prefetch trigger point and error handling unspecified | **Low** | **Resolved — JIT prefetch on list component mount:** When a shopping list component mounts, a React effect prefetches all `photoUrl` images for items on that active list into Dexie. The JIT moment is "user is about to go shopping" = list view. Covers the real offline scenario. **Cache eviction (list-scoped, event-driven):** (1) When a list is archived/deleted, evict cached photos for items only on that list (check if item is on other active lists first). (2) When an item is removed from a list, evict from cache (same check). Both are cheap RxDB queries + Dexie deletes. No background scanning. Orphan cleanup on startup still applies (items hard-deleted or household removed). |
| 13 | Dexie blob store schema underspecified (upload vs cache records) | **Low** | **Auto-resolved:** Two record types: upload-pending (`pendingUpload: true`, keyed by `itemId`) and downloaded-cache (`pendingUpload: false`, keyed by `itemId` or `photoUrl`). Obvious schema, implementation detail. |
| 14 | Photo replacement/removal flow unspecified | **Low** | **Resolved — Option B:** Sync push handler deletes old photo immediately on replacement. The handler already fetches `current` (line 68: `findUnique`). If `current.photoUrl` exists and differs from incoming `photoUrl` (or incoming is absent), call `StorageDriver.delete()` on the old file before applying the update. Tombstone cleanup (GROCERUN-60) handles the separate case of photos on soft-deleted items — those have `photoUrl` still set on the record, so deferral is correct there. Photo replacement is a live edit where the old URL is known at execution time, so immediate deletion avoids orphans. |
| 15 | No Cache-Control / nosniff headers for media endpoint | **Low** | **Auto-resolved:** `Cache-Control: public, max-age=31536000, immutable` (URLs are permanent per Q10). `X-Content-Type-Options: nosniff`. `Content-Type: image/jpeg` (or derived from upload). Standard for permanent public URLs. |
| 16 | No test plan / acceptance criteria | **Low** | **Auto-resolved:** Belongs in the ticket, not the brainstorm. Critical scenarios: offline capture → upload → sync → other client sees photo; concurrent edit conflict; prefetch for shopping mode; soft-delete with photo; photo replacement. |
| 17 | `imageUrl` on Store precedent not referenced | **Low** | **Auto-resolved:** `imageUrl` on Store is actively used (Prisma, RxDB, DTOs, sync handlers, web client). Follows exact same pattern: string field, conditional spread in sync mapper, REST CRUD. `photoUrl` on Item follows this precedent. Validates the approach. |

Items 1-3 are blockers — the brainstorm's core claims ("just syncs normally",
"janitor cleans hard-deleted", `GET /media/...`) are either mechanically
incomplete or architecturally contradictory. The rest are refinements that
would make the ticket implementation-ready.