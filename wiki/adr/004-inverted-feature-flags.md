# ADR 004: Inverted Feature Flags for Phase 2 Migration

**Status:** Accepted  
**Date:** 2026-01-09  
**Deciders:** Development Team  
**Context:** Phase 2 - API Proxy Layer Migration Strategy

---

## Context

Phase 2 requires migrating 37 server actions from direct Prisma calls to NestJS API calls. We needed a mechanism to:
- Enable incremental migration (domain by domain)
- Provide safe rollback if API endpoints have issues
- Track progress visibly
- Prevent shipping half-migrated code

Two feature flag approaches were considered:
1. **Additive flags**: Start with no flags, add flags as each domain is migrated
2. **Inverted flags**: Start with all domains flagged, flip flags as each domain is migrated

---

## Decision

**We will use inverted feature flags** where all 37 server actions are flagged from day 1.

### Flag Behavior
```typescript
// migration.ts
export const migration = {
  items: true,      // true = use Prisma (old), false = use API (new)
  stores: true,
  sections: true,
  // ... 8 domains total
}
```

### Usage Pattern
```typescript
import { usePrisma } from '@/core/config/migration'

export async function getItems() {
  if (usePrisma.items) {
    return prisma.item.findMany() // OLD PATH
  }
  return apiClient.get('/items')  // NEW PATH
}
```

### Migration Workflow
1. **Start**: All flags `true` (use Prisma)
2. **Build API**: Create NestJS endpoints, test in isolation
3. **Flip flag**: Set flag to `false`, test UI with API path
4. **Remove code**: Once confident, delete flag check and Prisma code
5. **Count down**: Track progress from 37 to 0

---

## Options Considered

### Option 1: Additive Feature Flags ❌
**Approach:** Start with no flags, add `useAPI.items = true` as each domain migrates

```typescript
// Start state: no flags
export const useAPI = {}

// After migrating items:
export const useAPI = {
  items: true,  // true = use API
}

// In server actions:
if (useAPI.items) {
  return apiClient.get('/items')  // NEW
}
return prisma.item.findMany()    // OLD (default)
```

**Pros:**
- Only flag what's been migrated
- Clear that flagged code is "new"

**Cons:**
- ⛔ **Invisible scope**: Hard to know what's left to migrate
- ⛔ **Unmeasurable progress**: Can't count down from N to 0
- ⛔ **Easy to forget actions**: No forcing function to document all 37
- ⛔ **Wrong default**: Unflagged code uses old path (Prisma), risky

### Option 2: Shadow Mirroring (No Flags) ❌
**Approach:** Call both Prisma and API, compare results, prefer Prisma until confident

```typescript
const prismaResult = await prisma.item.findMany()
const apiResult = await apiClient.get('/items')

// Log differences
if (!deepEqual(prismaResult, apiResult)) {
  logger.warn('API mismatch', { prismaResult, apiResult })
}

return prismaResult  // Safe default
```

**Pros:**
- Continuous validation of API against known-good Prisma results
- No flags to manage

**Cons:**
- ⛔ **2x database load**: Every query hits DB twice
- ⛔ **Slower responses**: Sequential calls or complex parallel logic
- ⛔ **Can't measure progress**: No explicit "this domain is done"
- ⛔ **No rollback mechanism**: Hard to revert to Prisma-only

### Option 3: Inverted Feature Flags ✅ (Chosen)
**Approach:** Flag all 37 actions from day 1, flip to false as migrated

```typescript
// Day 1: All flags true (use Prisma)
export const migration = {
  items: true,
  stores: true,
  // ... all 8 domains
}

// After migrating items: flip flag
export const migration = {
  items: false,  // NOW USES API
  stores: true,
  // ...
}
```

**Pros:**
- ✅ **Explicit scope**: All 37 actions documented upfront in migration.ts
- ✅ **Measurable progress**: Count flags still `true` (37 → 0)
- ✅ **Safe default**: Flag removed = API is default (new system proven)
- ✅ **Easy rollback**: Flip one flag to revert one domain
- ✅ **Prevents scope creep**: Can't forget an action, all listed

**Cons:**
- Initial setup work to document all actions
- Flag management overhead (mitigated by domain-level flags, not per-action)

---

## Rationale

### 1. Explicit Scope Control
**Problem with additive flags:** Easy to miss server actions during migration. No forcing function to inventory all 37.

**Inverted flags solution:** Creating `migration.ts` requires listing every domain and action. This becomes the **source of truth** for migration scope.

