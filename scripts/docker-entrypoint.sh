#!/bin/sh
set -e

# Path to the SQLite database
DB_FILE="/app/data/prod.db"

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
        cp "$DB_FILE" "$BACKUP_FILE"
        
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
npx prisma db push
echo "Database schema synchronized."

# Execute the passed command (CMD from Dockerfile)
exec "$@"
