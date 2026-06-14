# Grocerun Project Status - March 18, 2026

## Executive Summary

This document provides a comprehensive overview of the Grocerun project's current state, ongoing work, and next steps. This is designed to enable seamless continuation of work across different machines or sessions.

---

## Project Vision

**Grocerun** is a household grocery list management application that is being transformed from a traditional client-server architecture to a **Local-First** application using an evolutive migration strategy.

### Core Objectives

1. **Local-First Architecture**: Enable offline-first functionality with RxDB for local storage
2. **Real-time Sync**: Implement bidirectional synchronization between local RxDB and cloud backend
3. **Scalability**: Separate frontend (Next.js) from backend (NestJS) with clear API boundaries
4. **Maintainability**: Use monorepo structure with independent deployable services
5. **Zero Downtime**: Maintain working application at every migration step

---

## Current Architecture

### Workspace Structure

```
grocerun-local/
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   └── server/       # NestJS backend (port 3001)
├── packages/         # Shared code (future)
└── wiki/             # Documentation
```

### Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Frontend | Next.js | 16.0.10 | React framework with App Router |
| Backend | NestJS | 10.0.0 | Node.js REST API framework |
| Database | SQLite | - | Relational database (Prisma ORM) |
| ORM | Prisma | 7.2.0 | Database client and migrations |
| Auth | NextAuth | 5.0.0-beta.30 | Authentication (Google OAuth) |
| Node.js | Node.js | 22.21.1 | Runtime (managed via .nvmrc) |
| Workspace | NPM Workspaces | - | Monorepo management |

### Current State Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ HTTP Request
       ▼
┌─────────────────────────────────┐
│  Next.js (Port 3000)            │
│  ┌──────────────────────────┐  │
│  │  Server Actions          │  │
│  │  (apiClient calls)       │  │  ← CURRENT STATE (Phase 2 complete)
│  └───────────┬──────────────┘  │
└──────────────┼──────────────────┘
               │ HTTP (JWT auth)
               ▼
┌─────────────────────────────────┐
│  NestJS (Port 3001)             │
│  ┌──────────────────────────┐  │
│  │  REST Controllers        │  │
│  │  + Prisma Service        │  │
│  └───────────┬──────────────┘  │
└──────────────┼──────────────────┘
               │
               ▼
       ┌──────────────┐
       │  SQLite DB   │
       │(apps/web/    │
       │ dev.db)      │
       └──────────────┘
