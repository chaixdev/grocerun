# GRO-66: Add Consistent Input Validation to Server Actions

**Phase:** 3 (Standardization)  
**Priority:** Medium  
**Audit Items:** #8  
**Depends On:** GRO-65  
**Blocks:** None

---

## Problem

Several server actions accept raw parameters without Zod validation:
- `deleteStore(id: string)`
- `deleteSection(id: string)`
- `updateSection(id: string, name: string)`
- Various other functions with string IDs

While the database provides some safety, defense in depth requires consistent input validation.

---

## Solution

Apply Zod schemas to all server action inputs, including:
1. ID parameters (validate as CUID)
2. String inputs (validate min/max length)
3. Composite inputs (full schema validation)

---

## Implementation Steps

### 1. Create Shared Validation Schemas

Add to `src/core/schemas/common.ts`:

```typescript
import { z } from 'zod'

// CUID validation for IDs
export const IdSchema = z.string().cuid('Invalid ID format')

// Common string validations
export const NameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')

// Pagination params (for future use)
export const PaginationSchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
})
```

### 2. Create Action Validation Helper

Create `src/core/utils/validate-action.ts`:

```typescript
import { z } from 'zod'
import { ActionResult } from '@/core/types/action-result'

export async function validateAction<T, R>(
  schema: z.Schema<T>,
  input: unknown,
  action: (validated: T) => Promise<ActionResult<R>>
): Promise<ActionResult<R>> {
  const result = schema.safeParse(input)
  
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0]?.message || 'Validation failed',
    }
  }
  
  return action(result.data)
}
```

### 3. Refactor Delete Actions

**Before:**
```typescript
export async function deleteStore(id: string): Promise<ActionResult<void>> {
  try {
    await prisma.store.delete({ where: { id } })
    return { success: true, data: undefined }
  } catch (error: unknown) {
    return { success: false, error: handleActionError(error, 'deleteStore') }
  }
}
```

**After:**
```typescript
import { IdSchema } from '@/core/schemas/common'

const DeleteStoreSchema = z.object({
  id: IdSchema,
})

export async function deleteStore(id: string): Promise<ActionResult<void>> {
  const validation = DeleteStoreSchema.safeParse({ id })
  if (!validation.success) {
    return { success: false, error: 'Invalid store ID' }
  }
  
  try {
    await prisma.store.delete({ where: { id: validation.data.id } })
    return { success: true, data: undefined }
  } catch (error: unknown) {
    return { success: false, error: handleActionError(error, 'deleteStore') }
  }
}
```

### 4. Refactor Update Actions

**Before:**
```typescript
export async function updateSection(id: string, name: string) {
  // ... no validation
}
```

**After:**
```typescript
const UpdateSectionSchema = z.object({
  id: IdSchema,
  name: NameSchema,
})

export async function updateSection(
  id: string, 
  name: string
): Promise<ActionResult<Section>> {
  const validation = UpdateSectionSchema.safeParse({ id, name })
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message }
  }
  
  // ... rest of implementation
}
```

### 5. Apply to All Actions

| File | Functions to Add Validation |
|------|----------------------------|
| `src/actions/store.ts` | `deleteStore`, `getStore` |
| `src/actions/section.ts` | `deleteSection`, `updateSection`, `reorderSections` |
| `src/actions/list.ts` | `deleteList`, `updateListStatus` |
| `src/actions/item.ts` | `deleteItem`, `updateItem` |
| `src/actions/invitation.ts` | `acceptInvitation`, `declineInvitation` |
| `src/actions/household.ts` | `deleteHousehold`, `renameHousehold` |

---

## Acceptance Criteria

- [ ] `IdSchema` and common schemas created
- [ ] All server actions validate input parameters
- [ ] Invalid IDs return clear error messages
- [ ] Invalid strings return clear error messages
- [ ] `npm run build` passes
- [ ] Actions reject malformed input (manual test)

---

## Testing

```typescript
// Test with invalid CUID
const result = await deleteStore('not-a-valid-cuid')
expect(result.success).toBe(false)
expect(result.error).toContain('Invalid')

// Test with empty name
const result2 = await updateSection('valid-cuid', '')
expect(result2.success).toBe(false)
expect(result2.error).toContain('required')
```

---

## Notes

- CUID validation catches obvious invalid inputs
- This is defense in depth — database constraints are backup
- Consider adding rate limiting checks in validation layer
