# Ticket: GROCERUN-14 — Photo field on shopping list items

**Status:** planned
**Source:** `planning/brainstorm/2026-07-31T2321_photo-field-on-shopping-list-items.md` (promoted), GROCERUN-14 (Plane, id fbb5d9bb)
**Branch:** (set once started)

## Background

Shopping list items have a name, store, section, unit, purchase count, and a
free-text note (GROCERUN-44, done). Users want to attach a single photo to an
item so they can visually identify a product in-store ("the blue box"). The
photo is a product attribute on the **Item** entity (not ListItem). It must work
offline (captured locally, displayed optimistically) and sync to other household
members when online.

## User-Facing Goal

A user can attach, replace, or remove one photo per item from the item edit
dialog. The photo appears in the item's comment popover for every household
member once synced. Capture works on mobile PWA (iOS Safari + Chrome Android)
and desktop, with or without connectivity.

## Acceptance Criteria

1. Item gains an optional `photoUrl`; a single photo can be attached via
   `<input type="file" accept="image/*" capture="environment">`, compressed
   client-side, and stored locally (Dexie blob store) with `pendingUpload: true`.
2. Offline-first: the capturer sees their own photo immediately from the local
   blob (no network); the upload runs when connectivity returns and is retried
   idempotently using a client-generated storage key.
3. Once uploaded and synced, other household members see the photo in the item's
   comment popover. Until then they see a placeholder.
4. The upload endpoint (`POST /api/v1/media/items/:itemId`) is authenticated and
   store-access-checked (`verifyStoreAccess`) so a household cannot overwrite
   another household's photo.
5. Media reads (`GET /api/v1/media/items/:key.jpg`) are unauthenticated with
   unguessable client-generated keys, served via a NestJS controller over
   `StorageDriver.get()`. Headers: `Referrer-Policy: no-referrer`,
   `X-Content-Type-Options: nosniff`, `Cache-Control: public, max-age=31536000,
   immutable`, `Content-Type: image/jpeg`.
6. Replacing or removing a photo deletes the previous file immediately
   (`StorageDriver.delete()` from the sync push handler); removal is a
   `photoUrl → null` sync patch — no REST DELETE endpoint in v1.
7. RxDB `itemSchema` is bumped 0 → 1 with a no-op migration; `photoUrl` is an
   optional string and syncs through the existing JSON push/pull with no protocol
   changes.
8. Server stores photos on the local filesystem via an in-house `StorageDriver`
   interface (`put`/`get`/`delete`/`url`) with `LocalFsStorageDriver`
   implemented and `S3StorageDriver` stubbed. `STORAGE_DRIVER=local|s3` config
   swap mirrors `DB_DRIVER`.
9. The comment popover shows the photo when present (click-to-toggle, not
   hover-open). No thumbnail in the list row.
10. Deferred (NOT in this ticket): JIT offline prefetch + list-scoped cache
    eviction, Service Worker, server-side thumbnails, multiple photos,
    hard-delete cleanup (GROCERUN-60), S3 production driver.
11. Cleanup (separate commit in-branch): remove dead REST `updateItem` endpoint
    + `items.service.updateItem` + stale item-sync.ts:7 header comment.

## Scope

**Web**
- `apps/web/src/core/rxdb/schema.ts`: `photoUrl?` on itemSchema, version 0 → 1
  no-op migration, DB name unchanged.
- `apps/web/src/core/lib/api.ts`: multipart `postFormData`/`uploadImage` helper
  reusing the token resolution + 401-refresh-retry contract (api.ts is currently
  JSON-only).
- New Dexie blob store (`grocerun-blobs`) alongside RxDB: records keyed by
  `itemId` with `pendingUpload` flag; upload-on-reconnect loop; startup orphan
  cleanup (delete blobs whose itemId no longer exists in RxDB); cache-on-read
  with a size/quota cap.
- New capture/compress util: `browser-image-compression` (~12KB gzip, new dep —
  handles iOS EXIF orientation + Safari File constructor bugs; Web Worker mode);
  output pinned to JPEG.
- Client generates the storage key at capture (UUID), stores it on the blob
  record, and reuses it on retry.
- `apps/web/src/features/lists/hooks/useItems.ts`: `useUpdateItem` derivePatch
  adds one conditional `photoUrl` line.
- `EditItemDialog.tsx`: photo attach/replace/remove control, following the
  `key={editingItem.id}` remount pattern (do NOT reintroduce the GROCERUN-44 H2
  `useEffect([item])` reset bug).
- `ListItemRow.tsx`: popover displays photo when `photoUrl` present; convert
  popover to click-to-toggle (fixes inherited GROCERUN-44 M1 hover bug).

**Server**
- `apps/server/prisma/schema.prisma`: `photoUrl String?` on Item +
  `npx prisma migrate dev --name add-item-photo-url` (additive nullable column).
- New `media` controller: `POST /api/v1/media/items/:itemId` (multipart upload,
  authenticated, store-access-checked, MIME-sniffed server-side, 5MB limit) and
  `GET /api/v1/media/items/:key.jpg` (streams via StorageDriver).
