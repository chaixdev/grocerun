# React & Frontend Conventions

**Status:** Established  
**Category:** Frontend / React  
**Context:** Grocerun Vite 6 + React 19 + TanStack Router + Tailwind

Canonical rules for React frontend code in the Grocerun monorepo.

## File Organization

```
features/<domain>/
├── components/   # Domain-specific components
├── hooks/        # Domain-specific hooks
└── index.ts      # Public barrel exports
```

- Components and hooks colocated per feature domain.
- Barrel exports provide a clean public API per feature.
- Shared UI primitives in `components/ui/` (shadcn-style).
- Shared hooks and utilities in `core/lib/`.

## Hooks

### Mutation hook paradigms

The codebase uses three mutation hook patterns. Choose the right one:

1. **`useMutation`** — REST-based, calls API, triggers SSE resync.
   For non-local-first operations (households, stores, invitations).

2. **`useRxMutation`** — local-first RxDB write + push replication.
   For shopping-mode list item mutations.

3. **`useAddItem`** — RxDB insert (legacy). New code should migrate
   to `useRxMutation`.

All mutation hooks must accept optional `onSuccess`/`onError` callbacks
so callers can surface feedback to the user.

#### When to use each paradigm

```tsx
// --- 1. useMutation: REST API calls (households, stores, invitations) ---
// Use when the operation must be server-authoritative and the response is
// needed before we reflect the change locally. After success, a resync
// (SSE pull) is triggered to refresh RxDB caches.

import { useMutation } from "@/core/lib/useMutation"
import { api } from "@/core/lib/api"
import { resyncLists } from "@/core/rxdb"

function useCreateList() {
  return useMutation({
    mutationFn: (data: { storeId: string; name?: string }) =>
      api.post<{ id: string }>("/lists", data),
    onSuccess: () => { resyncLists() },
    onError: () => { toast.error("Failed to create list") },
  })
}

// --- 2. useRxMutation: local-first RxDB write + push replication ---
// Use when the user is in shopping mode and needs instant feedback.
// Writes go directly to the local RxDB database; push replication syncs
// to the server in the background.

import { useRxMutation } from "@/core/lib/useRxMutation"

function useToggleItem() {
  return useRxMutation<ToggleItemInput>({
    collection: "listItems",
    deriveDocId: (v) => v.itemId,
    derivePatch: ({ isChecked, purchasedQuantity }, doc) => {
      const final = purchasedQuantity ??
        (isChecked && doc.purchasedQuantity === undefined
          ? (doc.quantity as number)
          : (doc.purchasedQuantity as number | undefined))
      return { isChecked, purchasedQuantity: final }
    },
    onError: () => toast.error("Failed to update item"),
  })
}

// --- 3. useAddItem (legacy): direct RxDB insert ---
// Do NOT use for new code. It exists for the add-item flow which requires
// cross-collection logic (find-or-create item + insert list item). Future
// refactors should fold this into useRxMutation or a dedicated service.

import { useAddItem } from "@/features/lists/hooks/useAddItem"

function MyLegacyComponent() {
  const addItem = useAddItem()
  addItem.mutate(
    { listId, name: "Milk", quantity: 2 },
    { onSuccess: (result) => { /* handle ADDED / ALREADY_EXISTS / NEEDS_SECTION */ } },
  )
}
```

### Data hooks

- `useRxQuery` for real-time RxDB queries (shopping mode).
- `useQuery` from TanStack Query for server-fetched data (config/admin).
- Never mix RxDB and React Query for the same data — choose one source
  of truth per domain.

## Component Conventions

- Every async/loading component must handle three states: loading, error,
  success/empty. No component should render only a spinner forever.
- Use `@/components/ui/` for primitives, `@/features/<domain>/` for
  domain components.
- TanStack Router for routing; route files in `routes/`.
- Form state managed by React Hook Form with Zod resolvers, not manual
  `useState` per field.

## State Architecture

- **RxDB** is the primary state layer for shopping-mode data (lists,
  list items, items, sections, stores). Local-first writes with push
  replication.
- **TanStack Query** handles server-authoritative config/admin data
  (households, invitations, store management screens).
- **Zustand** or React context for ephemeral UI state only (active
  tab, sidebar open/closed, etc.). Never for domain data.

## Styling

- Tailwind CSS utility classes for all styling. No CSS modules, no
  styled-components.
- shadcn/ui primitives for consistent component foundation.
- Custom components build on shadcn/ui with Tailwind extensions.
- Dark mode via Tailwind's `dark:` variant; theme tokens in
  `tailwind.config.ts`.

## Testing

- See [Testing Standards](./testing-standards.md) for component test
  patterns (Testing Library, `userEvent`, no snapshots).

## Anti-Patterns

- **useState per form field:** Do not manage individual form fields with
  `useState`. Use React Hook Form + Zod resolver instead. Example of the
  correct pattern is `HouseholdForm.tsx` (see Reference Implementation).
- **Mixing RxDB and React Query for the same data:** Choose one source of
  truth per domain. RxDB for shopping-mode list data; TanStack Query for
  config/admin data. Never fetch the same entity through both.
