# Prisma & Database Conventions

**Status:** Established  
**Category:** Data / Persistence  
**Context:** Grocerun monorepo Prisma + SQLite

Canonical rules for database access in the Grocerun monorepo. These are
enforceable — code review should flag violations.

## Soft-Delete

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
- See [Soft-Delete Cascade](../technical-design/soft-delete-cascade.md)
  for the full cascade order and restore-on-create pattern.

## Queries

- Use `findFirst` + `deleted: false` for lookups that expect one result.
- Use `findMany` + `deleted: false` + access filters for list queries.
- Never `select *` — always specify `select` or `include` fields.
  Explicit field selection prevents over-fetching and makes the query
  contract visible to reviewers.
- `_count` on relations should also filter `deleted: false` where applicable.

## Transactions

- Use `$transaction` for multi-step mutations (create + update, or
  check-then-write patterns susceptible to TOCTOU).
- Interactive transactions (`$transaction(async (tx) => { ... })`)
  preferred over batch for readability.
- Transactions that touch multiple domain models must follow cascade
  order (child records first, parent last).

## Migrations

- Migrations live in `prisma/migrations/` — never edit existing migrations.
- Schema changes require a new migration via `npx prisma migrate dev --name <desc>`.
- Migration names use kebab-case: `add-household-created-by`.
- Review the generated SQL before committing — Prisma's migration engine
  can produce surprising DDL for certain schema changes.

## Schema Design

- Prefer `@relation` fields with explicit `fields` and `references`.
- Use `onDelete: Cascade` only for non-domain-model relations (e.g.,
  `RefreshToken` → `User`). Domain models use soft-delete cascades.
- Enum fields should be `String` with validation, not native Prisma enums
  (Prisma enums are hard to evolve without dropping/recreating).

## Access Control in Queries

- Every query that returns domain data must scope by access:
  - `householdId` for household-scoped resources
  - `store.householdId` for store-scoped resources
- Never return data from another household. Use `verifyHouseholdAccess()`
  or `verifyStoreAccess()` before queries, not after.

## Implementation Rules

1. **Filter `deleted: false` on every query** — Every `findFirst`, `findMany`, `findUnique`, or `count` against a domain model must include `where: { deleted: false }`. The only exception is `Invitation` (status lifecycle per ADR 007).

2. **Always scope queries by household/store access** — Call `verifyHouseholdAccess()` or `verifyStoreAccess()` before any domain query. Never return data from another household.

3. **Prefer `findFirst` over `findUnique` for domain lookups** — `findFirst` natively supports `where: { deleted: false }`; `findUnique` requires a separate filter step. Use `findUnique` only for non-domain models (Account, Session, VerificationToken) or when querying by a truly unique token.

4. **Always specify `select` or `include`** — Never omit field selection. Explicit selects make the query contract visible and prevent over-fetching. For fieldsets reused across methods, define a shared `select` object.

5. **Use `$transaction` for multi-step mutations** — Any operation that combines a read-then-write (TOCTOU-susceptible) or touches multiple models in a single request must be wrapped in `$transaction`. Use interactive transactions (`$transaction(async (tx) => { ... })`) for complex flows; use batch arrays for simple parallel updates.

6. **Cascade order: children first, parent last** — When soft-deleting a parent, delete children before the parent to avoid FK constraint violations. The canonical order is `ListItem → List → Item → Section → Store → Household`.

7. **Never edit existing migrations** — All schema changes go through `npx prisma migrate dev --name <desc>`. Review generated SQL before committing.

8. **Use String enums, not native Prisma enums** — Native Prisma enums require a migration to add/remove values. Use `String` fields with Zod validation at the API boundary instead.

9. **Verify ownership for destructive household operations** — `deleteHousehold` must check `ownerId` and member count before cascading. `renameHousehold` must check `ownerId`. Non-owners must not delete or rename.

10. **Restore soft-deleted rows on create** — Before inserting a new row with a natural key, check for a matching soft-deleted row and restore it (set `deleted: false`, `deletedAt: null`). This preserves ID continuity for the sync protocol.

## Anti-Patterns

- **Omitting `deleted: false` in queries** — The most common bug. Soft-deleted rows leak into API responses, causing ghost data in the client. Code review must flag any `findFirst`/`findMany`/`findUnique` on a domain model without `where: { deleted: false }`.

- **Using raw SQL / query building instead of Prisma** — Prisma's generated client is the only approved data-access layer. Raw `$queryRaw` or `$executeRaw` bypasses type safety, schema validation, and the soft-delete convention. SQLite-specific syntax (e.g., `LIKE`, `LOWER`) in raw queries must be isolated to proven-performance search endpoints (e.g., `items.service.ts:59-75`) and must still include `deleted = 0`.

- **`select *` / omitting `select`** — Returns all columns including internal fields (`createdAt`, `updatedAt`, `deleted`, `deletedAt`). Breaks the REST contract, over-fetches over the wire, and hides the query's data contract from reviewers.

- **Not using `$transaction` for check-then-write** — Two concurrent requests can both pass a read check (e.g., "item not in list") and both insert, causing a `P2002` unique-constraint error or duplicate data. Wrapping the check + write in `$transaction` eliminates the TOCTOU race.

