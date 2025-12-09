# GRO-65: Standardize Error Handling in Server Actions

**Phase:** 3 (Standardization)  
**Priority:** Medium  
**Audit Items:** #2, #3  
**Depends On:** Phase 2 complete  
**Blocks:** None

---

## Problem

Server actions have inconsistent error handling:

1. **Mixed return patterns:**
   - Some throw errors: `createStore`, `updateHousehold`
   - Some return objects: `{ success: false, error: string }`

2. **Untyped catch blocks:**
   - `catch (error)` or `catch { }` without proper typing
   - No structured logging

This makes client-side error handling unpredictable.

---

## Solution

Standardize all server actions to:
1. Return consistent `ActionResult<T>` type
2. Use `catch (error: unknown)` with proper typing
3. Add structured error logging

---

## Implementation Steps

### 1. Create Action Result Type

Create `src/core/types/action-result.ts`:

```typescript
export type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string }

export type ActionResultWithData<T> = ActionResult<T>
export type ActionResultVoid = ActionResult<void>
```

### 2. Create Error Handler Utility

Create `src/core/utils/action-error.ts`:

```typescript
export function handleActionError(error: unknown, context: string): string {
  // Log for observability
  console.error(`[Action Error] ${context}:`, error)
  
  // Return user-friendly message
  if (error instanceof Error) {
    // In production, consider not exposing error.message
    return error.message
  }
  
  return 'An unexpected error occurred'
}
```

### 3. Refactor Actions Pattern

**Before:**
```typescript
export async function createStore(data: StoreInput) {
  try {
    const store = await prisma.store.create({ data })
    return store  // Inconsistent: returns data directly
  } catch (error) {
    throw new Error('Failed to create store')  // Throws
  }
}
```

**After:**
```typescript
import { ActionResult } from '@/core/types/action-result'
import { handleActionError } from '@/core/utils/action-error'

export async function createStore(data: StoreInput): Promise<ActionResult<Store>> {
  try {
    const store = await prisma.store.create({ data })
    return { success: true, data: store }
  } catch (error: unknown) {
    return { 
      success: false, 
      error: handleActionError(error, 'createStore') 
    }
  }
}
```

### 4. Refactor All Action Files

Apply pattern to:
- `src/actions/household.ts`
- `src/actions/store.ts`
- `src/actions/list.ts`
- `src/actions/item.ts`
- `src/actions/section.ts`
- `src/actions/invitation.ts`

### 5. Update Client-Side Handling

Update components to handle new pattern:

**Before:**
```typescript
try {
  const store = await createStore(data)
  toast.success('Store created')
} catch (error) {
  toast.error('Failed to create store')
}
```

**After:**
```typescript
const result = await createStore(data)
if (result.success) {
  toast.success('Store created')
  // Use result.data
} else {
  toast.error(result.error)
}
```

---

## Files to Update

| File | Functions to Refactor |
|------|----------------------|
| `src/actions/household.ts` | `createHousehold`, `updateHousehold`, `renameHousehold`, `deleteHousehold` |
| `src/actions/store.ts` | `createStore`, `updateStore`, `deleteStore` |
| `src/actions/list.ts` | `createList`, `updateListStatus`, `deleteList` |
| `src/actions/item.ts` | `createItem`, `updateItem`, `deleteItem` |
| `src/actions/section.ts` | `createSection`, `updateSection`, `deleteSection` |
| `src/actions/invitation.ts` | `createInvitation`, `acceptInvitation`, `declineInvitation` |

---

## Acceptance Criteria

- [ ] `ActionResult<T>` type created and exported
- [ ] Error handler utility created
- [ ] All server actions return `ActionResult<T>`
- [ ] All catch blocks use `error: unknown`
- [ ] Client-side code updated to handle new pattern
- [ ] `npm run build` passes
- [ ] All CRUD operations work (manual test)

---

## Notes

- Consider adding error codes for programmatic handling
- Logging can be enhanced with observability tools later
- This is a breaking change for action consumers — update all at once
