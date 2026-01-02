# GRO-53: Refactor Folder Structure (Feature-Based Architecture)

## Problem
The current project structure follows a "Layer-Based" approach (`components`, `hooks`, `lib`), which has led to:
1.  **Context Switching**: Related code (e.g., `list-editor.tsx` and `use-list-navigation.ts`) is scattered across the file tree.
2.  **Bloated Components**: Feature-specific monolithic components sit alongside generic UI primitives.
3.  **Root Clutter**: Auth and config files are floating at the root of `src/`.

## Goal
Transition to a **Feature-Based** (or Hybrid) architecture to improve navigability and scalability.

## Proposed Structure
```text
src/
├── app/                  # Routes (Keep as is, but make page.tsx files thin wrappers)
├── actions/              # Server Actions
├── core/                 # (Renamed from lib) Infrastructure & Config
│   ├── auth/             # auth.ts, auth.config.ts, auth-helpers.ts
│   ├── db/               # prisma.ts, schema adaptations
│   └── config/           # app-config.ts
├── features/             # (NEW) Domain logic grouped by feature
│   ├── lists/
│   │   ├── components/   # ListEditor.tsx, ActiveListCard.tsx
│   │   ├── hooks/        # useListNavigation.ts
│   │   └── utils/        # list-specific helpers
│   ├── stores/
│   │   ├── components/   # StoreCard.tsx, StoreForm.tsx
│   │   └── ...
│   └── households/
│       ├── components/   # InvitationManager.tsx
│       └── ...
└── components/           # SHARED UI only
    ├── ui/               # Shadcn primitives (Button, Card...)
    └── layout/           # Header, ResponsiveShell, ThemeProvider
```

## Implementation Plan (Atomic Steps)
1.  **Core Infrastructure**:
    -   Create `src/core/auth`.
    -   Move `auth.ts`, `auth.config.ts`, `lib/auth-helpers.ts` to `src/core/auth`.
    -   Update imports.

2.  **Feature Migration (Lists)**:
    -   Create `src/features/lists`.
    -   Move `list-editor.tsx` and related hooks/utils.
    -   Refactor `list-editor.tsx` into smaller sub-components if needed (optional).

3.  **Feature Migration (Stores)**:
    -   Create `src/features/stores`.
    -   Move store directory components.

4.  **Feature Migration (Households)**:
    -   Create `src/features/households`.
    -   Move household management components.

## Acceptance Criteria
-   [ ] All imports are updated and the build (`npm run build`) passes.
-   [ ] `src/components` contains primarily generic UI and layout code.
-   [ ] Feature-specific logic is co-located in `src/features`.
