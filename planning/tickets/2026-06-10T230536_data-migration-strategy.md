# Data Migration Strategy — Pre-Phase-1 → 1.0.0

> Status: Planned | Priority: 🟡 Medium | Effort: L

## Problem

The production version currently deployed is **pre-Phase 1** — before the
major monorepo refactor, before soft-delete, before the sync engine, and
using a significantly different schema and app architecture.

The end target is a **Vite/Vanilla React SPA** (not Next.js), backed by
the NestJS API server — meaning the current Next.js-based Docker/deployment
pipeline will also change.

There is no validated migration path from the production schema to the
current 1.0.0-alpha target schema.

## Key Gaps

| Layer | Production (pre-Phase 1) | Target (1.0.0-alpha) |
|-------|--------------------------|----------------------|
| Frontend | Pre-refactor app | Vite/Vanilla React SPA |
| Backend | Pre-refactor API | NestJS 10 with sync engine |
| Schema | Pre-soft-delete, pre-sync | Soft-delete, sync indexes, `@@unique` with `deleted` |
| Auth | Pre-JWT? | JWT via `/api/token` |
| Deployment | Unknown | Docker + `ghcr.io` + Watchtower (current) |

## Structural Gap Analysis

| Change | Migration difficulty | Risk |
|--------|---------------------|------|
| Soft-delete columns (`deleted`, `deletedAt`) | `ALTER TABLE ADD COLUMN` with defaults | Low |
| `@@unique` now includes `deleted` | **Hard** — SQLite can't alter unique constraints; must drop/recreate table or index. Structurally different constraints. | **High** |
| `Household.ownerId` non-nullable | Must backfill a valid owner for existing rows before `NOT NULL` | Medium |
| FK indexes | `CREATE INDEX` additions — safe | Low |
| `purchaseCount`, `lastPurchased`, `defaultUnit` on Item | New nullable columns with defaults — safe | Low |
| `List.assignedTo` | New nullable column — safe | Low |
| `Invitation` table | New table — safe | Low |
| Sync indexes (`@@index([updatedAt, id])`) | `CREATE INDEX` additions — safe | Low |

The unique constraint gap is the hard part: production likely has
`@@unique([storeId, name])` without `deleted`. The new schema allows
same-name re-creation after soft-delete. These are structurally incompatible
and `prisma db push` with `--accept-data-loss` will silently drop the old
constraint and create the new one.

## Scope

### 1. Audit the production schema

- Get a snapshot/copy of the production SQLite database
- Write an automated audit script that:
  - Dumps the schema (`PRAGMA table_info()` etc.)
  - Compares against current `schema.prisma`
  - Reports columns, constraints, and data volume per table
- Output: a precise gap report (which columns missing, which constraints differ)

### 2. Migration path: Custom migration script

`prisma db push --accept-data-loss` is insufficient — the unique constraint
change is structural and data-lossy. Options:

- **A) `prisma db push`** — Rejected. Structural constraint changes will
  drop and recreate indexes silently.
- **B) Prisma migrations from a baseline** — Rejected. Migrations start from
  `20251204`; production predates those. No clean baseline to diff from.
- **C) Custom migration script** — **Selected.** Explicit control over every
  step, testable, auditable. Schema:
  1. Backup production DB
  2. Add soft-delete columns (`ALTER TABLE ADD COLUMN` with defaults)
  3. Rebuild affected tables with new unique constraints
     (SQLite `CREATE TABLE AS... DROP... RENAME` pattern)
  4. Backfill `ownerId` before making it non-nullable
  5. Add FK indexes and sync indexes
  6. Add new columns (`purchaseCount`, `lastPurchased`, `defaultUnit`, `assignedTo`)
  7. Create `Invitation` table
  8. Run health check: start NestJS, smoke-test key endpoints

### 3. Sequencing: Vite SPA first, then migration

The Vite SPA refactor and the data migration are **adjacent** — they touch
no overlapping concern. The schema + API layer is identical in both
deployments.

**Why Vite first:**
- The Vite refactor carries **zero data risk** — if the SPA doesn't load,
  revert the Docker image.
- Running the migration against the final Vite deployment means: one
  validation cycle, not two.
- If migration + Vite switch happen together and something breaks, you're
  bisecting two changes. Sequencing eliminates the variable.

**Why audit + migration together (after Vite):**
- The audit is only useful once you have the production DB copy. Writing
  the script now without the DB is speculative — it can't be tested or
  validated.
- Once the DB copy is in hand, the audit report feeds directly into the
  migration script design. They're a single workstream: audit → gap report
  → migration script → validate.

| Order | Workstream | Depends on |
|-------|-----------|------------|
| 1 | Vite SPA refactor | Nothing |
| 2 | Audit + migration script + validation | Prod DB copy + Vite deployed |
| 3 | Production migration | All of the above |

### 4. Validation process

- Copy production DB → run migration script → start NestJS → smoke test
- Automate as a repeatable script (CI or documented manual runbook)
- Acceptance criteria: all REST API endpoints return valid data for existing
  entities; no constraint violations; sync engine starts cleanly

### 5. Rollback strategy

- Entrypoint already backs up DB before schema changes (last 5 snapshots rotated)
- Migration script should create an explicit pre-migration backup with a
  labeled filename (`grocerun_pre-migration_<timestamp>.db`)
- Dry-run against a copy first — never mutate the original until validation
  passes on the copy
- No automated restore currently; manual restore from backup file is the
  fallback

## Implementation Notes

- **Script language:** TypeScript (Node.js) using `better-sqlite3` — consistent
  with the monorepo, already a dependency
- **Schema in `apps/web/prisma/schema.prisma`**, symlinked from
  `apps/server/prisma/schema.prisma`
- **Migrations (16 total):** `apps/server/prisma/migrations/` — from
  `20251204_init_cuid` through `20260610_make_household_ownerId_required`
- **Entrypoint:** `scripts/docker-entrypoint.sh` — currently uses
  `prisma db push --accept-data-loss`. After migration script is validated,
  the entrypoint should use it instead for production deploys.

## Related

- **Next.js → Vite SPA rationale:** `2026-06-09T225645_dependency-cleanup-audit.md`
- **Group A unique constraint fix:** `2026-06-10T003629_domain-model-audit-fixes.md`
- **Entrypoint:** `scripts/docker-entrypoint.sh`
- **Schema:** `apps/web/prisma/schema.prisma`
- **Migrations:** `apps/server/prisma/migrations/`
