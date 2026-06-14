# Coding Standards

Canonical coding standards for the Grocerun monorepo. All implementation and
review work must conform to these rules. Deviations require an ADR.

## Mandatory Rules

These rules are non-negotiable and apply across all code:

1. `strict: true` in every `tsconfig.json` — no implicit nulls
2. Zod schemas at every API boundary — trust nothing from the network
3. Every async component must handle loading, error, and success states
4. Constructor injection only in NestJS — no property injection
5. Soft-delete for all domain models — Prisma queries must filter `deleted: false`
6. Never compose user input into database query strings
7. Never log tokens, passwords, or PII
8. No `any` in production code — use `unknown` and narrow
9. Conventional commits (`feat:`, `fix:`, `refactor:`, etc.)
10. Dead code must be deleted — no commented-out blocks "just in case"

---

## TypeScript Idioms

### Strict nulls

- Enable `strict: true` in `tsconfig.json`. Never disable it.
- Prefer `??` over `||` for default values (the latter coalesces falsy values).
- Use optional chaining (`?.`) for nullable property access.

### Zod validation

- All API inputs must pass through a Zod schema in `packages/dto/`.
- Server: `createZodDto` from `nestjs-zod` + global `ZodValidationPipe`.
- Client: form schemas derive from shared DTOs via `.pick()`, `.omit()`,
  `.extend()` — never duplicate Zod schemas.
- Shared DTOs in `packages/dto/src/index.ts` are the single source of
  validation truth.

### No `any`

- Use `unknown` and narrow with type guards. `any` is a bug magnet.
- If a third-party library forces `any` (e.g., RxDB), isolate it behind a
  typed facade and keep the cast as narrow as possible.

### Discriminated unions

- Prefer discriminated unions over `switch` on strings for multi-outcome
  results. Example: `{ allowed: true } | { allowed: false; reason: '...' }`.

---

## Error Handling

### Server (NestJS)

- Throw NestJS exceptions (`NotFoundException`, `BadRequestException`,
  `ForbiddenException`, `ConflictException`). Do not return discriminated
  union error results — exceptions are the standard NestJS error model.
- Exception messages go to the client — keep them user-facing.
- For structured error data: `new BadRequestException({ statusCode: 400, code: 'NEEDS_SECTION', message })`.
- Service methods that check auth/access should be named `assert*` to
  signal they throw on failure (e.g., `assertShoppingLock`).

### Client (React)

- ApiError from `core/lib/api.ts` for HTTP errors — surface via toast or
  error boundary.
- RxDB operations: onError callbacks in `useRxMutation` / `useAddItem`
  config should toast or log.
- Async components must render error UI (not just loading spinners).

### Sync handlers

- Sync push handlers must not throw — the RxDB protocol expects conflict
  documents, not HTTP errors. Return tombstone conflicts for blocked
  operations.
- Use `checkShoppingLock()` from `shared/shopping-lock.ts` for lock checks
  in both REST and sync paths.

---

## NestJS

### Module structure

- `@Global()` modules: `AuthModule`, `SharedModule`.
- Domain modules follow the pattern: `controller` → `service` → Prisma.
- `shared/` contains cross-cutting concerns: AccessService, NotificationService,
  cascade-delete, shopping-lock.

### Controller patterns

- Class-level `@UseGuards(AuthGuard)` by default. Method-level overrides
  only when necessary.
- Use `@CurrentUser()` decorator for authenticated user access.
- Route params validated by Zod via global `ZodValidationPipe`.

### Service patterns

- Direct Prisma calls in service methods (no repository pattern — Prisma
  is the repository).
- `$transaction` for multi-step mutations that must be atomic.
- `verifyStoreAccess()` / `verifyHouseholdAccess()` before any mutation.
- `assertShoppingLock()` after access verification for list mutations.

### Validation

- `@grocerun/dto` for all input validation schemas.
- `createZodDto(Schema)` in NestJS controllers.
- Return types: prefer typed entity returns over `{ success: true }`.

---

## React & Component Structure

### File organization

```
features/<domain>/
├── components/   # Domain-specific components
├── hooks/        # Domain-specific hooks
└── index.ts      # Public barrel exports
```

- Components and hooks colocated per feature domain.
- Barrel exports provide clean public API per feature.
- Shared UI primitives in `components/ui/` (shadcn-style).
- Shared hooks in `core/lib/`.

### Hooks

- Three mutation hook paradigms:
  1. **`useMutation`** — REST-based, calls API, triggers SSE resync.
     For non-local-first operations (households, stores, invitations).
  2. **`useRxMutation`** — local-first RxDB write + push replication.
     For shopping-mode list item mutations.
  3. **`useAddItem`** — RxDB insert (legacy, migrating to `useRxMutation`).
- All hooks must accept optional `onSuccess`/`onError` callbacks.

