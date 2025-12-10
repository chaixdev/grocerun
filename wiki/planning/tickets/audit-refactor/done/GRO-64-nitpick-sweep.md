# GRO-64: Nitpick Sweep

**Phase:** 2 (Refactor)  
**Priority:** Low  
**Audit Items:** #1, #10, #13, #19, #20, #22, #27, #30, #32  
**Depends On:** GRO-63  
**Blocks:** Phase 3

---

## Problem

Several minor code quality issues identified in audit:
- Confusing comments
- Unused code
- Minor type improvements

These should be fixed as part of refactor cleanup.

---

## Items to Address

### #1 - Confusing Comment in item.ts
**File:** `src/actions/item.ts:17`  
**Fix:** Remove standalone `// ...` comment

### #10 - Debounce Cleanup Note  
**File:** `src/components/section-list.tsx`  
**Fix:** Add explanatory comment that cleanup is intentional

### #13 - Unused StoreSettingsPageProps
**File:** `src/app/stores/[storeId]/settings/page.tsx`  
**Fix:** Remove unused interface definition

### #19 - Optimistic UI Flash Note
**File:** `src/features/lists/components/ListEditor.tsx` (new location)  
**Fix:** Add TODO comment for future UX polish

### #20 - Request Cancellation Note
**File:** `src/components/item-autocomplete.tsx`  
**Fix:** Add comment noting `lastQueryRef` pattern is sufficient

### #22 - Implicit Any in Sortable
**File:** `src/components/ui/sortable.tsx`  
**Fix:** Add explicit return type to `renderOverlay`

### #27 - AppVersion useEffect
**File:** `src/components/app-version.tsx`  
**Fix:** Remove unnecessary useEffect, use constant directly

### #30 - Unused Trash2 Import
**File:** `src/features/stores/components/StoreSettings/SettingsForm.tsx` (new location)  
**Fix:** Remove unused `Trash2` import

### #32 - Toast Duration Note
**File:** `src/app/layout.tsx` or Sonner config  
**Fix:** Add comment documenting default duration is acceptable, or configure durations

---

## Implementation Steps

### 1. Item.ts Comment (#1)

```typescript
// Before
const UpdateItemSchema = z.object({
  // ...
  name: z.string().min(1),
})

// After
const UpdateItemSchema = z.object({
  name: z.string().min(1),
  // ... other fields
})
```

### 2. AppVersion Fix (#27)

```typescript
// Before
export function AppVersion() {
  const [version, setVersion] = useState<string>('')
  
  useEffect(() => {
    setVersion(process.env.NEXT_PUBLIC_APP_VERSION || 'dev')
  }, [])
  
  return <span>{version}</span>
}

// After
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'dev'

export function AppVersion() {
  return <span>{APP_VERSION}</span>
}
```

### 3. Remove Unused Interface (#13)

```typescript
// Remove this block entirely
interface StoreSettingsPageProps {
  params: { storeId: string }
}
```

### 4. Remove Unused Import (#30)

```typescript
// Before
import { Save, Trash2 } from 'lucide-react'

// After
import { Save } from 'lucide-react'
```

### 5. Add Sortable Return Type (#22)

```typescript
// Before
renderOverlay?: (item: T) => React.ReactNode

// After
renderOverlay?: (item: T) => React.ReactNode
```

(Note: This is already correct, verify it has explicit return type)

### 6. Add Documentation Comments

Add brief comments to:
- Section-list debounce explaining cleanup
- Item-autocomplete explaining lastQueryRef pattern

---

## Acceptance Criteria

- [ ] All 9 nitpick items addressed
- [ ] No unused imports remain (ESLint clean)
- [ ] No confusing standalone comments
- [ ] `npm run build` passes
- [ ] `npm run lint` passes (if configured)

---

## Notes

- These are quick fixes, each taking 1-2 minutes
- Can be done in a single commit: "chore: address audit nitpicks"
- Some may have been auto-fixed during refactor file moves
