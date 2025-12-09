# GRO-61: Refactor Feature - Stores

**Phase:** 2 (Refactor)  
**Priority:** Medium  
**Audit Items:** None directly  
**Depends On:** GRO-59  
**Blocks:** GRO-63

---

## Problem

Store-related components are scattered across:
- `src/components/store-form.tsx`
- `src/components/store-list.tsx`
- `src/components/stores/StoreSettingsForm.tsx`
- `src/components/stores/StoreDeleteSection.tsx`
- `src/components/store-directory/`

---

## Solution

Consolidate into `src/features/stores/` with organized subdirectories.

---

## Implementation Steps

### 1. Create Directory Structure

```
src/features/stores/
├── index.ts              # Public exports
├── components/
│   ├── StoreCard.tsx     # Individual store display
│   ├── StoreForm.tsx     # Create/edit form
│   ├── StoreList.tsx     # List of stores
│   ├── StoreSettings/
│   │   ├── index.tsx     # Settings container
│   │   ├── SettingsForm.tsx
│   │   └── DeleteSection.tsx
│   └── StoreDirectory/
│       ├── index.tsx
│       ├── DirectoryCard.tsx
│       └── DirectoryGrid.tsx
└── hooks/
    └── useStoreAccess.ts  # (from src/lib/store-access.ts if applicable)
```

### 2. Move Components

```bash
mkdir -p src/features/stores/components/StoreSettings
mkdir -p src/features/stores/components/StoreDirectory

# Main components
mv src/components/store-form.tsx src/features/stores/components/StoreForm.tsx
mv src/components/store-list.tsx src/features/stores/components/StoreList.tsx

# Settings
mv src/components/stores/StoreSettingsForm.tsx src/features/stores/components/StoreSettings/SettingsForm.tsx
mv src/components/stores/StoreDeleteSection.tsx src/features/stores/components/StoreSettings/DeleteSection.tsx

# Directory
mv src/components/store-directory/* src/features/stores/components/StoreDirectory/
```

### 3. Create StoreSettings Index

Create `src/features/stores/components/StoreSettings/index.tsx`:

```typescript
export { StoreSettingsForm } from './SettingsForm'
export { StoreDeleteSection } from './DeleteSection'
```

### 4. Move Store Access Logic

If `src/lib/store-access.ts` contains store-specific logic:

```bash
mv src/lib/store-access.ts src/features/stores/hooks/useStoreAccess.ts
```

### 5. Create Barrel Export

Create `src/features/stores/index.ts`:

```typescript
export { StoreForm } from './components/StoreForm'
export { StoreList } from './components/StoreList'
export { StoreSettingsForm, StoreDeleteSection } from './components/StoreSettings'
// ... other exports
```

### 6. Update App Route Imports

Update pages in `src/app/stores/` to import from `@/features/stores`.

### 7. Clean Up Old Directories

Remove `src/components/stores/` and `src/components/store-directory/`.

---

## Acceptance Criteria

- [ ] `src/features/stores/` structure created
- [ ] All store components moved
- [ ] `StoreSettings` subcomponents organized
- [ ] `StoreDirectory` subcomponents organized
- [ ] All imports updated
- [ ] `npm run build` passes
- [ ] Store CRUD functionality unchanged (manual test)

---

## Testing Checklist

- [ ] View store list
- [ ] Create new store
- [ ] Edit store settings
- [ ] Delete store
- [ ] Store directory browse/search
- [ ] Add store from directory
