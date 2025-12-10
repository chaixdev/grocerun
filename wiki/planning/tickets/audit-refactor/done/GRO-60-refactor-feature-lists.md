# GRO-60: Refactor Feature - Lists

**Phase:** 2 (Refactor)  
**Priority:** Medium  
**Audit Items:** #11 (Large ListEditor component)  
**Depends On:** GRO-59  
**Blocks:** GRO-63

---

## Problem

List-related code is scattered:
- `src/components/list-editor.tsx` (450+ lines, monolithic)
- `src/hooks/use-list-navigation.ts`
- `src/components/store-lists.tsx`

The ListEditor component is too large and handles multiple concerns.

---

## Solution

Create `src/features/lists/` with co-located components, hooks, and split ListEditor into smaller pieces.

---

## Implementation Steps

### 1. Create Directory Structure

```
src/features/lists/
├── index.ts              # Public exports
├── components/
│   ├── ListEditor.tsx    # Main container (slimmed down)
│   ├── ListItemRow.tsx   # Individual item row
│   ├── SectionGroup.tsx  # Section with items
│   ├── AddItemInput.tsx  # Item autocomplete wrapper
│   └── StoreLists.tsx    # Store lists view
└── hooks/
    ├── useListNavigation.ts
    └── useListEditor.ts  # Extracted state logic
```

### 2. Extract ListItemRow Component

Create `src/features/lists/components/ListItemRow.tsx`:

```typescript
interface ListItemRowProps {
  item: ListItem
  onToggle: (id: string, checked: boolean) => void
  onEdit: (item: ListItem) => void
  onDelete: (id: string) => void
  // ... other props
}

export function ListItemRow({ item, onToggle, onEdit, onDelete }: ListItemRowProps) {
  // Extract ~50 lines from ListEditor
}
```

### 3. Extract SectionGroup Component

Create `src/features/lists/components/SectionGroup.tsx`:

```typescript
interface SectionGroupProps {
  section: Section
  items: ListItem[]
  onItemToggle: (id: string, checked: boolean) => void
  // ... other props
}

export function SectionGroup({ section, items, ...props }: SectionGroupProps) {
  // Extract section rendering logic
}
```

### 4. Extract useListEditor Hook

Create `src/features/lists/hooks/useListEditor.ts`:

```typescript
export function useListEditor(listId: string) {
  // Extract state management:
  // - items state
  // - optimistic updates
  // - toggle handler
  // - edit handler
  // - delete handler
  
  return {
    items,
    sections,
    handleToggle,
    handleEdit,
    handleDelete,
    // ...
  }
}
```

### 5. Move Existing Files

```bash
mkdir -p src/features/lists/components
mkdir -p src/features/lists/hooks

mv src/hooks/use-list-navigation.ts src/features/lists/hooks/useListNavigation.ts
mv src/components/store-lists.tsx src/features/lists/components/StoreLists.tsx
```

### 6. Slim Down ListEditor

Refactor `ListEditor.tsx` to use extracted components:

```typescript
import { ListItemRow } from './ListItemRow'
import { SectionGroup } from './SectionGroup'
import { useListEditor } from '../hooks/useListEditor'
import { useListNavigation } from '../hooks/useListNavigation'

export function ListEditor({ listId }: { listId: string }) {
  const { items, sections, handleToggle, ... } = useListEditor(listId)
  const { itemRefs, handleKeyDown } = useListNavigation(items)
  
  return (
    // Much cleaner JSX using composed components
  )
}
```

### 7. Create Barrel Export

Create `src/features/lists/index.ts`:

```typescript
export { ListEditor } from './components/ListEditor'
export { StoreLists } from './components/StoreLists'
export { useListNavigation } from './hooks/useListNavigation'
```

### 8. Update Imports in App Routes

Update `src/app/lists/[listId]/page.tsx` to import from `@/features/lists`.

---

## Acceptance Criteria

- [ ] `src/features/lists/` structure created
- [ ] ListEditor split into ≤200 lines
- [ ] `ListItemRow`, `SectionGroup` extracted
- [ ] State logic moved to `useListEditor` hook
- [ ] `useListNavigation` moved to feature directory
- [ ] All imports updated
- [ ] `npm run build` passes
- [ ] List editing functionality unchanged (manual test)

---

## Testing Checklist

- [ ] Toggle item checked state
- [ ] Add new item
- [ ] Edit existing item
- [ ] Delete item
- [ ] Keyboard navigation works
- [ ] Optimistic UI with rollback
- [ ] Sections expand/collapse
