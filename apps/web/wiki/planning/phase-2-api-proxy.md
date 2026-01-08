# Phase 2 Migration Plan: API Proxy Layer

## Current State (Phase 1)

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
│  │  (Direct Prisma calls)   │  │
│  └───────────┬──────────────┘  │
│              │                  │
│              ▼                  │
│  ┌──────────────────────────┐  │
│  │  Prisma Client           │  │
│  └───────────┬──────────────┘  │
│              │                  │
└──────────────┼──────────────────┘
               │
               ▼
       ┌──────────────┐
       │  SQLite DB   │
       │  (apps/web)  │
       └──────────────┘
```

**Characteristics:**
- Server Actions directly query the database
- Tight coupling between UI and data layer
- No API boundary
- Single monolithic app

## Target State (Phase 2)

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ HTTP Request
       ▼
┌─────────────────────────────────────────────────┐
│  Next.js (Port 3000)                            │
│  ┌──────────────────────────────────────────┐  │
│  │  Server Actions                          │  │
│  │  (Call NestJS API via fetch)             │  │
│  └───────────┬──────────────────────────────┘  │
│              │                                  │
│              │ HTTP (internal)                  │
└──────────────┼──────────────────────────────────┘
               │
               │ /api/v1/*
               ▼
┌──────────────────────────────────┐
│  NestJS (Port 3001)              │
│  ┌────────────────────────────┐  │
│  │  Controllers               │  │
│  │  (REST API)                │  │
│  └───────────┬────────────────┘  │
│              │                   │
│              ▼                   │
│  ┌────────────────────────────┐  │
│  │  Services                  │  │
│  │  (Business Logic)          │  │
│  └───────────┬────────────────┘  │
│              │                   │
│              ▼                   │
│  ┌────────────────────────────┐  │
│  │  Prisma Client             │  │
│  └───────────┬────────────────┘  │
│              │                   │
└──────────────┼───────────────────┘
               │
               ▼
       ┌──────────────┐
       │  SQLite DB   │
       │  (apps/server)│
       └──────────────┘
```

**Characteristics:**
- Server Actions act as BFF (Backend for Frontend)
- NestJS handles all database operations
- Clear API boundary
- Decoupled frontend and backend
- Prepared for Phase 3 (client-side fetching)

## Migration Strategy

### Principle: Incremental, Feature-by-Feature

We will migrate one domain at a time, ensuring the app remains functional at each step.

### Step-by-Step Approach

#### Step 1: Create Base Infrastructure
**Goal:** Set up the plumbing without touching existing features.

**Tasks:**
1. Create API client utility in `apps/web/src/core/lib/api-client.ts`
2. Add environment variable `NEXT_PUBLIC_API_URL` (defaults to `/api/v1`)
3. Test with a simple "health check" endpoint

**Success Criteria:**
- Can call NestJS from Next.js Server Actions
- Error handling works
- No impact on existing features

---

#### Step 2: Migrate "Items" Domain
**Why start here?** Items is the simplest domain with basic CRUD operations.

**Endpoints to create in NestJS:**
```
GET    /api/v1/items              # List items (with filters)
GET    /api/v1/items/:id          # Get single item
POST   /api/v1/items              # Create item
PATCH  /api/v1/items/:id          # Update item
DELETE /api/v1/items/:id          # Delete item
```

**Server Actions to migrate:**
- `apps/web/src/actions/item.ts`:
  - `createItemAction()` → calls `POST /api/v1/items`
  - `updateItemAction()` → calls `PATCH /api/v1/items/:id`
  - `deleteItemAction()` → calls `DELETE /api/v1/items/:id`

**Implementation Order:**
1. Create NestJS endpoints (keep existing Server Actions)
2. Test endpoints with Postman/curl
3. Update Server Actions to call API (one at a time)
4. Test UI to ensure functionality preserved
5. Remove old Prisma code from Server Actions

**Rollback Plan:**
- Keep old Prisma code commented out
- Feature flag to switch between direct DB and API

---

