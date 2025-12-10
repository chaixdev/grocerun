# GRO-62: Refactor Feature - Households

**Phase:** 2 (Refactor)  
**Priority:** Medium  
**Audit Items:** None directly  
**Depends On:** GRO-59  
**Blocks:** GRO-63

---

## Problem

Household-related components are scattered:
- `src/components/household-form.tsx`
- `src/components/household-list.tsx`
- `src/components/household-select.tsx`
- `src/components/invitation-manager.tsx`
- `src/components/create-first-household.tsx`

---

## Solution

Consolidate into `src/features/households/` with organized structure.

---

## Implementation Steps

### 1. Create Directory Structure

```
src/features/households/
├── index.ts              # Public exports
├── components/
│   ├── HouseholdCard.tsx     # Individual household display
│   ├── HouseholdForm.tsx     # Create/edit form
│   ├── HouseholdList.tsx     # List of households
│   ├── HouseholdSelect.tsx   # Dropdown selector
│   ├── CreateFirstHousehold.tsx  # Onboarding prompt
│   └── Invitations/
│       ├── index.tsx
│       ├── InvitationManager.tsx
│       └── InvitationCard.tsx  # (if extracted)
└── hooks/
    └── useHouseholdContext.ts  # (if needed)
```

### 2. Move Components

```bash
mkdir -p src/features/households/components/Invitations

mv src/components/household-form.tsx src/features/households/components/HouseholdForm.tsx
mv src/components/household-list.tsx src/features/households/components/HouseholdList.tsx
mv src/components/household-select.tsx src/features/households/components/HouseholdSelect.tsx
mv src/components/create-first-household.tsx src/features/households/components/CreateFirstHousehold.tsx
mv src/components/invitation-manager.tsx src/features/households/components/Invitations/InvitationManager.tsx
```

### 3. Create Invitations Index

Create `src/features/households/components/Invitations/index.tsx`:

```typescript
export { InvitationManager } from './InvitationManager'
```

### 4. Create Barrel Export

Create `src/features/households/index.ts`:

```typescript
export { HouseholdForm } from './components/HouseholdForm'
export { HouseholdList } from './components/HouseholdList'
export { HouseholdSelect } from './components/HouseholdSelect'
export { CreateFirstHousehold } from './components/CreateFirstHousehold'
export { InvitationManager } from './components/Invitations'
```

### 5. Update App Route Imports

Update pages in `src/app/households/` to import from `@/features/households`.

### 6. Update Layout/Header Imports

If `HouseholdSelect` is used in header/layout, update those imports.

---

## Acceptance Criteria

- [ ] `src/features/households/` structure created
- [ ] All household components moved
- [ ] Invitations subcomponents organized
- [ ] All imports updated
- [ ] `npm run build` passes
- [ ] Household CRUD functionality unchanged (manual test)

---

## Testing Checklist

- [ ] View household list
- [ ] Create new household
- [ ] Rename household
- [ ] Delete household
- [ ] Switch between households
- [ ] Create invitation
- [ ] View pending invitations
- [ ] Accept/decline invitation
