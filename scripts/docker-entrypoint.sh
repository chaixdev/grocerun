#!/bin/sh
set -e

# Path to the SQLite database
DB_FILE="/app/data/prod.db"
DB_DIR="/app/data"

# FORCE DATABASE_URL to match the managed DB_FILE
# This prevents accidental usage of dev databases from injected .env files
export DATABASE_URL="file:${DB_FILE}"

# Health Check 1: Permissions
if [ ! -w "$DB_DIR" ]; then
    echo "CRITICAL ERROR: Directory $DB_DIR is not writable."
    echo "Please ensure the volume is mounted with correct permissions (uid: 1001, gid: 1001)."
    exit 1
fi

# Check if the database file exists
if [ -f "$DB_FILE" ]; then
    CURRENT_MD5=$(md5sum "$DB_FILE" | awk '{print $1}')
    # Find most recent backup of pattern grocerun_*.db
    LATEST_BACKUP=$(ls -t /app/data/grocerun_*.db 2>/dev/null | head -n 1)
    
    SHOULD_BACKUP=true
    
    if [ -n "$LATEST_BACKUP" ]; then
        LATEST_MD5=$(md5sum "$LATEST_BACKUP" | awk '{print $1}')
        if [ "$CURRENT_MD5" = "$LATEST_MD5" ]; then
             echo "Database content unchanged from last backup ($LATEST_BACKUP). Skipping backup."
             SHOULD_BACKUP=false
        fi
    fi

    if [ "$SHOULD_BACKUP" = true ]; then
        APP_VERSION="${NEXT_PUBLIC_APP_VERSION:-unknown}"
        TIMESTAMP=$(date +%s)
        BACKUP_FILE="/app/data/grocerun_${APP_VERSION}_${TIMESTAMP}.db"
        
        echo "Creating database backup at $BACKUP_FILE..."
        if ! cp "$DB_FILE" "$BACKUP_FILE"; then
             echo "CRITICAL ERROR: Failed to create backup. Possible disk space issue."
             exit 1
        fi
        
        # Rotate backups: keep last 5
        ls -t /app/data/grocerun_*.db 2>/dev/null | tail -n +6 | while read -r file; do
             echo "Rotating old backup: $file"
             rm -f "$file"
        done
    fi
else
    echo "Database file not found at $DB_FILE. A new one will be created."
fi

# Always run prisma db push to ensure schema synchronization
echo "Applying database migrations..."
if ! npx prisma db push; then
    echo "CRITICAL ERROR: Database migration failed."
    echo "Check the logs above for Prisma errors. The container will now exit to trigger a restart/rollback."
    exit 1
fi
echo "Database schema synchronized."

# Execute the passed command (CMD from Dockerfile)
exec "$@"
