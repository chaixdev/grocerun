#!/bin/sh
set -e

# Path to the SQLite database
DB_FILE="/app/data/prod.db"

# Check if the database file exists
if [ ! -f "$DB_FILE" ]; then
    echo "Database file not found at $DB_FILE. Initializing..."
    
    # Run prisma db push to create the database and apply the schema
    # We use 'npx prisma db push' because we don't have migrations in the image
    # and we want to ensure the schema matches the code.
    npx prisma db push
    
    echo "Database initialized successfully."
else
    echo "Database file found at $DB_FILE. Skipping initialization."
fi

# Execute the passed command (CMD from Dockerfile)
exec "$@"
