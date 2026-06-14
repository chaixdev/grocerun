#!/bin/bash
set -e

# ── Grocerun Production Baseline Migration ──
# One-off script to bring the production database (v0.1.14) onto the Prisma
# migration track so that future deploys can use `prisma migrate deploy`.
#
# What this does:
#   1. Creates a timestamped backup of the production database
#   2. Marks migrations 1-9 as "applied" (they were already applied by v0.1.14
#      via `prisma db push` but never tracked in _prisma_migrations)
#   3. Runs `prisma migrate deploy` to apply migrations 10-16
#
# After this script completes, the DB is fully migrated and all 16 migrations
# are tracked. The docker entrypoint should then use `prisma migrate deploy`
# for all future changes.
#
# Usage:
#   ./scripts/migrate-prod-baseline.sh /path/to/prod.db
#
# Requirements:
#   - Node.js (>= 22)
#   - Prisma CLI available via npx
#   - apps/server/prisma.config.ts and apps/server/prisma/migrations/ must exist
#   - Write access to the directory containing the DB file (for backup)

DB_PATH="${1}"
if [ -z "$DB_PATH" ]; then
    echo "Usage: $0 <path-to-prod.db>"
    echo "Example: $0 /app/data/prod.db"
    exit 1
fi

if [ ! -f "$DB_PATH" ]; then
    echo "ERROR: Database not found at $DB_PATH"
    exit 1
fi

DB_DIR=$(dirname "$DB_PATH")
DB_BASENAME=$(basename "$DB_PATH")

# ── 1. Backup ──
TIMESTAMP=$(date +%s)
BACKUP_FILE="${DB_DIR}/${DB_BASENAME}.pre-v1-baseline-${TIMESTAMP}"
echo "[baseline] Creating backup: $BACKUP_FILE"
cp "$DB_PATH" "$BACKUP_FILE"
echo "[baseline] Backup created."

# ── 2. Verify migration files exist ──
MIGRATIONS_DIR="apps/server/prisma/migrations"
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "ERROR: Migrations directory not found: $MIGRATIONS_DIR"
    echo "Run this script from the monorepo root."
    exit 1
fi

CONFIG_FILE="apps/server/prisma.config.ts"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "ERROR: Prisma config not found: $CONFIG_FILE"
    exit 1
fi

# ── 3. Baseline migrations 1-9 (already applied by v0.1.14) ──
echo "[baseline] Marking existing migrations as applied..."

BASELINE_MIGRATIONS=(
    20251204112807_init_cuid
    20251204113530_add_auth_tables
    20251204122735_add_household_and_store
    20251204130126_add_sections
    20251205001321_add_list_and_item_models
    20251205225309_verify_prisma_7
    20251209222633_add_enums
    20251209235801_audit_schema_fixes
    20260105000902_reposition
)

for migration in "${BASELINE_MIGRATIONS[@]}"; do
    echo "  Marking $migration as applied..."
    DATABASE_URL="file:${DB_PATH}" \
        npx prisma migrate resolve --applied "$migration" \
        --config="$CONFIG_FILE"
done

# ── 4. Apply remaining migrations (10-16) ──
echo "[baseline] Applying remaining migrations..."
DATABASE_URL="file:${DB_PATH}" \
    npx prisma migrate deploy --config="$CONFIG_FILE"

# ── 5. Verify ──
echo "[baseline] Verifying migration status..."
DATABASE_URL="file:${DB_PATH}" \
    npx prisma migrate status --config="$CONFIG_FILE"

echo ""
echo "Done. Production database is now on the Prisma migration track."
echo "All 16 migrations are applied and tracked."
echo "The docker entrypoint should now use 'prisma migrate deploy' for future deploys."
echo ""
echo "Backup saved at: $BACKUP_FILE"
