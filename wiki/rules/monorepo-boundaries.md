# Monorepo Boundaries

**Status:** Established  
**Category:** Architecture / Structure  
**Context:** Grocerun npm workspaces monorepo

Canonical rules for code organization and import boundaries in the
Grocerun monorepo.

## Import Rules

- **Apps must not import from each other.** `apps/web` never imports from
  `apps/server`, and vice versa. This is enforced by convention and code
  review; npm workspaces prevents cross-app package-level dependencies,
  but TypeScript imports are not automatically blocked by tooling.
- **Shared code lives in `apps/_shared/`.** Currently `apps/_shared/dtos/`
  — Zod schemas and inferred types consumed by both client and server.
- **Cross-cutting server code in `shared/`:** `AccessService`,
  `NotificationService`, shopping-lock, cascade-delete. These are
  internal to the server app.

## Package Structure

```
apps/
├── web/           # Vite SPA frontend (port 3000)
├── server/        # NestJS 11 backend (port 3001)
├── e2e/           # Playwright end-to-end tests
└── _shared/
    └── dtos/      # Shared Zod DTOs and inferred types
```

- Each app has its own `package.json`, `tsconfig.json`, and dependencies.
- The `_shared/dtos` package is a workspace dependency of both `web` and
  `server`.
- `e2e/` is an independent workspace — it does not import from `web` or
  `server`.

## Documentation Hierarchy

- **`wiki/`** — Canonical accepted truth. Architecture decisions, coding
  rules, technical designs, development guides.
- **`planning/`** — Work-in-progress and speculative. Brainstorm notes,
  tickets, review notes, user stories.
- **Promotion path:** `planning/brainstorm/` → `planning/tickets/` →
  `wiki/` (ADR, technical-design, or rules).

Only finalized, accepted work lives in `wiki/`. Everything in-progress
or speculative lives in `planning/`. Never put speculative designs in
`wiki/` directories.

## Enforcing Boundaries

- If you need code from another app, it belongs in `apps/_shared/` or
  it's a sign the boundary is wrong.
- Server code that both controllers and sync handlers need goes in
  `apps/server/src/shared/` — not exported outside the server app.
- Frontend code shared across features goes in `apps/web/src/core/` —
  not in a feature directory.

## Anti-Patterns

- **Importing from another app directly.** Using relative imports like
  `../../server/src/...` from `apps/web/` violates the fundamental
  boundary. While npm workspaces prevents packages from declaring each
  other as dependencies, TypeScript import paths are not automatically
  validated — code review is the enforcement mechanism. Boundaries must
  not be circumvented with symlinks, path aliases, or direct `node_modules`
  hacks.
- **Duplicating DTOs in client and server.** If a Zod schema or type
  is needed by both apps, it belongs in `apps/_shared/dtos/`. Copying
  the same schema into `apps/web/` and `apps/server/` creates drift and
  defeats the purpose of the monorepo.
- **Putting speculative designs in `wiki/`.** The `wiki/` tree is
  canonical accepted truth. Brainstorm notes, tickets, and reviews
  belong in `planning/`. Promoting incomplete work to `wiki/` pollutes
  the source of truth.
- **Cross-app imports via relative paths.** Even within `apps/_shared/`,
  imports should use the workspace package name (e.g., `@grocerun/dto`)
  rather than relative paths like `../../_shared/dtos/src`. This ensures
  the dependency graph is explicit and resolvable by tooling.
- **Server feature modules hoarding cross-cutting logic.** A concern
  needed by multiple server modules (e.g., access control, notifications,
  shopping-lock) must be lifted to `apps/server/src/shared/` rather than
  living in a single feature module and being imported laterally.
- **Frontend feature modules with app-wide utilities.** Shared frontend
  concerns (auth, config, API client, RxDB setup) belong in
  `apps/web/src/core/`, not buried inside a feature directory.

## Reference Implementation

### Workspace Configuration
- **Root `package.json`:** `grocerun/package.json` (Lines 6-9) — Defines `workspaces: ["apps/*", "apps/_shared/*"]`.
- **Turbo pipeline:** `grocerun/turbo.json` — Orchestrates `dev`, `build`, `test` across workspaces.

### Shared DTOs Package
- **Barrel export:** `apps/_shared/dtos/src/index.ts` (Lines 1-157) — All Zod schemas (`CreateListSchema`, `AddItemSchema`, `UpdateItemSchema`, etc.) and inferred types.
- **Package manifest:** `apps/_shared/dtos/package.json` (Lines 1-20) — Published as `@grocerun/dto`, consumed by both `web` and `server`.
- **Build config:** `apps/_shared/dtos/tsconfig.json` (Lines 1-19) — Strict TypeScript, outputs `dist/`.

### Server Shared Code (`apps/server/src/shared/`)
- **AccessService:** `apps/server/src/shared/access.service.ts` (Lines 1-82) — `verifyStoreAccess()`, `verifyHouseholdAccess()`, `assertShoppingLock()`.
- **Cascade soft-delete:** `apps/server/src/shared/cascade-soft-delete.ts` (Lines 1-42) — Recursive soft-delete helper for Prisma relations.
- **NotificationService:** `apps/server/src/shared/notification.service.ts` (Lines 1-41) — In-app notification broadcast.
- **Shopping lock:** `apps/server/src/shared/shopping-lock.ts` (Lines 1-22) — Shopping list exclusive-lock logic.
- **Shared module:** `apps/server/src/shared/shared.module.ts` (Lines 1-12) — `@Global()` module registering and exporting `AccessService`, `NotificationService`, `PrismaService`, `SseBroadcastService`.

### Web Shared Code (`apps/web/src/core/`)
- **Auth layer:** `apps/web/src/core/auth/` — OIDC (`oidc.ts`), session (`session.ts`), guard (`guard.ts`), token cache (`token-cache.ts`).
- **Config:** `apps/web/src/core/config/` — App configuration and navigation structure.
- **Diagnostics:** `apps/web/src/core/diagnostics/event-bus.ts` — Client-side event bus.
- **Lib:** `apps/web/src/core/lib/` — API client (`api.ts`), debounce (`debounce.ts`), time utilities (`time.ts`), React Query / RxDB hooks (`useMutation.ts`, `useRxMutation.ts`, `useRxQuery.ts`).
- **RxDB:** `apps/web/src/core/rxdb/` — Database setup (`database.ts`), schema (`schema.ts`), household cleanup (`household-cleanup.ts`).

### Path Aliases
- **Web tsconfig:** `apps/web/tsconfig.json` (Lines 19-23) — Maps `@/*` to `./src/*` for clean intra-app imports.
- **Server tsconfig:** `apps/server/tsconfig.json` (Line 12) — `baseUrl: "./"` for relative intra-app imports.
