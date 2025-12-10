# GRO-59: Refactor Core Infrastructure

**Phase:** 2 (Refactor)  
**Priority:** Medium  
**Audit Items:** #33 (schema centralization)  
**Depends On:** Phase 1 complete  
**Blocks:** GRO-60, GRO-61, GRO-62

---

## Problem

Infrastructure code is scattered:
- `auth.ts`, `auth.config.ts` at `src/` root
- `prisma.ts`, `auth-helpers.ts`, `utils.ts` in `src/lib/`
- Schemas split between `src/schemas/` and inline in actions

---

## Solution

Create `src/core/` directory with organized subdirectories for infrastructure code.

---

## Implementation Steps

### 1. Create Directory Structure

```
src/core/
├── auth/
│   ├── index.ts        # Re-exports
│   ├── auth.ts         # Main auth config (from src/auth.ts)
│   ├── auth.config.ts  # Provider config (from src/auth.config.ts)
│   └── helpers.ts      # Auth helpers (from src/lib/auth-helpers.ts)
├── db/
│   ├── index.ts        # Re-exports
│   └── prisma.ts       # Prisma client (from src/lib/prisma.ts)
├── config/
│   ├── index.ts        # Re-exports
│   ├── app.ts          # App config (from src/lib/app-config.ts)
│   └── env.ts          # Env validation (from GRO-58)
└── schemas/
    ├── index.ts        # Re-exports all schemas
    ├── store.ts        # (from src/schemas/store.ts)
    └── household.ts    # (extract from src/actions/household.ts)
```

### 2. Move Auth Files

```bash
mkdir -p src/core/auth
mv src/auth.ts src/core/auth/auth.ts
mv src/auth.config.ts src/core/auth/auth.config.ts
mv src/lib/auth-helpers.ts src/core/auth/helpers.ts
```

Create `src/core/auth/index.ts`:
```typescript
export { auth, signIn, signOut, handlers } from './auth'
export { authConfig } from './auth.config'
export { getCurrentUser, requireAuth } from './helpers'
```

### 3. Move Database Files

```bash
mkdir -p src/core/db
mv src/lib/prisma.ts src/core/db/prisma.ts
```

Create `src/core/db/index.ts`:
```typescript
export { prisma } from './prisma'
```

### 4. Move Config Files

```bash
mkdir -p src/core/config
mv src/lib/app-config.ts src/core/config/app.ts
mv src/lib/env.ts src/core/config/env.ts  # If created in GRO-58
```

### 5. Centralize Schemas

```bash
mkdir -p src/core/schemas
mv src/schemas/store.ts src/core/schemas/store.ts
```

Extract `HouseholdSchema` from `src/actions/household.ts` to `src/core/schemas/household.ts`.

Create `src/core/schemas/index.ts`:
```typescript
export { StoreSchema } from './store'
export { HouseholdSchema } from './household'
```

### 6. Update All Imports

Search and replace across codebase:
- `@/auth` → `@/core/auth`
- `@/lib/prisma` → `@/core/db`
- `@/lib/auth-helpers` → `@/core/auth`
- `@/schemas/` → `@/core/schemas`

### 7. Update next.config.mjs

If auth route handlers reference old paths, update them.

### 8. Clean Up Old Directories

Remove empty `src/lib/` files and `src/schemas/` if fully migrated.

---

## Acceptance Criteria

- [ ] `src/core/` structure created
- [ ] All auth files in `src/core/auth/`
- [ ] Prisma client in `src/core/db/`
- [ ] Config files in `src/core/config/`
- [ ] All schemas centralized in `src/core/schemas/`
- [ ] All imports updated
- [ ] `npm run build` passes
- [ ] Auth flow works (manual test)

---

## Notes

- Keep `src/lib/utils.ts` in place for now (used by shadcn)
- Barrel exports (`index.ts`) keep imports clean
- This establishes the pattern for feature directories
