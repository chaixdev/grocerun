# GRO-70: Accessibility and Loading State Improvements

**Phase:** 4 (Scale & Polish)  
**Priority:** Low  
**Audit Items:** #14, #21, #28  
**Depends On:** Phase 2 complete  
**Blocks:** None

---

## Problem

Several UX/accessibility gaps identified:
- Missing ARIA labels on interactive elements (#21)
- Missing loading states for page transitions (#28)
- HouseholdForm lacks loading indicator (#14)

---

## Solution

Address accessibility and loading state gaps across the application.

---

## Part 1: ARIA Labels (#21)

### Files to Update

| File | Element | Fix |
|------|---------|-----|
| `ListEditor.tsx` | Checkbox | Add `aria-label="Mark {item.name} as {checked ? 'incomplete' : 'complete'}"` |
| `ListEditor.tsx` | Edit button | Add `aria-label="Edit {item.name}"` |
| `ListEditor.tsx` | Delete button | Add `aria-label="Delete {item.name}"` |
| `SectionGroup.tsx` | Expand/collapse | Add `aria-expanded` and `aria-label` |
| `StoreCard.tsx` | Action buttons | Add descriptive labels |

### Implementation Example

```typescript
// Before
<Checkbox
  checked={item.isChecked}
  onCheckedChange={(checked) => onToggle(item.id, !!checked)}
/>

// After
<Checkbox
  checked={item.isChecked}
  onCheckedChange={(checked) => onToggle(item.id, !!checked)}
  aria-label={`Mark ${item.name} as ${item.isChecked ? 'incomplete' : 'complete'}`}
/>
```

---

## Part 2: Loading States for Page Transitions (#28)

### Create Loading Files

Create `src/app/loading.tsx`:

```typescript
import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
```

Create `src/app/stores/loading.tsx`:

```typescript
import { Skeleton } from '@/components/ui/skeleton'

export default function StoresLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
```

Create `src/app/lists/loading.tsx`:

```typescript
import { Skeleton } from '@/components/ui/skeleton'

export default function ListsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-md" />
        ))}
      </div>
    </div>
  )
}
```

Create `src/app/households/loading.tsx`:

```typescript
// Similar skeleton structure
```

---

## Part 3: HouseholdForm Loading State (#14)

### Update HouseholdForm

```typescript
'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function HouseholdForm({ onSubmit }: HouseholdFormProps) {
  const [isPending, startTransition] = useTransition()
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      await onSubmit(formData)
    })
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* ... form fields ... */}
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? 'Creating...' : 'Create Household'}
      </Button>
    </form>
  )
}
```

---

## Acceptance Criteria

### ARIA Labels
- [ ] All checkboxes have descriptive `aria-label`
- [ ] All icon-only buttons have `aria-label`
- [ ] Expandable sections have `aria-expanded`
- [ ] Screen reader can navigate and understand all controls

### Loading States
- [ ] `loading.tsx` created for app root
- [ ] `loading.tsx` created for `/stores`
- [ ] `loading.tsx` created for `/lists`
- [ ] `loading.tsx` created for `/households`
- [ ] Page transitions show skeleton/spinner

### Form Loading
- [ ] `HouseholdForm` shows loading spinner on submit
- [ ] Submit button disabled during submission
- [ ] Loading text indicates action in progress

### General
- [ ] `npm run build` passes
- [ ] Manual accessibility audit with screen reader
- [ ] Manual test of page transition loading states

---

## Testing Checklist

- [ ] VoiceOver/NVDA can read checkbox states
- [ ] VoiceOver/NVDA announces button purposes
- [ ] Slow network shows loading states (throttle in DevTools)
- [ ] Form submission shows loading indicator

---

## Notes

- Consider automated accessibility testing with axe-core
- Loading states should match skeleton shape of actual content
- ARIA labels should be dynamic based on current state
