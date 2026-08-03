# Brainstorm: Photo field on shopping list items

**Status:** exploring
**Date:** 2026-07-31
**Source:** GROCERUN-14 (Plane ticket, id fbb5d9bb)

## Problem Framing

Shopping list items currently have a name, store, section, unit, purchase count,
and a free-text note (GROCERUN-44, done). Users want to attach a photo to an item
so they can visually identify a product at the store — e.g. "the blue box" or
"this specific brand". The photo must work offline (captured locally, displayed
optimistically) and sync to other household members when online.

## Goals

- User can attach a single photo to a shopping list item (the Item entity, not
  ListItem — photo is a product attribute, not a list-instance attribute).
- Photo capture works on mobile PWA (iOS Safari + Chrome Android) and desktop.
- Offline-first: photo is captured, compressed, and displayed locally even with
  no connectivity. Upload to server happens when connectivity returns.
- Other household members see the photo after sync.
- Server stores photos on filesystem (local driver) with a clean seam for future
  S3 swap.
- No new heavy dependencies. "The best dependency is no dependency."

## Non-Goals

- Multiple photos per item (v1 is single photo; multiple = future ticket).
- Live camera viewfinder (`getUserMedia` stream). The native file input capture
  is sufficient for v1.
- Server-side thumbnail generation. Client compresses to one size; CSS handles
  display sizing.
- OCR / receipt scanning (that is GROCERUN-24, a separate horizon ticket).
- Store-decoupling (intake #9). Photo on Item is decoupling-safe — see
  "Decoupling safety" below.

## Existing Context

### Relevant tickets

| Ticket | Name | State | Role |
|--------|------|-------|------|
| GROCERUN-14 | Photo field on shopping list items | Backlog | **This ticket** |
| GROCERUN-44 | Free-text comment field on shopping list items | Done | Predecessor — same Item entity, same edit dialog |
| GROCERUN-51 | Validated ConfigService | Backlog | Prerequisite — provides validated config that 53 reads |
| GROCERUN-53 | Driver seams: DB_DRIVER + STORAGE_DRIVER | Backlog | Prerequisite — provides StorageDriver interface |
| GROCERUN-29 | Media capture capability (PWA camera + photo picker) | Backlog | Infrastructure — not a dependency for 14; native input suffices |
| GROCERUN-24 | Receipt photo → OCR → item matching | Backlog | Horizon — separate feature |

Dependency chain: `GROCERUN-51 → GROCERUN-53 → GROCERUN-14`

### Current Item schema (Prisma)

`apps/server/prisma/schema.prisma:81-104` — Item model has: id, name, storeId,
sectionId?, createdAt, updatedAt, deleted, deletedAt, purchaseCount,
lastPurchased?, defaultUnit?, note?, listItems[]. Unique:
`@@unique([storeId, name, deleted])`.

### Current Item schema (RxDB)

`apps/web/src/core/rxdb/schema.ts:75-118` — itemSchema has: id, name, storeId,
sectionId, defaultUnit, note, purchaseCount, lastPurchased, updatedAt. Required:
id, name, storeId, purchaseCount, updatedAt. Indexes: storeId, updatedAt.
Version 0.

### Sync architecture

- 6 RxDB collections: households, stores, sections, items, lists, listItems.
- Local-first (push-enabled): item, listItem. Server-authoritative (pull-only):
  section, list, store, household.
- Sync protocol is **JSON-only** (pull/push handlers send/receive JSON
  documents). Binary cannot go through sync channel without protocol change.
- Push handlers must return conflict documents, not throw.
- Client-generated IDs via `newLocalId()` (cuid2).
- SSE for real-time resync; 5s polling fallback.
- Production quality rule: "No full-resolution images in list views" —
  responsive images, srcSet, lazy loading.

### No storage infrastructure exists yet

- No S3, no multer, no upload endpoint in the server.
- `ServeStaticModule` serves only the Vite-built SPA.
- No STORAGE_DRIVER or S3 env vars.
- GROCERUN-53 will provide the StorageDriver interface
  (`put`, `get`, `delete`, `url`) with `LocalFsStorageDriver` implemented and
  `S3StorageDriver` stubbed. `STORAGE_DRIVER=local|s3` config swap, same as
  `DB_DRIVER`.

### Decoupling safety

Intake #9 (2026-06-15) calls for per-household item catalog (items scoped to
household, not store). Photo is a pure attribute of the product. If implemented
on the current store-scoped Item with no storeId coupling in the photo layer
(storage path keyed by itemId, upload endpoint keyed by itemId), the rework
during decoupling is near-zero — the photo field follows the entity through
migration. Photo on Item is self-contained and decoupling-safe.