### Component conventions

- Every async/loading component must handle three states: loading, error,
  success/empty.
- Use `@/components/ui/` for primitives, `@/features/<domain>/` for
  domain components.
- TanStack Router for routing; route files in `routes/`.

---

## Prisma & Database

### Soft-delete

All domain models use soft-delete with `deleted` + `deletedAt` columns:

```
model Store {
  // ...
  deleted    Boolean  @default(false)
  deletedAt  DateTime?
}
```

- Every Prisma query must include `where: { deleted: false }` unless
  intentionally querying deleted rows.
- The only exception is Invitations, which use a status lifecycle
  (`ACTIVE → COMPLETED/EXPIRED/REVOKED`) per ADR 007.

### Queries

- Use `findFirst` + `deleted: false` for lookups that expect one result.
- Use `findMany` + `deleted: false` + access filters for list queries.
- Never `select *` — always specify `select` or `include` fields.
- `_count` on relations should also filter `deleted: false` where applicable.

### Transactions

- Use `$transaction` for multi-step mutations (create + update, or
  check-then-write patterns susceptible to TOCTOU).
- Interactive transactions (`$transaction(async (tx) => { ... })`)
  preferred over batch for readability.

### Migrations

- Migrations live in `prisma/migrations/` — never edit existing migrations.
- Schema changes require a new migration via `npx prisma migrate dev --name <desc>`.

---

## RxDB & Local-First

### Replication

- 6 collections replicate via RxDB pull/push protocol:
  `households`, `stores`, `sections`, `items`, `lists`, `listItems`.
- Pull: checkpoint-based incremental sync via `pullByAccess()` helper.
- Push: local-first writes for shopping-mode list items. REST mutations
  for config/admin data (households, stores, invitations).
- SSE for real-time notification: `RESYNC` events trigger fresh pulls.
- Push is gated: COMPLETED lists immutable; SHOPPING locked to
  `assignedTo` user.

### Schema

- RxDB schemas in `apps/web/src/core/rxdb/schema.ts`.
- Collection types in `database.ts`: `GrocerunCollections`.
- Use `newLocalId()` for client-generated IDs (never rely on server IDs
  for local-first writes).

### Replication functions

- Keep the explicit `startXReplication` + `resyncX` pattern for each
  collection. Attempting a factory abstraction caused a request storm
  (M7 reverted) — the explicit pattern is battle-tested and stable.
- SSE auth uses token-in-query-param (EventSource limitation — accepted).

---

## Auth

- Google OIDC via `oidc-spa` only. No multi-provider support.
- Backend: JWT tokens in `Authorization: Bearer` header. `AuthGuard` +
  `@CurrentUser()` decorator. JWKS validation.
- Frontend: `@/core/auth/oidc.ts` singleton. Token in memory, Bearer on
  all API calls. SSE uses query-param token auth.
- `OIDC_CLIENT_SECRET` in browser bundle — accepted trade-off (H7).
- Shopping lock identity: `list.assignedTo` stores Google OIDC `sub`
  (not DB `userId`) because frontend only has access to
  `oidc.decodedIdToken.sub`.

---

## Monorepo Boundaries

- **apps must not import from each other.** `apps/web` never imports from
  `apps/server`, and vice versa.
- **Shared code lives in `packages/`.** Currently only `packages/dto/` —
  Zod schemas and inferred types.
- **Cross-cutting server code in `shared/`:** AccessService,
  NotificationService, shopping-lock, cascade-delete.
- **`wiki/` vs `planning/`:** `wiki/` is canonical accepted truth.
  `planning/` is work-in-progress and speculative. Promote from
  `planning/` to `wiki/` only when finalized.

---

## Logging

- Server: NestJS `Logger` with contextual prefix
  (`new Logger('ModuleName')`).
- `.catch()` blocks in fire-and-forget operations (notifications, SSE)
  must log at `warn` level — never silent.
- Never log tokens, passwords, PII, or full request bodies.
- Frontend: `console.error` for actionable errors. Diagnostics overlay
  (`@/components/diagnostics-overlay.tsx`) for dev-time event bus.

---

## Testing

See the canonical [Testing Standards](./testing-standards.md) for the
testing pyramid, tooling choices, and test organization conventions.

Key constraints:
- Vitest for unit/integration tests. Playwright for e2e smokes.
- Server tests use a real SQLite database (not mocks).
- Each domain module should have integration-tested critical paths.
- Test filenames: `*.spec.ts` for unit/integration, `*.e2e-spec.ts` for e2e.

---

## Git Conventions

- [Conventional Commits](https://www.conventionalcommits.org/):
  `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- Branch naming: `feature/<desc>`, `fix/<desc>`, `refactor/<desc>`.
- One logical change per commit. No "WIP" or "save" commits on main.
- PRs require passing typecheck and tests before merge.