- New storage module: `StorageDriver` interface + `LocalFsStorageDriver`
  (Node `fs`, zero deps); `S3StorageDriver` stubbed. `LocalFs.url()` returns a
  RELATIVE `/api/v1/media/items/<key>.jpg`; S3.url() would be absolute presigned.
- `apps/server/src/sync/collections/item-sync.ts`: `itemToSyncDoc` conditional
  spread for `photoUrl`; add `photoUrl` to the 3 update/create data objects;
  on replacement/removal, when `current.photoUrl` exists and differs from
  incoming, call `StorageDriver.delete()`; `normalizePhotoUrl` (trim → null)
  mirroring `normalizeNote`.
- Config: `STORAGE_DRIVER`, `STORAGE_LOCAL_FS_PATH` (via GROCERUN-51 validated
  ConfigService). Drop `STORAGE_BASE_URL` — local URLs are relative.

**Shared**
- `apps/_shared/dtos/src/index.ts`: `UpdateItemSchema` gains
  `photoUrl: z.string().optional()` (mirrors `UpdateStoreSchema.imageUrl`);
  upload endpoint response DTO `{ photoUrl }`.

## Non-Scope

- Multiple photos per item (future ticket).
- Live camera viewfinder (`getUserMedia`), Image Capture API.
- Server-side thumbnail generation.
- OCR / receipt scanning (GROCERUN-24).
- Service Worker caching (codebase decision — Dexie blob store is the only cache).
- JIT offline prefetch + list-scoped event-driven cache eviction (v1.1 candidate;
  cache-on-read with size cap is sufficient for v1).