## Options Considered

### Q1: Photo source (capture mechanism) — CLOSED

**Decision:** `<input type="file" accept="image/*" capture="environment">`

- Chrome Android: opens rear camera directly.
- iOS Safari: shows action sheet (Take Photo / Choose from Library).
- Desktop: standard file picker (capture attribute ignored).
- `getUserMedia` live camera is NOT needed for v1. If needed later, define a
  separate ticket. GROCERUN-29 (media capture capability) can be deferred or
  scoped down — 14 does not depend on 29.
- Image Capture API (`takePhoto()`) is NOT supported on iOS — ruled out.

**Client-side compression:** `browser-image-compression` (~12KB gzipped).
Handles iOS EXIF orientation issues and Safari File constructor bugs. Web Worker
support for non-blocking compression.

**Testing iOS without Xcode:**
- BrowserStack/LambdaTest for iterative dev (real iOS Safari, fast cycle).
- Safari macOS Responsive Design Mode for quick layout checks (free, not real
  device).
- Real iPhone for final sign-off.
- Xcode iOS Simulator as last resort.

### Q2: Local storage (offline blob storage) — CLOSED

**Decision: Separate Dexie blob store**

A separate Dexie database (`grocerun-blobs`) alongside RxDB.

- **JSON-only sync stays clean** — `photoUrl` is just a string field on the Item
  doc that syncs normally. No attachment replication config, no `_attachments`
  metadata leaking through sync.
- **Upload retry is straightforward** — Dexie blob record has
  `pendingUpload: boolean`. When online, query
  `where('pendingUpload').equals(1)`, upload each, clear flag.
- **No RxDB schema complexity** — Just add `photoUrl?: string` to itemSchema
  (version bump). No `attachments: {}` feature, no replication config changes.
- **Dexie is ~15KB gzipped** — minimal dependency footprint.
- **Orphan cleanup is manual but simple** — on startup, delete Dexie blobs whose
  itemId no longer exists in RxDB.

**Alternative: RxDB attachments** (rejected for v1)

- Can disable attachment replication (`attachments: false` in replication config)
  so blobs stay local-only.
- But: cannot efficiently query "documents with attachments" (`_attachments` is
  not indexed). Would need a separate boolean field anyway.
- More complex for no real gain in our use case.
- Automatic cleanup on document delete is a plus, but manual cleanup is trivial.

**Offline → online flow (with Dexie):**

1. Capture photo → compress client-side → store blob in Dexie
   (`pendingUpload: true`).
2. Upload blob to server via REST → server returns `photoUrl`.
3. Patch Item doc with `photoUrl` → syncs normally to other clients.
4. Other clients see `photoUrl` and fetch image from server.

No partial states. `photoUrl` is either set (photo on server) or absent (no
photo / pending upload).

### Q3: Server storage — CLOSED

**Decision:** Flat file on local filesystem via StorageDriver interface

- **SQLite for binary: ruled out** — 1GB row limit, slower reads, backup bloat,
  WAL contention.
- **Flat file on local filesystem** as first implementation. DB stores
  `photoUrl` string; binary lives on filesystem.