```

**Key Characteristics:**
- Server Actions call NestJS via `apiClient` (JWT-authenticated REST)
- Clean API boundary between frontend and backend
- All domains fully migrated: items, stores, sections, lists, households, users, invitations, dashboard/directory
- Prisma remains only in auth infrastructure (`auth.ts` via `PrismaAdapter`) — intentional
- E2E test suite: 129 passing, 36 skipped (pre-existing)

---

## Migration Journey: The Evolutive Approach

### Why "Evolutive"?

We abandoned a ground-up rewrite approach in favor of incremental migration to:
- Keep the application functional at every step
- Reduce risk of breaking existing features
- Enable continuous testing and validation
- Allow for course correction during migration

### 4-Phase Migration Plan

#### ✅ **Phase 1: Monorepo Foundation** (COMPLETED)

**Goal:** Restructure workspace to support independent frontend and backend

**What We Did:**
- Moved legacy Next.js app to `apps/web`
- Kept existing NestJS backend in `apps/server`
- Deleted experimental Vite client (`apps/client`)
- Created `.nvmrc` to lock Node.js version to 22
- Configured Next.js reverse proxy for `/api/v1/*` → NestJS
- Applied Prisma migrations (8 existing + 1 new "reposition" migration)
- Fixed Google OAuth to work with new structure
- Created comprehensive documentation ([monorepo-architecture.md](apps/web/wiki/developer-guide/monorepo-architecture.md))

**Validation:**
- ✅ Frontend accessible at http://localhost:3000
- ✅ Backend running at http://localhost:3001
- ✅ Google OAuth login working
- ✅ Database operational (apps/web/dev.db)

**Git Commit:** `c81a72f` on branch `feature/evolutive-architecture`

---

#### ✅ **Phase 2: API Proxy Layer** (COMPLETED - March 2026)

**Goal:** Decouple frontend from database by introducing API boundary

**What Was Done:**

All Prisma calls removed from `apps/web` actions and pages layer. Every domain now routes through the NestJS backend via `apiClient`.

```
BEFORE (Phase 1):
Server Action → Prisma → SQLite

AFTER (Phase 2):
Server Action → HTTP Fetch (JWT) → NestJS API → Prisma → SQLite
```

**Domains Migrated:** All 8 domains complete
- Items ✅ (3 actions)
- Stores ✅ (5 actions)
- Sections ✅ (5 actions)
- Lists ✅ (11 actions)
- Households ✅ (6 actions)
- Users ✅ (1 action)
- Invitations ✅ (4 actions)
- Dashboard/Directory ✅ (2 read queries → `/household-overview`)
- Pages layer ✅ (`settings/page.tsx`, `stores/[storeId]/page.tsx`)

**Key Technical Decisions:**
- No feature flags — direct replacement per domain
- JWT signing pattern: `SignJWT` from `jose`, signed with `AUTH_SECRET`
- Shared DTOs (`packages/dto`) kept clean — web-only fields (e.g. `storeId` for revalidation) use local `.extend()` in action files
- `GET /household-overview` reused for both `getDashboardData()` and `getStoreDirectoryData()`
- Auth infrastructure (`PrismaAdapter` in `auth.ts`) intentionally kept — NextAuth sessions still use Prisma directly

**Validation:**
- ✅ TypeScript typecheck passes (`npx tsc --noEmit`)
- ✅ E2E test suite: 129 passing, 36 skipped (same as baseline)

**Detailed Checklist:** See [PHASE-2-MIGRATION.md](wiki/planning/PHASE-2-MIGRATION.md)

---

#### 🔄 **Phase 3: Client Fetch** (NEXT UP)

**Goal:** Drop SSR, make all pages client-rendered, replace Server Actions with React Query

**Why:** Simplify the architecture to a single data-fetching pattern. Next.js becomes a static
shell (router + auth), all data flows through React Query on the client. This also prepares
for Phase 4 (RxDB) where all data access must be client-side anyway.

**Key architectural decision:** No SSR for data. Pages render a loading skeleton on first paint,
then React Query fetches data client-side through the `/api/v1/*` proxy. For a personal grocery
app behind auth, the SSR performance benefit is negligible and the complexity cost is not worth it.

**Approach:**
- Install React Query (`@tanstack/react-query`)
- Convert page components from async Server Components to client components
- Create custom hooks for each domain (`useStores`, `useLists`, etc.)
- Move `apiClient` to browser-side (calls `/api/v1/*`, proxied to NestJS by Next.js rewrite)
- Replace Server Actions with `useMutation` calls
- Add loading states, error handling, optimistic updates
- Remove `getAuthJwt()` and `jose` from web app (auth handled via session cookie → API)
- Delete all `actions/*.ts` files

**What Will Change:**

```
BEFORE (Phase 2 — SSR + Server Actions):
Browser → Next.js SSR → Server Action → getAuthJwt() → NestJS → SQLite

AFTER (Phase 3 — Client-rendered + React Query):
Browser → static shell (Next.js) → React Query → /api/v1/* → NestJS → SQLite
```

**Prerequisites:**
- ✅ Phase 2 complete (clean API boundary exists)
- ✅ Phase 2.5 stabilization complete (JWT helper, env vars, deployment config)
- Consider whether `@prisma/client` deps can be removed from `apps/web/package.json` now that no runtime Prisma calls exist (blocked by NextAuth PrismaAdapter)

---

#### 🚀 **Phase 4: RxDB Integration** (NOT STARTED)

**Goal:** Achieve Local-First architecture with offline support

**Approach:**
- Install RxDB in frontend
- Create RxDB schemas mirroring Prisma schema
- Implement sync protocol between RxDB and NestJS
- Add conflict resolution logic
- Enable offline mode

**What Will Change:**

```
BEFORE (Phase 3):
Component → useQuery → API → NestJS → SQLite

AFTER (Phase 4):
Component → RxDB (local) ⟷ Sync Protocol ⟷ NestJS → SQLite (cloud)
```

---

## Current Working State

### Environment Setup

**Node.js Version:** 22.21.1 (managed via `.nvmrc` in project root)

**How to Run:**
```bash
# From project root
nvm use          # Activates Node 22.21.1
npm run dev      # Starts both apps via concurrently
```

This will start:
- Next.js on http://localhost:3000 (Turbopack dev server)
- NestJS on http://localhost:3001 (watch mode)

### Environment Variables

**apps/web/.env:**
```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="[generated secret]"
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="[your-google-oauth-client-id]"
AUTH_GOOGLE_SECRET="[your-google-oauth-client-secret]"
```

**apps/server/.env:**
```
DATABASE_URL="file:./dev.db"
PORT=3001
```

### Database State

**Current Database:** `apps/web/dev.db` (SQLite)

**Schema:** 
- Users, Accounts, Sessions (NextAuth)
- Households, HouseholdMembers
- Stores, Sections
- Lists, ListItems, Items
- Invitations

**Migrations Applied:** 8 migrations (see `apps/web/prisma/migrations/`)

**Known Issue:** `apps/server/dev.db` exists but is not being used yet. Will be consolidated in Phase 2.

---

## Key Files & Locations

### Documentation
- [apps/web/wiki/developer-guide/monorepo-architecture.md](apps/web/wiki/developer-guide/monorepo-architecture.md) - Complete setup guide
- [apps/web/wiki/developer-guide/agentic-workflow.md](apps/web/wiki/developer-guide/agentic-workflow.md) - AI agent SOP
- [apps/web/wiki/planning/phase-2-api-proxy.md](apps/web/wiki/planning/phase-2-api-proxy.md) - Phase 2 migration plan

### Configuration
- [package.json](package.json) - Root workspace configuration
- [apps/web/package.json](apps/web/package.json) - Frontend dependencies
- [apps/server/package.json](apps/server/package.json) - Backend dependencies
- [apps/web/next.config.mjs](apps/web/next.config.mjs) - Next.js config (includes reverse proxy)
- [.nvmrc](.nvmrc) - Node version lock

### Core Code
- [apps/web/src/actions/](apps/web/src/actions/) - Server Actions (to be migrated in Phase 2)
- [apps/web/src/features/](apps/web/src/features/) - Feature-specific UI components
- [apps/server/src/](apps/server/src/) - NestJS application

---

## Issues Resolved

### 1. Node Version Mismatch
**Problem:** better-sqlite3 binary mismatch (NODE_MODULE_VERSION 137 vs 127)
**Solution:** Created `.nvmrc` with "22", ran `npm rebuild`

### 2. Port Conflicts
**Problem:** Next.js and NestJS both trying to use same port
**Solution:** Next.js on 3000, NestJS on 3001, configured reverse proxy

### 3. Google OAuth 404
**Problem:** Reverse proxy intercepting `/api/auth/*` routes
**Solution:** Changed proxy to only forward `/api/v1/*`, preserving NextAuth routes

### 4. Database Missing
**Problem:** "table main.Account does not exist"
**Solution:** Ran `npx prisma migrate dev` in apps/web directory

---

## Open Questions & Decisions Needed

### 1. Database Consolidation
**Question:** How to handle two separate SQLite databases during migration?

**Options:**
- A) Share database (point both to `apps/server/dev.db`)
- B) Dual write (write to both during migration)
- C) Migration script (copy data once all APIs migrated)

**Current Recommendation:** Start with Option A for simplicity

### 2. Turborepo Adoption
**Question:** When to migrate from NPM workspaces to Turborepo?

**Current Thinking:** After Phase 2 completion, before Phase 3

### 3. API Design
**Question:** REST vs GraphQL vs tRPC?

**Current Decision:** REST (simpler, already configured)

---

## Next Session: Step-by-Step Instructions

### Immediate Next Steps (Phase 2, Step 1)

1. **Verify Environment**
   ```bash
   cd /home/chaitanya/projects/grocerun-local
   nvm use
   npm run dev
   ```
   Confirm both servers start successfully.

2. **Create API Client Utility**
   ```bash
   # Create the file
   touch apps/web/src/core/lib/api-client.ts
   ```
   
   Implement a fetch wrapper with:
   - Base URL from environment variable
   - Error handling
   - Type safety
   - Request/response logging (dev only)

3. **Add Environment Variable**
   Update `apps/web/.env`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
   ```

4. **Create Health Check Endpoint**
   In `apps/server/src/`, create:
   - `health/health.controller.ts`
   - `health/health.module.ts`
   
   Endpoint: `GET /api/v1/health`
   Response: `{ status: "ok", timestamp: Date }`

5. **Test Connectivity**
   Create a test Server Action that calls the health endpoint via api-client.

6. **Proceed to Items Migration**
   Follow the plan in [phase-2-api-proxy.md](apps/web/wiki/planning/phase-2-api-proxy.md)

---

## Git Repository State

**Current Branch:** `feature/evolutive-architecture`

**Last Commit:** `c81a72f` - "refactor: restructure to monorepo for evolutive architecture"

**Working Tree:** Clean (after this commit)

**Remote:** (Check with `git remote -v`)

---

## Troubleshooting Common Issues

### Dev Server Won't Start
```bash
# Kill any zombie processes
fuser -k 3000/tcp
fuser -k 3001/tcp

# Rebuild native modules
npm rebuild
```

### Prisma Client Out of Sync
```bash
cd apps/web
npx prisma generate
npx prisma migrate dev
```

### Google Auth Not Working
- Verify `AUTH_URL=http://localhost:3000` in `apps/web/.env`
- Check Google Cloud Console: Authorized redirect URIs include `http://localhost:3000/api/auth/callback/google`

---

## Success Metrics

### Phase 1 (Current)
- ✅ Monorepo structure established
- ✅ Both apps running independently
- ✅ Google OAuth working
- ✅ Database operational

### Phase 2 (Completed ✅)
- ✅ API client utility created (`apps/web/src/core/lib/api-client.ts`)
- ✅ All domains have NestJS endpoints
- ✅ All Server Actions use apiClient (no direct Prisma in actions/pages)
- ✅ UI functionality unchanged (E2E: 129 passing)
- ⏳ Database consolidated to `apps/server/dev.db` (deferred — both share same file path currently)

### Phase 3 (Next Up)
- [ ] SSR dropped — all pages are client-rendered shells
- [ ] React Query integrated
- [ ] All data fetching client-side via `/api/v1/*` proxy
- [ ] Server Actions deleted (`actions/*.ts` removed)
- [ ] `getAuthJwt()` and `jose` removed from web app
- [ ] Loading states & error handling implemented

### Phase 4 (Future)
- [ ] RxDB integrated
- [ ] Offline mode working
- [ ] Sync protocol implemented
- [ ] Conflict resolution working

---

## Contact & Context

**Last Updated:** March 22, 2026
**Session Context:** Phase 2.5 stabilization complete — JWT helper extracted, Prisma types removed, env vars fixed, unified Dockerfile created
**Documentation:** See [PHASE-2-MIGRATION.md](wiki/planning/PHASE-2-MIGRATION.md) for full details

---

**Ready to continue from any machine!** 🚀
