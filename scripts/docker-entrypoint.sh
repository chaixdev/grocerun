#!/bin/sh
set -e

# ── Grocerun Entrypoint ──
# Prepares the SQLite database, applies the server Prisma schema, then starts
# the NestJS process. Nest serves both the /api/v1 API and the Vite-built SPA.

# ── 1. Database setup ──

if [ -n "$DATABASE_URL" ]; then
    case "$DATABASE_URL" in
        file:*)
            clean_url="${DATABASE_URL#file:}"
            DB_FILE="${clean_url%%\?*}"
            echo "[init] Using database: $DB_FILE"
            ;;
        /*|./*|../*)
            DB_FILE="$DATABASE_URL"
            export DATABASE_URL="file:${DB_FILE}"
            echo "[init] Using database: $DB_FILE (normalized)"
            ;;
        *)
            echo "[init] CRITICAL: Unsupported DATABASE_URL scheme: ${DATABASE_URL%%:*}"
            exit 1
            ;;
    esac
else
    DB_FILE="${DB_FILE:-/app/data/prod.db}"
    export DATABASE_URL="file:${DB_FILE}"
    echo "[init] Using default database: $DB_FILE"
fi

DB_DIR=$(dirname "$DB_FILE")
mkdir -p "$DB_DIR"

if [ ! -w "$DB_DIR" ]; then
    echo "[init] CRITICAL: Directory $DB_DIR is not writable."
    echo "Please ensure the volume is mounted with correct permissions (uid: 1001, gid: 1001)."
    exit 1
fi

# ── 2. Database backup before schema changes ──

if [ -f "$DB_FILE" ]; then
    CURRENT_MD5=$(md5sum "$DB_FILE" | awk '{print $1}')
    LATEST_BACKUP=$(ls -t /app/data/grocerun_*.db 2>/dev/null | head -n 1)

    SHOULD_BACKUP=true
    if [ -n "$LATEST_BACKUP" ]; then
        LATEST_MD5=$(md5sum "$LATEST_BACKUP" | awk '{print $1}')
        if [ "$CURRENT_MD5" = "$LATEST_MD5" ]; then
            echo "[init] Database unchanged since last backup. Skipping."
            SHOULD_BACKUP=false
        fi
    fi

    if [ "$SHOULD_BACKUP" = true ]; then
        VERSION="${APP_VERSION:-unknown}"
        TIMESTAMP=$(date +%s)
        BACKUP_FILE="/app/data/grocerun_${VERSION}_${TIMESTAMP}.db"

        echo "[init] Creating backup: $BACKUP_FILE"
        if ! cp "$DB_FILE" "$BACKUP_FILE"; then
            echo "[init] CRITICAL: Backup failed. Possible disk space issue."
            exit 1
        fi

        # Rotate: keep last 5 backups.
        ls -t /app/data/grocerun_*.db 2>/dev/null | tail -n +6 | while read -r file; do
            echo "[init] Rotating old backup: $file"
            rm -f "$file"
        done
    fi
else
    echo "[init] No existing database. A new one will be created."
fi

# ── 3. Apply database schema ──
# Uses Prisma Migrate (not db push) for deterministic, versioned migrations.
# Safe for fresh deploys (runs all migrations) and existing DBs (only runs unapplied ones).

echo "[init] Applying database migrations..."
if ! npx prisma migrate deploy --config=apps/server/prisma.config.ts 2>&1; then
    echo "[init] CRITICAL: Database migration failed."
    exit 1
fi
echo "[init] Database migrations applied."

# ── 4. Runtime frontend config ──

CONFIG_JS_PATH="/app/apps/web/dist/config.js"
echo "[init] Writing runtime frontend config: $CONFIG_JS_PATH"
node <<'NODE'
const fs = require('node:fs');

const configPath = '/app/apps/web/dist/config.js';
const config = {
  clientId: process.env.OIDC_CLIENT_ID || process.env.VITE_OIDC_CLIENT_ID || '',
  clientSecret:
    process.env.OIDC_CLIENT_SECRET ||
    process.env.VITE_OIDC_PUBLIC_VALUE ||
    process.env.VITE_OIDC_CLIENT_SECRET ||
    '',
};

if (process.env.NODE_ENV === 'production' && !config.clientId) {
  console.warn('[init] WARNING: OIDC_CLIENT_ID is not set — frontend OIDC will fail.');
}

fs.writeFileSync(
  configPath,
  `window.__GROCERUN_CONFIG__ = ${JSON.stringify(config)};\n`,
  'utf8',
);
NODE

# ── 5. Start NestJS server ──

echo "[init] Starting Grocerun on port ${PORT:-3000}..."
exec "$@"