- **StorageDriver interface** (in-house, 4 methods: `put`, `get`, `delete`,
  `url`) with `LocalFsStorageDriver` implemented (Node `fs`, zero deps) and
  `S3StorageDriver` stubbed. Matches existing `DB_DRIVER=sqlite|postgres`
  pattern.
- `STORAGE_DRIVER=local|s3` config swap — same as `DB_DRIVER`.
- Already ticketed as GROCERUN-53. GROCERUN-14 depends on GROCERUN-53, which
  depends on GROCERUN-51 (validated ConfigService).

## Q4: Upload transport — CLOSED

**Decision: REST-only upload (multipart). No `photoThumbnail` field. Just
`photoUrl?: string` on the item doc.**

**Multipart vs base64:** Multipart is the obvious choice. Base64 adds 33%
overhead for zero benefit on a ~200KB binary.

**Thumbnail-via-sync (base64 in JSON) — rejected:**

The idea was to extract a thumbnail (~2-10KB) on-device, base64-encode it, and
store it as `photoThumbnail: string` on the Item document so it syncs through
the JSON-only channel. The full photo would upload via REST.

Rejected because:
- **Over-engineering given Q6 display decision.** The thumbnail only shows in an
  on-demand popover, not the list row. Paying a permanent per-item memory tax
  (base64 strings loaded on every document read) to optimize a popover's first
  paint isn't worth it.
- **Permanent per-read memory cost.** A base64 string field is loaded into memory
  on every document read, regardless of whether the popover is ever opened. 50
  items × ~13KB = ~650KB of strings resident during ordinary list rendering.
- **Sync payload bloat on unrelated edits.** The thumbnail is effectively
  immutable after first capture, but gets re-transmitted on every revision that
  touches any field (name edit, note edit, purchaseCount bump).
- **Conflict surface.** `photoThumbnail` becomes another field in field-level
  conflict resolution for no strong gain.

**The REST/sync split is deliberate and correct, not incidental:**

- Item *data* (including the `photoUrl` string) syncs via JSON — that's the clean
  separation.
- Binary *assets* upload via REST and are referenced by URL.
- This is how every offline-first app with media works. The "tension" is a false
  tension — `photoUrl` is just another string attribute like `note` or
  `defaultUnit`.

**Revisit thumbnail-via-sync only if both:** (a) thumbnail returns to the list
row, AND (b) cross-member offline thumbnail becomes a real requirement.

## Q5: Sync propagation — CLOSED

**Decision: `photoUrl` string syncs normally via existing JSON push/pull. No
protocol changes.**

- `photoUrl` is either set (photo on server) or absent (no photo / pending
  upload). No partial states.
- Other household members see a placeholder in the popover until `photoUrl`
  syncs (seconds to minutes, only in the popover).
- The capturer sees their own photo immediately from the local Dexie blob
  (Q2) — true offline-first for the person who took it.

**Offline prefetch for shopping mode (JIT):**

When a shopping list component mounts, a React effect prefetches all `photoUrl`
images for items on that active list into the Dexie blob store. The JIT moment is
"user is about to go shopping" — they open the list, they have connectivity,
photos get cached. When they go offline at the store, photos are already local.

No Service Worker (codebase explicitly decided no SW — see
`offline-persistence.md`). Dexie blob store is the only cache mechanism.

**Cache eviction (list-scoped, event-driven):**

- **List archived/deleted:** evict cached photos for items only on that list.
  Check if item is on other active lists before evicting — don't evict if still
  referenced.
- **Item removed from a list:** evict from cache (same check — don't evict if
  item is still on another active list).
- Both are cheap RxDB queries + Dexie deletes. No background scanning.
- **Startup orphan cleanup:** delete Dexie blobs whose itemId no longer exists
  in RxDB (item hard-deleted or household removed).

This is a "prefetch for offline" step, not a sync change. The image is fetched
via REST when online and cached for offline use.

