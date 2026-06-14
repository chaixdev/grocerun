# Data Migration — v0.1.14 → 1.0.0

> Status: Implemented | Priority: 🟡 Medium | Effort: M

## Problem

The production database (v0.1.14) was shaped by `prisma db push --accept-data-loss`
and has no `_prisma_migrations` table — meaning Prisma has never tracked schema
changes against it. The schema is roughly at migration #9 of 17 (up to
`20260105000902_reposition`) but migrations 10-17 still need to be applied
(soft-delete columns, sync indexes, unique constraint updates, FK indexes,
backfill, household ownerId NOT NULL, and `assignedTo`).

The end target is the current `schema.prisma` as of 1.0.0-rc.4.

## Audit Findings

Prod DB schema inspection (June 2026, prod DB copy):

| Item | Status |
|------|--------|
| Soft-delete columns (`deleted`, `deletedAt`) on all 6 domain models | **Missing** |
| `@@unique` includes `deleted` on Item and ListItem | Prod has old constraints without `deleted` |
| `Household.ownerId` | Present but nullable (all 3 rows have values) |
| FK indexes | Missing (not auto-created by SQLite FKs) |
| Sync indexes (`@@index([updatedAt, id])`) | Missing |
| `List.assignedTo` | Missing |
| `Invitation` table | Already present |
| `Item.purchaseCount`, `lastPurchased`, `defaultUnit` | Already present |
| `_prisma_migrations` table | **Does not exist** — migrations never tracked |

Data: 5 users, 3 households, 9 stores, 31 sections, 154 items, 24 lists, 216 list items, 3 invitations. All 3 households have `ownerId` populated.

## Solution

A one-off shell script (`scripts/migrate-prod-baseline.sh`) that:

1. Creates a timestamped backup of the prod DB
2. Baselines migrations 1-9 as "applied" via `prisma migrate resolve`
3. Runs `prisma migrate deploy` to apply migrations 10-17

The entrypoint is permanently switched from `prisma db push --accept-data-loss`
to `prisma migrate deploy` for deterministic, versioned migrations going forward.

### Why this works

- Migrations 10-17 are purely additive from the prod schema's perspective
  (ALTER TABLE ADD COLUMN, CREATE INDEX, DROP/CREATE UNIQUE INDEX, table
  rebuild for NOT NULL)
- `prisma migrate deploy` only runs migrations not yet tracked in
  `_prisma_migrations` — baselining 1-9 makes it skip them
- `prisma db push` handled the unique constraint changes correctly in testing
  (confirmed against prod DB copy), but `prisma migrate deploy` is preferred
  for auditability

### Why not a custom TypeScript script

The original plan called for a custom `better-sqlite3` migration script with
manual table rebuilds. This proved unnecessary — the existing Prisma migrations
(10-17) handle all the required changes correctly against the prod schema.
Prisma's `migrate resolve` provides a clean baselining mechanism, avoiding the
need to maintain a separate migration code path.

## Validation

Tested against a copy of the production database:

- All 17 migrations applied successfully
- Zero data loss — row counts preserved across all tables
- Schema matches `schema.prisma` exactly
- Fresh deploy tested: `prisma migrate deploy` creates DB and applies all 17
  migrations from scratch

A test migration (#17, empty) is included to verify the deploy pipeline picks
up new migrations after baselining. After deploying to staging, verify with:

```bash
sqlite3 /app/data/staging.db "SELECT COUNT(*) FROM _prisma_migrations;"
# Should return 17
```

## Deployment Runbook

### Staging validation
```bash
cp /app/data/prod.db /app/data/staging.db
./scripts/migrate-prod-baseline.sh /app/data/staging.db
# Deploy rc.4 — entrypoint runs prisma migrate deploy, picks up migration 17
```

### Production
```bash
cp /app/data/prod.db /app/data/prod.db.backup
./scripts/migrate-prod-baseline.sh /app/data/prod.db
# Deploy rc.4
```

### Rollback
```bash
cp /app/data/prod.db.pre-v1-baseline-<timestamp> /app/data/prod.db
# Re-deploy previous image
```

## Related

- **Script:** `scripts/migrate-prod-baseline.sh`
- **Entrypoint:** `scripts/docker-entrypoint.sh`
- **Test migration:** `apps/server/prisma/migrations/20260614230714_test_migration_pipeline/`
- **Domain model audit:** `2026-06-10T003629_domain-model-audit-fixes.md`
