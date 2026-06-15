# NestJS Conventions

**Status:** Established  
**Category:** Backend / NestJS  
**Context:** Grocerun NestJS 11 server

Canonical rules for NestJS server code in the Grocerun monorepo.

## Module Structure

- `@Global()` modules: `AuthModule`, `SharedModule`.
- Domain modules follow the pattern: `controller` → `service` → Prisma.
- `shared/` contains cross-cutting concerns: `AccessService`,
  `NotificationService`, cascade-delete, shopping-lock.

## Controller Patterns

- Class-level `@UseGuards(AuthGuard)` by default. Method-level overrides
  only when there is a clear reason.
- Use `@CurrentUser()` decorator for authenticated user access.
- Route params validated by Zod via global `ZodValidationPipe`.
- Return typed entities, not `{ success: true }` wrappers. The HTTP
  status code carries success/failure; the body carries data.

## Service Patterns

- Direct Prisma calls in service methods — Prisma is the repository.
- `$transaction` for multi-step mutations that must be atomic.
- `verifyStoreAccess()` / `verifyHouseholdAccess()` before any mutation
  that operates on domain data.
- `assertShoppingLock()` after access verification for list mutations
  (see [Shopping Mode Lock](../technical-design/shopping-mode-lock.md)).
- Service methods that check auth/access should be named `assert*` to
  signal they throw on failure (e.g., `assertShoppingLock`).

## Validation

- Shared DTOs from `apps/_shared/dtos/` for all input validation schemas.
- `createZodDto(Schema)` in NestJS controllers — never hand-validate.
- Global `ZodValidationPipe` catches schema violations before controller
  handlers execute.
- See [DTO & API Validation](../technical-design/dto-api-validation.md)
  for the full pipeline.

## SSE Endpoints

- SSE endpoints bypass `AuthGuard` for technical reasons (EventSource
  does not support custom headers). Token auth via `?token=` query param.
- SSE connections are tracked in `SseBroadcastService` (in-memory
  `Map<userId, Set<Response>>`).
- See [SSE Resync Broadcast](../technical-design/sse-resync-broadcast.md).

## Anti-Patterns

### Property Injection Over Constructor Injection
Never use `@Inject(ServiceName)` field injection. Always use explicit
constructor injection so dependencies are visible in the class signature,
testable via the constructor, and cannot be semi-initialized.

### Returning `{ success: true }` Wrappers
The HTTP status code is the success indicator — 2xx means success, 4xx/
5xx means failure. Returning `{ success: true }` in the response body
adds noise for clients. Return the entity or `void` instead.

This anti-pattern exists in several existing services (e.g., `stores.service.ts:86`,
`sections.service.ts:113`, `households.service.ts:129`, `lists.service.ts:388`).
New endpoints must not follow this pattern.

### Hand-Validating Instead of Using Zod Pipes
Never manually check field types, parse strings to numbers, or throw
`BadRequestException` for missing fields inside a controller handler.
Define a Zod schema in `apps/_shared/dtos/`, wrap it with
`createZodDto(Schema)`, and let the global `ZodValidationPipe` catch
violations before the handler executes.

### Per-Method Auth Bypasses
Class-level `@UseGuards(AuthGuard)` should be the default. Adding
`@Public()` or similar skip-auth decorators on individual methods
weakens the security posture and should only be done when technically
unavoidable. The SSE stream endpoints are the one legitimate exception
— and even there, auth is handled inside `AuthGuard` via a query-param
fallback rather than skipping the guard entirely.

### Business Logic in Controllers
Controllers should be thin — extract a DTO from the request, call a
service method, and return the result. Any conditional branching,
database queries, or access-control checks belong in a service class.
A controller that imports `PrismaService` directly is a red flag.

### Not Using `assertShoppingLock()` After Access Checks
Every list mutation that follows a `verifyStoreAccess()` call must also
call `assertShoppingLock()` to enforce shopping-mode invariants.
Forgetting this step allows locked lists to be modified by non-holders.

