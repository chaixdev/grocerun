# GRO-69: Add Pagination to List Queries

**Phase:** 4 (Scale & Polish)  
**Priority:** Medium  
**Audit Items:** #23  
**Depends On:** Phase 3 complete  
**Blocks:** None

---

## Problem

List queries return all records without pagination:
- `getHouseholds()` - returns all households
- `getStores()` - returns all stores
- `getLists()` - returns all lists

As users accumulate data, this causes:
- Slow query performance
- Large response payloads
- Memory pressure on client

---

## Solution

Implement cursor-based pagination for list queries.

---

## Implementation Steps

### 1. Create Pagination Types

Add to `src/core/types/pagination.ts`:

```typescript
export interface PaginationParams {
  cursor?: string
  limit?: number
}

export interface PaginatedResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
  total?: number
}

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100
```

### 2. Create Pagination Helper

Create `src/core/utils/paginate.ts`:

```typescript
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, PaginationParams } from '@/core/types/pagination'

export function normalizePagination(params: PaginationParams) {
  return {
    cursor: params.cursor,
    limit: Math.min(params.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
  }
}

export function buildPrismaArgs(params: PaginationParams) {
  const { cursor, limit } = normalizePagination(params)
  
  return {
    take: limit + 1, // Take one extra to check if there are more
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor item
    }),
  }
}

export function processPaginatedResult<T extends { id: string }>(
  items: T[],
  limit: number
): { items: T[]; nextCursor: string | null; hasMore: boolean } {
  const hasMore = items.length > limit
  const paginatedItems = hasMore ? items.slice(0, -1) : items
  const nextCursor = hasMore ? paginatedItems[paginatedItems.length - 1]?.id ?? null : null
  
  return { items: paginatedItems, nextCursor, hasMore }
}
```

### 3. Update getStores

Update `src/actions/store.ts`:

```typescript
import { PaginationParams, PaginatedResult } from '@/core/types/pagination'
import { buildPrismaArgs, processPaginatedResult, normalizePagination } from '@/core/utils/paginate'

export async function getStores(
  householdId: string,
  pagination: PaginationParams = {}
): Promise<ActionResult<PaginatedResult<Store>>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }
  
  const { limit } = normalizePagination(pagination)
  
  try {
    const stores = await prisma.store.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
      ...buildPrismaArgs(pagination),
    })
    
    return {
      success: true,
      data: processPaginatedResult(stores, limit),
    }
  } catch (error: unknown) {
    return { success: false, error: handleActionError(error, 'getStores') }
  }
}
```

### 4. Update getLists

Update `src/actions/list.ts`:

```typescript
export async function getLists(
  storeId: string,
  pagination: PaginationParams = {}
): Promise<ActionResult<PaginatedResult<List>>> {
  // Similar implementation
}
```

### 5. Update getHouseholds

Update `src/actions/household.ts`:

```typescript
export async function getHouseholds(
  pagination: PaginationParams = {}
): Promise<ActionResult<PaginatedResult<Household>>> {
  // Similar implementation
}
```

### 6. Create usePaginatedQuery Hook

Create `src/hooks/use-paginated-query.ts`:

```typescript
import { useState, useCallback } from 'react'
import { PaginatedResult, PaginationParams } from '@/core/types/pagination'
import { ActionResult } from '@/core/types/action-result'

export function usePaginatedQuery<T>(
  fetcher: (params: PaginationParams) => Promise<ActionResult<PaginatedResult<T>>>
) {
  const [items, setItems] = useState<T[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return
    
    setIsLoading(true)
    const result = await fetcher({ cursor: cursor || undefined })
    
    if (result.success) {
      setItems(prev => [...prev, ...result.data.items])
      setCursor(result.data.nextCursor)
      setHasMore(result.data.hasMore)
    }
    
    setIsLoading(false)
  }, [fetcher, cursor, hasMore, isLoading])
  
  const reset = useCallback(() => {
    setItems([])
    setCursor(null)
    setHasMore(true)
  }, [])
  
  return { items, loadMore, hasMore, isLoading, reset }
}
```

### 7. Update Components

Update list views to use pagination:

```typescript
function StoreList({ householdId }: { householdId: string }) {
  const { items, loadMore, hasMore, isLoading } = usePaginatedQuery(
    (params) => getStores(householdId, params)
  )
  
  return (
    <div>
      {items.map(store => <StoreCard key={store.id} store={store} />)}
      {hasMore && (
        <Button onClick={loadMore} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load more'}
        </Button>
      )}
    </div>
  )
}
```

---

## Acceptance Criteria

- [ ] Pagination types and utilities created
- [ ] `getStores` supports cursor pagination
- [ ] `getLists` supports cursor pagination
- [ ] `getHouseholds` supports cursor pagination
- [ ] Default page size is 20
- [ ] Max page size is 100
- [ ] `usePaginatedQuery` hook created
- [ ] List components updated to load more
- [ ] `npm run build` passes
- [ ] Pagination works (manual test with >20 items)

---

## Notes

- Cursor-based pagination is more reliable than offset for real-time data
- Consider infinite scroll vs "Load more" button based on UX preference
- Total count is optional (expensive for large datasets)