```typescript
// This file MUST list all domains, forcing complete inventory
export const migration = {
  items: true,      // 3 actions
  stores: true,     // 5 actions
  sections: true,   // 5 actions
  lists: true,      // 11 actions
  households: true, // 6 actions
  users: true,      // 1 action
  invitations: true,// 4 actions
  dashboard: true,  // 2 actions
}
// Total: 37 actions explicitly tracked
```

### 2. Measurable Progress
**Stakeholder question:** "How far along is the migration?"

**Additive flags answer:** "We've migrated items and users" (no total context)

**Inverted flags answer:** "5 of 8 domains complete, 12 of 37 actions migrated" (clear percentage)

Progress tracking:
```typescript
// Count flags still true
const remaining = Object.values(migration).filter(v => v === true).length
console.log(`${remaining} domains remaining`)
```

### 3. Safe Default Behavior
**Critical decision:** When flag is removed, which path is default?

**Additive flags:** Removing flag → uses Prisma (old) → **risky default**  
**Inverted flags:** Removing flag → uses API (new) → **new system proven**

Removing a flag should mean "this is done, API is proven, old code deleted."

### 4. Rollback Safety
During migration, if API has issues:

**Inverted flags:** Flip one flag `false → true`, app uses Prisma immediately  
**Additive flags:** Must deploy code change to add old Prisma code back  
**Shadow mirroring:** No flag to flip, must deploy code change

### 5. Alignment with Phase 2 Goals
Phase 2 goal: **Eliminate all Prisma calls from Next.js**

**Inverted flags visually represent this goal:**
- Start: 8 flags `true` (all using Prisma) ← Current bad state
- Progress: Flags flip to `false` (migrated to API)
- End: All flags removed (Prisma code deleted) ← Target good state

---

## Implementation Details

### File Structure
```typescript
// apps/web/src/core/config/migration.ts
export const migration = {
  items: true,
  stores: true,
  sections: true,
  lists: true,
  households: true,
  users: true,
  invitations: true,
  dashboard: true,
}

export const usePrisma = {
  items: migration.items ?? false,
  stores: migration.stores ?? false,
  // ... helper with safe defaults
}
```

### Server Action Pattern
```typescript
// apps/web/src/actions/item.ts
import { usePrisma } from '@/core/config/migration'

export async function updateItem(id: string, data: ItemInput) {
  if (usePrisma.items) {
    // OLD: Direct Prisma call
    return db.item.update({ where: { id }, data })
  }
  
  // NEW: API call
  return apiClient.patch(`/items/${id}`, data, ItemSchema)
}
```

### Testing Strategy
For each domain:
1. **Flag ON (true)**: Verify old Prisma path still works
2. **Flip flag OFF (false)**: Test new API path
3. **Compare behavior**: Ensure UI functionality identical
4. **Remove flag**: Delete Prisma code, hardcode API path
5. **Deploy**: Flag removed means migration complete for this domain

---

## Consequences

### Positive
- ✅ **Complete inventory**: All 37 actions documented in migration.ts
- ✅ **Visible progress**: Stakeholders can track completion
- ✅ **Easy rollback**: Flip flag to revert domain
- ✅ **Clear completion**: Flag removal = domain done
- ✅ **Prevents mistakes**: Can't forget to migrate an action

### Negative
- ❌ **Initial setup time**: Must list all domains/actions upfront (2-3 hours)
- ❌ **Flag management**: Must remember to flip flags (mitigated by checklist)

### Mitigation Strategies
1. **Checklist**: [PHASE-2-MIGRATION.md](../planning/PHASE-2-MIGRATION.md) tracks all 37 actions
2. **Convention**: Domain-level flags (8 total) not per-action flags (would be 37)
3. **Documentation**: Flag usage pattern documented in ADR (this file)

---

## Alternatives Rejected: Why Not Both?

**Hybrid approach:** Inverted flags during migration, then switch to additive for Phase 3/4

**Rejected because:**
- Phases 3 and 4 will **remove** Server Actions entirely (client-side fetching)
- Flags only needed during Phase 2 transition
- Adding complexity for temporary tooling is anti-pattern

---

## Success Metrics

- [ ] All 37 server actions inventoried in migration.ts
- [ ] Each domain tested with flag ON and flag OFF
- [ ] All flags removed when Phase 2 complete
- [ ] Zero Prisma imports in `apps/web/src/actions/`
- [ ] migration.ts file deleted (or all values `false`)

---

## References

- [Phase 2 Migration Checklist](../planning/PHASE-2-MIGRATION.md) - Tracking document
- [Phase 2 API Proxy Plan](../planning/phase-2-api-proxy.md) - Overall strategy
- [ADR 001: Simple REST + Zod](001-phase2-api-approach.md) - API approach

---

**Decision Date:** January 9, 2026  
**Review Date:** Phase 2 completion (when all flags removed)  
**Status:** Active