- S3 production driver (stub only).
- Hard-delete photo cleanup (GROCERUN-60 tombstone cleanup job).
- REST media DELETE endpoint (removal flows through sync push).
- Store-decoupling (intake #9) — photo on Item is decoupling-safe by design.

## Relevant Context

- **ADRs:** 007 (server-wins, document-level conflict — a dropped `photoUrl` on
  conflict has the same cost as a lost `note` edit; accepted), 001 (REST + Zod
  validation at all API boundaries).
- **Technical designs:** `offline-persistence.md` (IndexedDB-only via Dexie, NO
  Service Worker — authoritative; Dexie blob store is the only cache),
  `rxdb-sync-protocol.md` (push handler shape: must return conflict docs, not
  throw; `assumedMasterState.updatedAt` vs current exact-ms compare;
  TOMBSTONE_WINDOW_MS = 30 days).
- **Rules:** `coding-standards.md` (soft-delete all domain models, Zod at every
  boundary, no heavy deps), `production-quality.md` ("no full-resolution images
  in list views" — thumbnail only in on-demand popover, satisfied by v1 design).
- **Precedent:** `Store.imageUrl` is a fully-wired string-URL-on-domain-model
  (Prisma → RxDB → DTO → sync handler → web client) — `photoUrl` follows the
  exact same pattern. GROCERUN-44 review flagged M1 (popover hover closes before
  readable) and H2 (dialog `useEffect([item])` reset bug) — both addressed here.
- **Dependency chain:** GROCERUN-51 (validated ConfigService) → GROCERUN-53
  (StorageDriver interface) → GROCERUN-14. If 51/53 land first, consume them; do
  NOT let the S3 stub delay this ticket — ship the interface + local driver.

## Affected Areas

- `apps/server/prisma/schema.prisma` + migration
- `apps/server/src/media/*` (new), `apps/server/src/storage/*` (new)
- `apps/server/src/sync/collections/item-sync.ts`
- `apps/server/src/items/*` (REST `updateItem` removal)
- `apps/web/src/core/rxdb/schema.ts`
- `apps/web/src/core/lib/api.ts`
- `apps/web/src/features/lists/hooks/useItems.ts`
- `apps/web/src/features/lists/components/ListItemRow.tsx`, `EditItemDialog.tsx`
- New web blob-store module + compression util
- `apps/_shared/dtos/src/index.ts`

## Implementation Outline

1. **Foundation:** Prisma `photoUrl` + migration; StorageDriver interface +
   `LocalFsStorageDriver` (+ `STORAGE_DRIVER`/`STORAGE_LOCAL_FS_PATH` config);
   shared DTO updates (`UpdateItemSchema.photoUrl`, upload response DTO).
2. **Sync:** `item-sync.ts` — `photoUrl` in mapper + update/create objects +
   delete-on-replace/remove via `current.photoUrl`; `normalizePhotoUrl`.
3. **Server media controller:** upload (auth + verifyStoreAccess + MIME sniff +
   5MB limit) and GET (stream via driver + security headers). Relative URL from
   `LocalFs.url()`.
4. **Web data layer:** RxDB schema 0→1 no-op migration; Dexie blob store
   (pendingUpload records, upload loop, startup orphan cleanup, cache-on-read
   size cap); api.ts multipart helper.
5. **Web UI:** capture/compress util (browser-image-compression, JPEG, client
   UUID key); EditItemDialog photo control; ListItemRow popover photo display +
   click-to-toggle.
6. **Cleanup (separate commit):** dead REST `updateItem` + `items.service`
   method + stale item-sync.ts:7 comment.
7. **Tests** (below), lint, typecheck, e2e.

## Test Strategy

- **Unit (web):** compression util (JPEG out, EXIF orientation); blob-store
  record lifecycle (pendingUpload flag, retry reuses key, orphan cleanup); derivePatch emits photoUrl only when defined.
- **Unit (server):** `LocalFsStorageDriver.put/get/delete/url`; MIME sniffing;
  normalizePhotoUrl; delete-on-replace/remove branch in push handler.
- **Server integration:** upload endpoint — auth required, `verifyStoreAccess`
  (cross-household 403), 5MB limit, invalid MIME rejected; GET streams with
  correct headers; push handler creates/replaces/removes photoUrl and deletes
  old file.
- **Web component:** EditItemDialog photo attach/replace/remove; popover shows
  photo; click-to-toggle.
- **E2E (positive, tractable):** `setInputFiles` drives the file input →
  upload → sync → other client sees photo. Offline capture is unit-tested (Dexie
  blob + mocked fetch), not e2e.
- **Manual/UAT:** real iOS Safari capture + a real iPhone final sign-off; Chrome
  Android rear-camera; offline capture → airplane mode → display → reconnect →
  sync.

## Documentation Impact Guess

- Likely a `wiki/technical-design/media-upload-and-serving.md` (or extend
  `offline-persistence.md`) covering: blob store, cache-on-read cap, client-key
  contract, REST/sync split rationale, cache-busting note.
- GROCERUN-44 review M1/M6 and item-sync.ts:7 header comment fixes should be
  reflected in wiki rules if they change behavior.
- Update PROJECT-STATUS when done.

## Risks / Open Questions

- **None blocking.** Decisions from analysis that change the brainstorm:
  client-generated storage keys (retry-idempotency + unguessability +
  cache-busting), cache-on-read replacing JIT prefetch, relative local URLs,
  upload endpoint access control, popover click-to-toggle. All recorded under
  Design Decisions.

## Implementation Notes

- **api.ts is JSON-only today** — the multipart helper must reuse the existing
  401-refresh-retry contract inside `request()`, not duplicate it.
- **FileInterceptor vs global ZodValidationPipe:** the file part does not pass
  through ZodValidationPipe; validate `:itemId` param with a Zod schema and add
  explicit `limits` (5MB) on the interceptor. Never trust client Content-Type —
  sniff server-side. Pin JPEG output so Content-Type and `.jpg` extension agree.
- **Client-generated key contract:** key = UUID generated at capture, stored on
  the Dexie blob record, reused on every retry (`put` by key is idempotent). This
  is why retries cannot orphan files and why the `immutable` cache header cannot
  serve stale photos. Record this rationale — do not regress to deterministic
  `items/<itemId>.jpg` keys.
- **RxDB migration:** version 0 → 1, no-op migration, replicationIdentifier
  unchanged. Do NOT bump the DB name (GROCERUN-44's v8→v9 rename silently
  dropped pending local writes — do not repeat).
- **photoUrl write path is sync-only, by design** — unlike the `note` field
  (which shipped through both REST and sync). State this so reviewers don't
  "fix" it back into a REST path.

## Design Decisions (refinements to the brainstorm)

These finalize the plan; the brainstorm was exploration, this ticket is the
plan. Recorded here so the choices (and why) survive into implementation.

- **Q10 modified:** storage keys are client-generated (UUID) at capture, not
  server-generated cuid2. Motivations: lost-response retry would orphan files
  under server-generated keys; deterministic keys + `immutable` cache = stale
  photos after replacement.
- **Q5 reduced:** JIT prefetch-on-mount + list-scoped event-driven cache
  eviction deferred to v1.1; v1 ships cache-on-read with a size/quota cap.
  Rationale: prefetch only benefits "photo never opened, needed offline
  mid-shopping" (niche); cutting it removes the eviction subsystem.
- **Q3 scoped:** if GROCERUN-51/53 are not yet implemented, ship the
  StorageDriver interface + LocalFs driver in-branch; S3/presigned remains a
  TODO. Feature must not block on the S3 stub.

## Gotchas / Rationale

- Compression library is a genuine new dependency (~12KB gzip) — justified: iOS
  EXIF orientation + Safari File constructor bugs are not worth hand-rolling.
  Verified not already bundled.
- `GET /media` is browser-HTTP-cached immutable, so per-item re-fetch is rare;
  cache-on-read writes to Dexie for offline use.
- No partial states: `photoUrl` either set (photo on server) or absent (no photo
  / pending upload).
- Cross-household overwrite is prevented by store-access check on upload; read
  is unauthenticated by design (product photos, not sensitive data; future list
  public-sharing compatible).

## Follow-Ups

- GROCERUN-60: tombstone cleanup job (hard-delete photo removal).
- Multiple photos per item (future ticket).
- JIT offline prefetch + list-scoped cache eviction (v1.1 candidate).
- S3 production driver.
- Store-decoupling (intake #9) — photo field follows Item through migration.