- **Bypassing access checks** — Calling Prisma directly without `verifyStoreAccess()` or `verifyHouseholdAccess()` first. Even if the service "knows" the user owns the resource, always verify. Never trust caller context from the controller layer.

- **Batch `$transaction` with dependent writes** — Using the batch-array form (`prisma.$transaction([...])`) when later operations depend on earlier results (e.g., using a newly created ID). Use interactive transactions (`async (tx) => { ... }`) for dependent steps.

- **Calling cascade functions outside a transaction** — `cascadeSoftDeleteStore` and `cascadeSoftDeleteHousehold` receive a `Prisma.TransactionClient` parameter. Passing the bare `PrismaService` (not a `TransactionClient`) causes each `updateMany` to auto-commit independently, risking partial cascades.

- **Editing existing migration files** — Rewriting a committed migration changes the migration history chain and can break `prisma migrate` for other developers. Always create a new migration.

- **Native Prisma enums for domain status fields** — Adding/removing enum values requires a migration and may fail on SQLite. Use `String` with Zod validation at the DTO layer instead.

## Reference Implementation

### Prisma Schema
*   **Full schema:** `apps/server/prisma/schema.prisma`
    *   Soft-delete fields on all 6 domain models: lines 34–35 (Household), 53–54 (Store), 69–70 (Section), 88–89 (Item), 112–113 (List), 140–141 (ListItem)
    *   Invitation status lifecycle (no soft-delete): lines 185–209
    *   Composite unique constraints with `deleted`: line 95 (`@@unique([storeId, name, deleted])` on Item), line 143 (`@@unique([listId, itemId, deleted])` on ListItem)
    *   String enums via `ListStatus`: lines 122–126

### Soft-Delete Cascade
*   **`cascadeSoftDeleteStore`:** `apps/server/src/shared/cascade-soft-delete.ts:11-54` — Cascades `ListItem → List → Item → Section → Store` inside a transaction
*   **`cascadeSoftDeleteHousehold`:** `apps/server/src/shared/cascade-soft-delete.ts:62-83` — Cascades all stores via `cascadeSoftDeleteStore`, then soft-deletes the household

### Access Control
*   **`verifyStoreAccess`:** `apps/server/src/shared/access.service.ts:13-35` — `findFirst` with `deleted: false` + nested `select` to check household membership
*   **`verifyHouseholdAccess`:** `apps/server/src/shared/access.service.ts:41-59` — Same pattern for household-scoped resources

### Query Patterns (findFirst / findMany with `deleted: false` + explicit select)
*   **Explicit `select`:** `apps/server/src/stores/stores.service.ts:42-51` (`getStore` — `findFirst` with 5-field `select`)
*   **Nested `include` with child `deleted: false`:** `apps/server/src/lists/lists.service.ts:103-131` (`getList` — sections + items filtered)
*   **`_count` with relation:** `apps/server/src/lists/lists.service.ts:75-83` (`getLists` — `include: { _count: { select: { items: true } } }`)
*   **Deep nested access filter:** `apps/server/src/household-overview/household-overview.service.ts:11-43` — `findMany` with nested `stores.deleted: false` and `lists.deleted: false`
*   **`findUniqueOrThrow` with `select`:** `apps/server/src/users/users.service.ts:10-18`
*   **`findMany` with `take`, `orderBy`, and `select`:** `apps/server/src/items/items.service.ts:84-103` (`getTopItems`)
*   **Raw SQL with soft-delete guard:** `apps/server/src/items/items.service.ts:59-75` (`searchItems` — `$queryRaw` with `deleted = 0`)

### $transaction Examples
*   **Interactive — addItemToList (restore-on-create):** `apps/server/src/lists/lists.service.ts:148-234` — Reads, writes, restores soft-deleted rows, all inside a single transaction
*   **Interactive — completeList:** `apps/server/src/lists/lists.service.ts:366-384` — Updates list status and increments catalog item stats
*   **Interactive — deleteStore with cascade:** `apps/server/src/stores/stores.service.ts:94-96`
*   **Interactive — deleteSection with child nulling:** `apps/server/src/sections/sections.service.ts:98-109`
*   **Batch array — reorderSections:** `apps/server/src/sections/sections.service.ts:132-139`
*   **Batch array — joinHousehold:** `apps/server/src/invitations/invitations.service.ts:98-112`

### Migrations
*   **Migration directory:** `apps/server/prisma/migrations/` (17 migration directories, kebab-case naming)
*   **Soft-delete migration:** `apps/server/prisma/migrations/20260323120224_add_soft_delete_columns/migration.sql` — Additive `ALTER TABLE ADD COLUMN` for all 6 domain models
*   **Unique constraint with deleted:** `apps/server/prisma/migrations/20260610004857_add_deleted_to_unique_constraints/migration.sql`

### Tests
*   **Soft-delete smoke tests:** `apps/server/test/smoke/soft-delete.spec.ts` — 4 test suites covering cascade, restore-on-create, and FK safety