## Q6: Display — CLOSED

Keep the current comment icon (MessageCircle). The popover tooltip now includes
a photo if there is one. Simple, effective. No separate thumbnail in the list
row.

## Q7: Lifecycle — CLOSED

- **Soft-delete Item:** photo stays on server (consistent with soft-delete
  pattern). No cleanup in v1.
- **Hard-delete Item:** deferred to GROCERUN-60 (tombstone cleanup job). v1
  accepts indefinite photo accumulation for soft-deleted items.
- **Photo replacement:** sync push handler deletes old photo immediately via
  `StorageDriver.delete()` (old `photoUrl` known at execution time from
  `current` record).
- **Local blob store:** orphan cleanup on startup — delete Dexie blobs whose
  itemId no longer exists in RxDB. List-scoped eviction on list archive/delete
  and item removal from list (see Q5 cache eviction).

## Q8: Single vs multiple photos — CLOSED

Single photo for v1. Multiple photos = future ticket.

## Q9: Permissions — CLOSED

Anyone who has authority to create items and add them to lists today can add
comments (text or photo). Same for photo removal. KISS — not sensitive data.

## Q10: Media endpoint auth — CLOSED

**Decision: Public unguessable URLs**

`GET /api/v1/media/items/<uuid>.jpg` — no auth. Server generates a random
unguessable path (cuid2). The URL is stored as `photoUrl` on the item doc and
syncs to other clients.

**Serving mechanism:** NestJS controller at `/api/v1/media/` streams files via
`StorageDriver.get()`. The StorageDriver `url()` method is the abstraction
point:
- `LocalFsStorageDriver.url()` → `/api/v1/media/items/<uuid>.jpg` (controller
  reads from filesystem and streams back)
- `S3StorageDriver.url()` → presigned S3 URL (client fetches directly from S3,
  controller not involved)

The client never knows which driver is active — it just fetches whatever URL
`photoUrl` contains. This is consistent with the global prefix, avoids the
ServeStaticModule conflict, and makes the driver swap seamless.

**Rationale:**
- KISS — not sensitive data (product photos, not medical records).
- Plain `<img src={photoUrl}>` works everywhere — no auth headers, no blob URL
  conversion, no memory overhead.
- Service Worker caching is trivial (standard HTTP cache, no 401 handling).
- Offline prefetch is just a standard image fetch — no token management.
- Future-proofs a planned list public sharing feature — shared lists would need
  to share photos, and JWT auth would block that.
- Works with CDN out of the box (future S3 presigned URLs).

**Mitigations:**
- `Referrer-Policy: no-referrer` header to prevent URL leakage via referrer.
- URLs are permanent unless explicitly rotated. No built-in expiry in v1.
- Revocation gap: if a user leaves a household, their cached URLs still work.
  Acceptable for v1 given the data sensitivity level. Revisit if needed.

## Open Questions

None.

## Recommendation / Current Leaning

- Q1: `<input type="file" accept="image/*" capture="environment">` +
  `browser-image-compression`. **Closed.**
- Q2: Separate Dexie blob store. **Closed.**
- Q3: Flat file on local FS via StorageDriver interface (GROCERUN-53).
  **Closed.**
- Q4: REST-only upload (multipart), `photoUrl?: string` only. No thumbnail field.
  **Closed.**
- Q5: `photoUrl` syncs via JSON. Offline prefetch for shopping mode. **Closed.**
- Q6: Keep comment icon, popover includes photo. **Closed.**
- Q7: Soft-delete keeps photo, janitor cleans hard-deleted. **Closed.**
- Q8: Single photo for v1. **Closed.**
- Q9: Any item editor can add/remove photo. **Closed.**
- Q10: Public unguessable URLs, no auth. **Closed.**

## Promotion Decision

- **Ready to promote** — All questions resolved. Promote to full GROCERUN-14
  ticket description.