- **Inline API calls in components:** Never call `fetch` or `api.get`
  directly inside a component. Always extract into a custom hook
  (see `useLists.ts` mutation pattern).
- **Components without error/empty states:** Every async component must
  handle loading, error, and empty states. A component that shows a
  spinner indefinitely is a bug. See route files for the three-state
  pattern (`isLoading` → `PageLoading`, `error` → error UI, data →
  success render).
- **Using CSS modules or styled-components:** All styling must use Tailwind
  utility classes. CSS modules and styled-components are not permitted.
  shadcn/ui primitives provide the component foundation.
- **Mutating RxDB outside a hook:** Direct `db.listItems.insert()` calls
  in component code bypass error handling, loading state, and replication
  awareness. Always wrap RxDB writes in a hook (useMutation, useRxMutation,
  or a dedicated domain hook).

## Reference Implementation

### Mutation Hook Patterns
- **useLists.ts:** `apps/web/src/features/lists/hooks/useLists.ts`
  - `useCreateList` (useMutation REST pattern): Lines 11-23
  - `useToggleItem` (useRxMutation local-first pattern): Lines 34-47
  - `useRemoveItem` (useRxMutation remove mode): Lines 69-77
- **useRxMutation:** `apps/web/src/core/lib/useRxMutation.ts` — Full implementation of the local-first mutation primitive (119 lines)
- **useMutation:** `apps/web/src/core/lib/useMutation.ts` — Full implementation of the REST mutation primitive (65 lines)
- **useRxQuery:** `apps/web/src/core/lib/useRxQuery.ts` — Centralised RxDB subscription hook (169 lines)

### Domain Components
- **ListEditor.tsx:** `apps/web/src/features/lists/components/ListEditor.tsx` — Full shopping list editor with all mutation patterns, section grouping, optimistic UI
- **ListItemRow.tsx:** `apps/web/src/features/lists/components/ListItemRow.tsx` — Optimistic checkbox + debounced quantity stepper
- **HouseholdListGroup.tsx:** `apps/web/src/features/lists/components/HouseholdListGroup.tsx`
- **ActiveListCard.tsx:** `apps/web/src/features/lists/components/ActiveListCard.tsx`
- **EditItemDialog.tsx:** `apps/web/src/features/lists/components/EditItemDialog.tsx`
- **TripSummary.tsx:** `apps/web/src/features/lists/components/TripSummary.tsx`

### Shadcn UI Primitives
- **Form:** `apps/web/src/components/ui/form.tsx` — shadcn Form wrapper for React Hook Form
- **Dialog:** `apps/web/src/components/ui/dialog.tsx`
- **Button:** `apps/web/src/components/ui/button.tsx`
- **Input:** `apps/web/src/components/ui/input.tsx`
- **Select:** `apps/web/src/components/ui/select.tsx`
- **Checkbox:** `apps/web/src/components/ui/checkbox.tsx`
- **Badge:** `apps/web/src/components/ui/badge.tsx`
- **Table:** `apps/web/src/components/ui/table.tsx`
- **Dropdown Menu:** `apps/web/src/components/ui/dropdown-menu.tsx`
- **Sonner (Toast):** `apps/web/src/components/ui/sonner.tsx`

### Shared Hooks & Utilities
- **api.ts:** `apps/web/src/core/lib/api.ts` — Fetch wrapper with token refresh and Zod validation (143 lines)
- **useRxMutation:** `apps/web/src/core/lib/useRxMutation.ts`
- **useRxQuery:** `apps/web/src/core/lib/useRxQuery.ts`
- **useMutation:** `apps/web/src/core/lib/useMutation.ts`
- **debounce.ts:** `apps/web/src/core/lib/debounce.ts`
- **time.ts:** `apps/web/src/core/lib/time.ts`

### TanStack Router Routes
- **Login route + guard:** `apps/web/src/routes/login.tsx` — Lines 5-12 (`beforeLoad` with redirect)
- **Auth guard:** `apps/web/src/core/auth/guard.ts` — `enforceAppLogin()` (7 lines)
- **Lists index:** `apps/web/src/routes/lists.tsx` — Loading, error, and empty state handling (58 lines)
- **List detail:** `apps/web/src/routes/lists_.$listId.tsx` — Loading, error, and data states (75 lines)
- **Router config:** `apps/web/src/router.ts` — `createRouter` with `defaultPendingComponent`

### React Hook Form + Zod Example
- **HouseholdForm.tsx:** `apps/web/src/features/households/components/HouseholdForm.tsx` — Canonical example of `useForm` + `zodResolver` with shadcn Form primitives (100 lines)
- **StoreForm.tsx:** `apps/web/src/features/stores/components/StoreForm.tsx` — Same pattern with Zod schema from `@grocerun/dto`
- **SectionForm.tsx:** `apps/web/src/features/stores/components/SectionForm.tsx`

### Tailwind Configuration
- **tailwind.config.ts:** `apps/web/tailwind.config.ts` — Theme tokens, custom color `tangerine`, shadcn-compatible CSS variable configuration (95 lines)