#### Step 3: Migrate "Stores" Domain
**Endpoints:**
```
GET    /api/v1/stores
POST   /api/v1/stores
PATCH  /api/v1/stores/:id
DELETE /api/v1/stores/:id
GET    /api/v1/stores/:id/sections
```

**Server Actions to migrate:**
- `apps/web/src/actions/store.ts`
- `apps/web/src/actions/section.ts`

---

#### Step 4: Migrate "Lists" Domain
**Endpoints:**
```
GET    /api/v1/lists
POST   /api/v1/lists
PATCH  /api/v1/lists/:id
DELETE /api/v1/lists/:id
POST   /api/v1/lists/:id/items    # Add item to list
PATCH  /api/v1/lists/:id/items/:itemId
DELETE /api/v1/lists/:id/items/:itemId
```

**Server Actions to migrate:**
- `apps/web/src/actions/list.ts`

---

#### Step 5: Migrate "Households" Domain
**Endpoints:**
```
GET    /api/v1/households
POST   /api/v1/households
PATCH  /api/v1/households/:id
DELETE /api/v1/households/:id
GET    /api/v1/households/:id/members
POST   /api/v1/households/:id/invite
```

**Server Actions to migrate:**
- `apps/web/src/actions/household.ts`
- `apps/web/src/actions/invitation.ts`

---

#### Step 6: Migrate "User/Auth" Domain
**Special Considerations:**
- NextAuth handles most auth logic
- Only user profile updates need migration

**Endpoints:**
```
GET    /api/v1/users/me
PATCH  /api/v1/users/me
```

**Server Actions to migrate:**
- `apps/web/src/actions/user.ts`

---

## Database Migration Strategy

### Current Problem
- `apps/web/dev.db` has all data
- `apps/server/dev.db` exists but is mostly empty

### Solution Options

**Option A: Share Database (Simple)**
- Point both apps to the same SQLite file
- `apps/web/.env`: `DATABASE_URL=file:../server/dev.db`
- Pro: No data migration needed
- Con: Defeats purpose of decoupling

**Option B: Dual Write (Transitional)**
- During migration, write to both databases
- Once migration complete, remove `apps/web/dev.db`
- Pro: Safe rollback
- Con: Complexity

**Option C: Migration Script (Clean)**
- Copy `apps/web/dev.db` to `apps/server/dev.db`
- Update all Server Actions at once
- Pro: Clean separation
- Con: Big bang risk

**Recommendation:** Start with **Option A** for development, then move to **Option C** once all endpoints are migrated.

---

## Testing Strategy

### Manual Testing Checklist (Per Domain)
- [ ] Create operation works
- [ ] Read operation works
- [ ] Update operation works
- [ ] Delete operation works
- [ ] Error handling works (bad input, not found, etc.)
- [ ] UI updates correctly after each operation

### Automated Testing (Future)
- Integration tests for NestJS endpoints
- E2E tests for critical user flows

---

## Phase 2 Completion Criteria

✅ All Server Actions call NestJS API (no direct Prisma)  
✅ All domains migrated (Items, Stores, Lists, Households, Users)  
✅ UI functionality unchanged  
✅ Database consolidated to `apps/server/dev.db`  
✅ Documentation updated  

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes to UI | High | Migrate incrementally, test thoroughly |
| Performance degradation | Medium | Monitor response times, optimize queries |
| Data loss during DB migration | High | Backup `dev.db` before migration |
| NestJS crashes affecting entire app | High | Add health checks, graceful degradation |

---

## Timeline Estimate

Assuming 1-2 hours per domain:

- Step 1 (Infrastructure): 1-2 hours
- Step 2 (Items): 1-2 hours
- Step 3 (Stores): 2-3 hours
- Step 4 (Lists): 2-3 hours
- Step 5 (Households): 2-3 hours
- Step 6 (Users): 1 hour
- Testing & Cleanup: 2-3 hours

**Total: 11-17 hours**

---

## Next Actions

1. Review this plan and get alignment
2. Create `apps/web/src/core/lib/api-client.ts`
3. Add first NestJS endpoint (`GET /health`)
4. Test end-to-end connectivity
5. Begin Step 2 (Items migration)
