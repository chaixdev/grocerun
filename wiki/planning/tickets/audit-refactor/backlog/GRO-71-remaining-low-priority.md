# GRO-71: Remaining Low-Priority Items

**Phase:** 4 (Scale & Polish)  
**Priority:** Low  
**Audit Items:** #4, #6, #9, #17, #24, #26, #31, #34, #35  
**Depends On:** Phase 3 complete  
**Blocks:** None

---

## Overview

This ticket consolidates remaining low-priority audit items that can be addressed during regular maintenance or as time permits.

---

## Items

### #4 - Raw SQL Query Documentation
**File:** `src/actions/item.ts:72-82`  
**Fix:** Add comment explaining why the pattern is safe

```typescript
// The LIKE pattern is built here, but this is safe because Prisma's 
// tagged template literal ($queryRaw) properly parameterizes the query.
// The pattern variable is interpolated into the SQL, but Prisma escapes it.
const pattern = `%${query}%`
const items = await prisma.$queryRaw<Item[]>`
  SELECT * FROM Item WHERE name LIKE ${pattern}
`
```

---

### #6 - Document Prisma in Dependencies
**File:** `package.json` or `DEPLOY.md`  
**Fix:** Add comment/documentation

```markdown
## Note on Dependencies

The `prisma` CLI is included in `dependencies` (not `devDependencies`) 
intentionally. This is required for the Docker build process which runs 
`prisma generate` and `prisma migrate deploy` at container startup.
```

---

### #9 - useMediaQuery SSR Hydration
**File:** `src/hooks/use-media-query.ts`  
**Fix:** Handle SSR gracefully

```typescript
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // Return false on server, actual value on client
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })
  
  useEffect(() => {
    // ... existing implementation
  }, [query])
  
  return matches
}
```

---

### #17 - Hardcoded Status Strings
**File:** Multiple files  
**Fix:** Use Prisma-generated enum

```typescript
// Instead of
if (list.status === 'COMPLETED')

// Use
import { ListStatus } from '@/generated/prisma'
if (list.status === ListStatus.COMPLETED)
```

Files to update:
- `src/actions/list.ts`
- `src/components/store-lists.tsx`
- Any other files checking list status

---

### #24 - CSRF Protection Documentation
**File:** `wiki/developer-guide/` or `SECURITY.md`  
**Fix:** Create security documentation

```markdown
## Security Considerations

### CSRF Protection
Server Actions in Next.js 14+ have built-in CSRF protection. Actions are 
only callable from the same origin, and Next.js automatically validates 
the request origin.

### Authentication
All protected routes require authentication via NextAuth. The middleware 
in `src/proxy.ts` enforces authentication before allowing access.
```

---

### #26 - Inconsistent Date Handling
**File:** Multiple files  
**Fix:** Standardize on date-fns

```typescript
// Before (in household-list.tsx)
{household.createdAt.toLocaleDateString()}

// After
import { format } from 'date-fns'
{format(household.createdAt, 'MMM d, yyyy')}
```

Files to update:
- `src/components/household-list.tsx`
- Any other files using `toLocaleDateString()`

---

### #31 - API Route Protection Review
**File:** `src/proxy.ts` and API routes  
**Fix:** Document or protect API routes

Review and document:
- `/api/health` - intentionally public
- `/api/auth/*` - handled by NextAuth
- Any other API routes - add auth checks if needed

---

### #34 - Missing SEO Metadata
**File:** Dynamic route pages  
**Fix:** Add `generateMetadata` functions

```typescript
// src/app/stores/[storeId]/page.tsx
import { Metadata } from 'next'

export async function generateMetadata({ 
  params 
}: { 
  params: { storeId: string } 
}): Promise<Metadata> {
  const store = await getStore(params.storeId)
  return {
    title: store ? `${store.name} | Grocerun` : 'Store | Grocerun',
  }
}
```

---

### #35 - No Retry Logic Documentation
**File:** `wiki/developer-guide/` or code comments  
**Fix:** Document the decision

```markdown
## Database Operations

This application uses SQLite as its database. SQLite's file-based nature 
means transient network failures are not a concern (unlike networked 
databases). For this reason, retry logic is not implemented for database 
operations.

If migrating to a networked database (PostgreSQL, etc.), consider adding 
retry logic using a library like `p-retry`.
```

---

## Implementation Approach

These items can be addressed:
1. **Individually** during regular maintenance
2. **In batches** grouped by file (all date changes together, etc.)
3. **Opportunistically** when touching related code

---

## Acceptance Criteria

- [ ] #4 - SQL query has safety comment
- [ ] #6 - Prisma dependency documented
- [ ] #9 - useMediaQuery handles SSR
- [ ] #17 - Status checks use Prisma enum
- [ ] #24 - Security documentation created
- [ ] #26 - Date formatting standardized
- [ ] #31 - API routes documented/protected
- [ ] #34 - Dynamic pages have metadata
- [ ] #35 - Retry logic decision documented
- [ ] `npm run build` passes

---

## Notes

- These are polish items, not blockers
- Can be addressed incrementally over multiple PRs
- Some may become irrelevant after other refactors