## Testing

- See [Testing Standards](./testing-standards.md) for integration test
  patterns (supertest, real SQLite, `createTestApp`).

## Reference Implementation

### Auth & Guards

*   **AuthGuard:** `apps/server/src/auth/auth.guard.ts`
    *   `canActivate()` with token extraction → OIDC validation → user resolution: Lines 38-89
    *   SSE query-token fallback (when `Authorization` header is unavailable): Lines 110-117
*   **CurrentUser Decorator:** `apps/server/src/auth/current-user.decorator.ts`
    *   `@CurrentUser()` param decorator extracting `request.user`: Lines 13-17

### Controllers (Class-level `@UseGuards(AuthGuard)` + `@CurrentUser()`)

*   **ListsController:** `apps/server/src/lists/lists.controller.ts`
    *   Class-level `@UseGuards(AuthGuard)`: Line 10
    *   `@CurrentUser()` on every handler: Lines 17, 25, 33, 41, 49, 57, 65, 73, 81, 89, 97
    *   Constructor injection of `ListsService`: Line 12
*   **HouseholdsController:** `apps/server/src/households/households.controller.ts`
    *   Class-level `@UseGuards(AuthGuard)`: Line 8
    *   `@CurrentUser()` usage: Lines 13, 20, 29, 37, 45
*   **SyncController:** `apps/server/src/sync/sync.controller.ts`
    *   SSE stream endpoint with `@Req()`/`@Res()` injection: Lines 114-141
    *   Heartbeat interval and connection cleanup: Lines 131-140

### Access Control Services

*   **AccessService:** `apps/server/src/shared/access.service.ts`
    *   `verifyStoreAccess()` — store existence + household membership: Lines 13-35
    *   `verifyHouseholdAccess()` — household existence + membership: Lines 41-58
    *   `assertShoppingLock()` — shopping-mode invariant enforcement: Lines 65-81
*   **ListsService (verify + assert + transactions):** `apps/server/src/lists/lists.service.ts`
    *   Constructor injection (Prisma, Access, Notification): Lines 38-42
    *   `verifyStoreAccess()` + `assertShoppingLock()` chained: Lines 143-144
    *   `$transaction` with callback (add-item flow): Lines 148-192
    *   `$transaction` with callback (complete list + update stats): Lines 366-383

### SSE Broadcast

*   **SseBroadcastService:** `apps/server/src/sync/sse-broadcast.service.ts`
    *   In-memory `Map<userId, Set<Response>>`: Line 17
    *   `register()` — add connection, return cleanup fn: Lines 23-38
    *   `notifyChanged()` — broadcast `SYNC_CHANGED` event: Lines 40-49
    *   `notifyHouseholdRemoved()` — broadcast `HOUSEHOLD_REMOVED`: Lines 51-60

### Validation

*   **Global ZodValidationPipe:** `apps/server/src/main.ts`
    *   Imported from `nestjs-zod`: Line 4
    *   Registered globally: Line 40 (`app.useGlobalPipes(new ZodValidationPipe())`)

### Prisma `$transaction` Patterns

*   **Callback pattern** (recommended for multi-step atomic operations):
    *   `apps/server/src/lists/lists.service.ts:148` — add item to list with auto-learn unit
    *   `apps/server/src/lists/lists.service.ts:366` — complete list + update purchase stats
    *   `apps/server/src/stores/stores.service.ts:94` — cascade soft-delete store
    *   `apps/server/src/households/households.service.ts:121` — cascade soft-delete household
    *   `apps/server/src/sections/sections.service.ts:98` — delete section + nullify item refs
*   **Batch array pattern** (for homogeneous updates):
    *   `apps/server/src/sections/sections.service.ts:132` — reorder sections in one transaction
*   **Command tuple pattern** (for simple multi-table writes):
    *   `apps/server/src/invitations/invitations.service.ts:98` — add user to household + complete invitation
