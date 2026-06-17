# Grocerun 1.0.0 Release Notes

**June 17, 2026** · 37 commits · 6 months of work

Grocerun 1.0.0 transforms the application from a traditional Next.js monolith into a
local-first, offline-capable SPA with a decoupled backend and real-time sync.

---

## Architecture

### Next.js → Vite SPA + NestJS Backend

The frontend was migrated from Next.js 16 to **Vite + React 19 + TanStack Router**.
No SSR, no BFF layer — the browser is the primary runtime.

- **`apps/web`**: Vite SPA with RxDB local-first storage and `oidc-spa` for Google OIDC.
  Server Actions, `next-auth`, and all Next.js-specific patterns removed.
- **`apps/server`**: NestJS 11 (upgraded from 10, resolving 8 production vulnerabilities).
  Serves both the REST/Sync API and the built SPA assets from a single Docker container.
- **`apps/_shared/dtos`**: Shared Zod DTOs defining API contracts across the monorepo.

### Backend Decoupling

- 37 server actions migrated to NestJS REST controllers with AuthGuard + membership verification.
- React Query was introduced then **fully replaced by RxDB reactive queries** — no server-state
  caching layer remains.
- Database consolidated: NestJS owns Prisma/SQLite exclusively; zero direct DB access from frontend.
- JWT auth between browser and server via `/api/token`, stored in memory, sent as Bearer tokens.

---

## Local-First Architecture

### RxDB + Dexie.js

The app is now **local-first**: all reads from IndexedDB via RxDB reactive queries, all writes
go local-first before syncing to the server.

- **6 RxDB collections**: Household, Store, Section, Item, List, ListItem
- **Offline support**: Reads always available; writes queue offline and sync on reconnect.
- **Reactive UI**: Components subscribe to RxDB queries and re-render on local or remote changes.

### Sync Protocol

- **Push/pull/stream per collection** with `(updatedAt, id)` checkpoint-based replication.
- **SSE real-time broadcast** for cross-tab and cross-device sync.
- **Conflict resolution**: Server-wins with shopping lock guard rails for concurrent list editing.
- **Soft-delete** on all 6 domain models (`deleted` + `deletedAt`); Prisma queries filter
  `deleted: false` by default.

---

## Domain Model & Code Quality Hardening

### Domain Model Audit — 17 Fixes

| Group | Key Changes |
|---|---|
| Unique constraints | Compound indexes include `deleted` column; P2002 handling simplified |
| RxDB alignment | `lastPurchased` in RxDB schema; status enum + `createdAt` documented |
| DTO naming | `itemId` → `listItemId` across all API contracts; lazy-expire tokens |
| Shared services | `CascadeSoftDelete`, `AccessService`, `NotificationService` extracted |
| Schema hardening | `ownerId` non-nullable; FK indexes on `storeId`, `listId`, `sectionId`, `itemId` |

### Shared Services Extracted

- **`CascadeSoftDelete`** — FK-safe cascade delete for stores and households.
- **`AccessService`** — Centralized `verifyStoreAccess()` / `verifyHouseholdAccess()`.
- **`NotificationService`** — Fire-and-forget SSE broadcast helpers.
- **`ShoppingLock`** — Identity-corrected concurrent edit guard.

### Codebase Audit — 19 Fixes Across 5 Slices

| Slice | Net Δ | Key Change |
|---|---|---|
| Web queries | -86 | `useRxQuery` centralizes RxDB subscription lifecycle; 8 hooks migrated |
| Web mutations | +43 | `useAddItem` extracted to local-first pattern |
| Server lock | +48 | Identity fix + shared `checkShoppingLock()` |
| Server consistency | -164 | Error model standardized; 6 sync pull handlers → 2 helpers |
| Cross-cutting | -15 | Form schemas derived from `@grocerun/dto` |

7/7 HIGH, 7/11 MEDIUM, 5/8 LOW resolved.

### Schema — 4 New Migrations

- Unique constraint repair on compound indexes
- `ownerId` backfill + non-nullable enforcement
- Explicit FK indexes

### Monorepo Lint

All 4 workspace packages (`web`, `server`, `e2e`, `dtos`) pass lint cleanly.

---

## User-Visible Changes

### New Features

- **Trip completion → new list**: Unchecked items can be toggled into a new list when
  completing a shopping trip. Preference persisted in LocalStorage.

- **Cascade warnings**: Delete dialogs for stores and households now show what will be
  cascaded (sections, items, lists, invitations) before confirming.

- **Clean & resync**: Error screens now include a button to clear local RxDB state
  and re-pull from the server.

- **Clickable store cards**: Store directory cards navigate to store details on click.

- **Network-aware error toasts**: Mutations distinguish between offline and server
  errors with appropriate user-facing messages.

### UX Refinements

- **Store detail + settings consolidated** into a single page with tabs.
- **Simplified list and store card layouts** for cleaner information hierarchy.
- **Household permissions from local state**: Role-based UI guards are instant
  and work offline.

### Mobile

- **Auth persistence fixed**: Session restoration switched to full-page redirect,
  eliminating auth loss on mobile browsers.
- **PWA support**: Installable app experience on Android (WebAPK) and iOS (standalone).

---

## Performance & DevOps

### Docker

- **~90 MB saved** from production image by stripping unnecessary packages.
- Single-container deployment: NestJS serves both API and built SPA assets.
- SQLite on mounted `/app/data` volume with automatic backup on startup.

### CI/CD

- `test.yml` on every PR and push — Prisma generate, lint, unit tests, build.
- `playwright-nightly.yml` for scheduled E2E journey tests.
- Tag-only releases to `ghcr.io`; Watchtower tag-routed deployments for
  staging and production.

### Production Data Migration

`migrate-prod-baseline.sh` backs up the existing SQLite database, applies all Prisma
migrations, and validates against a production DB copy.

---

## Testing

- **E2E suite rebuilt**: 129 legacy specs collapsed to 3 journey specs (14/14 passing).
  Fixture-based setup replaced with API-seeded test data.
- **Unit tests**: `shopping-lock.spec.ts` (8 tests), `sync-helpers.spec.ts` (12 tests),
  `useHouseholdPermissions.test.ts`, `TripSummary.test.tsx` (13 tests).
- **Testing strategy**: Vitest pyramid for domain logic + Playwright journeys for
  critical user flows.
- **Totals**: 109+ unit/integration tests passing, 14 E2E journeys passing.

---

## Breaking Changes

| Change | Impact |
|---|---|
| Next.js → Vite SPA | SSR, ISR, middleware, and all `next/` patterns removed |
| Database ownership | SQLite managed exclusively by NestJS; no direct frontend DB access |
| API boundary | All data access through REST + sync API (no Server Actions) |
| Auth | Google OIDC via `oidc-spa` replaces NextAuth; JWT for API auth |
| Soft-delete | All domain queries must filter `deleted: false` |
| DTO rename | `itemId` → `listItemId` in API contracts |
| Deployment | Single Docker container; NestJS serves both API and SPA assets |

---

## Stats

- **37 commits** · `v0.1.14` (Dec 12, 2025) → `1.0.0` (Jun 17, 2026)
- **544 files changed**: +55,672 / −14,763 lines (332 source files: +16,719 / −7,332)
- **14 Prisma migrations** applied
- **109+ tests** passing (unit/integration) + **14 E2E journeys** (Chromium)
- **~90 MB** saved from Docker production image
- **10 ADRs**, restructured wiki, and canonical coding standards in `wiki/`

---

Built by [Chaitanya Bhagwat](https://github.com/chaitanyab) with dependency updates
from [@dependabot](https://github.com/dependabot).
