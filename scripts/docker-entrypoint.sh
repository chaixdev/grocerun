#!/bin/sh
set -e

# ── Grocerun Entrypoint ──
# Starts the NestJS API server (background) and Next.js web app (foreground).
# Both share the same SQLite database via the /app/data volume.

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

if [ ! -w "$DB_DIR" ]; then
    echo "[init] CRITICAL: Directory $DB_DIR is not writable."
    echo "Please ensure the volume is mounted with correct permissions (uid: 1001, gid: 1001)."
    exit 1
fi

# ── 2. Database backup (before schema changes) ──

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
        APP_VERSION="${NEXT_PUBLIC_APP_VERSION:-unknown}"
        TIMESTAMP=$(date +%s)
        BACKUP_FILE="/app/data/grocerun_${APP_VERSION}_${TIMESTAMP}.db"

        echo "[init] Creating backup: $BACKUP_FILE"
        if ! cp "$DB_FILE" "$BACKUP_FILE"; then
            echo "[init] CRITICAL: Backup failed. Possible disk space issue."
            exit 1
        fi

        # Rotate: keep last 5 backups
        ls -t /app/data/grocerun_*.db 2>/dev/null | tail -n +6 | while read -r file; do
            echo "[init] Rotating old backup: $file"
            rm -f "$file"
        done
    fi
else
    echo "[init] No existing database. A new one will be created."
fi

# ── 3. Apply database schema ──

echo "[init] Applying database schema..."
if ! npx prisma db push --schema=apps/web/prisma/schema.prisma --url="$DATABASE_URL" 2>&1; then
    echo "[init] CRITICAL: Database migration failed."
    exit 1
fi
echo "[init] Database schema synchronized."

# ── 4. Start NestJS API server (background) ──

echo "[init] Starting API server on port 3001..."
node apps/server/dist/src/main.js &
SERVER_PID=$!

# Give the server a moment to start
sleep 1
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "[init] CRITICAL: API server failed to start."
    exit 1
fi

# Forward signals to both processes
trap "kill $SERVER_PID 2>/dev/null; exit" INT TERM

echo "[init] API server started (pid: $SERVER_PID)"

# ── 5. Start Next.js web app (foreground) ──

echo "[init] Starting web app on port 3000..."
exec "$@"
