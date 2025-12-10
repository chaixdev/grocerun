# GRO-63: Clean Up Shared Components

**Phase:** 2 (Refactor)  
**Priority:** Low  
**Audit Items:** #12 (duplicated navigation config)  
**Depends On:** GRO-60, GRO-61, GRO-62  
**Blocks:** GRO-64

---

## Problem

After feature extraction, `src/components/` should contain only:
- Shared UI primitives (`ui/`)
- Layout components (`layout/`)
- Truly shared components

Currently:
- Navigation items duplicated in `sidebar.tsx` and `bottom-nav.tsx`
- Some feature-specific components may remain

---

## Solution

1. Extract navigation config to shared location
2. Audit remaining components for proper placement
3. Ensure `src/components/` is clean

---

## Implementation Steps

### 1. Extract Navigation Config

Create `src/core/config/navigation.ts`:

```typescript
import { Home, Store, ShoppingCart, Settings } from 'lucide-react'

export const navigationItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home,
  },
  {
    title: 'Stores',
    href: '/stores',
    icon: Store,
  },
  {
    title: 'Lists',
    href: '/lists',
    icon: ShoppingCart,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
] as const

export type NavigationItem = typeof navigationItems[number]
```

### 2. Update Sidebar

Update `src/components/layout/sidebar.tsx`:

```typescript
import { navigationItems } from '@/core/config/navigation'

export function Sidebar() {
  return (
    <nav>
      {navigationItems.map((item) => (
        // ... render navigation item
      ))}
    </nav>
  )
}
```

### 3. Update Bottom Nav

Update `src/components/layout/bottom-nav.tsx`:

```typescript
import { navigationItems } from '@/core/config/navigation'

export function BottomNav() {
  return (
    <nav>
      {navigationItems.map((item) => (
        // ... render navigation item
      ))}
    </nav>
  )
}
```

### 4. Audit Remaining Components

Review `src/components/` and ensure only these remain:

```
src/components/
├── ui/              # shadcn primitives (keep as-is)
├── layout/          # Header, Sidebar, BottomNav, ResponsiveShell
├── mode-toggle.tsx  # Theme toggle (shared)
├── theme-provider.tsx  # Theme context (shared)
└── user-nav.tsx     # User menu (shared, used in header)
```

### 5. Move Misplaced Components

If any feature-specific components remain, move to appropriate feature:

```bash
# Example: if settings-form.tsx is here
mv src/components/settings-form.tsx src/features/settings/components/SettingsForm.tsx
```

### 6. Update Core Config Index

Add navigation to `src/core/config/index.ts`:

```typescript
export { env } from './env'
export { appConfig } from './app'
export { navigationItems } from './navigation'
```

---

## Acceptance Criteria

- [ ] Navigation config centralized in `src/core/config/navigation.ts`
- [ ] `Sidebar` and `BottomNav` use shared config
- [ ] No feature-specific components in `src/components/`
- [ ] `src/components/` contains only shared UI and layout
- [ ] `npm run build` passes
- [ ] Navigation works identically (manual test)

---

## Final src/components/ Structure

```
src/components/
├── ui/
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ... (shadcn primitives)
├── layout/
│   ├── header.tsx
│   ├── sidebar.tsx
│   ├── bottom-nav.tsx
│   └── responsive-shell.tsx
├── mode-toggle.tsx
├── theme-provider.tsx
└── user-nav.tsx
```
