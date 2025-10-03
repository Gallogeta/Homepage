#!/bin/bash

# Database Backup Script
# This script backs up the SQLite database and optionally uploads to a remote location

set -e

echo "💾 Database Backup Tool"
echo "======================"
echo ""

# Configuration
BACKUP_DIR="/mnt/data/Homepage/backups"
DB_PATH="/var/lib/docker/volumes/homepage_db_data/_data/db.sqlite3"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="homepage_db_backup_${TIMESTAMP}.sqlite3"
KEEP_DAYS=30  # Keep backups for 30 days

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "📊 Database Information:"
echo "  Source: $DB_PATH"
echo "  Destination: $BACKUP_DIR/$BACKUP_FILE"
echo "  Timestamp: $TIMESTAMP"
echo ""

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Error: Database file not found at $DB_PATH"
    exit 1
fi

# Get database size
DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
echo "  Database size: $DB_SIZE"
echo ""

# Perform backup using SQLite's backup command (ensures consistency)
echo "🔄 Creating backup..."
docker exec homepage_backend sqlite3 /app/data/db.sqlite3 ".backup /app/data/backup_temp.sqlite3"

# Copy backup to host
echo "📦 Copying backup to host..."
sudo docker cp homepage_backend:/app/data/backup_temp.sqlite3 "$BACKUP_DIR/$BACKUP_FILE"

# Clean up temporary backup inside container
docker exec homepage_backend rm -f /app/data/backup_temp.sqlite3

# Set proper permissions
sudo chown gallo:gallo "$BACKUP_DIR/$BACKUP_FILE"
chmod 600 "$BACKUP_DIR/$BACKUP_FILE"

# Verify backup
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo "✅ Backup created successfully!"
    echo "  File: $BACKUP_FILE"
    echo "  Size: $BACKUP_SIZE"
    echo "  Location: $BACKUP_DIR"
else
    echo "❌ Error: Backup file was not created!"
    exit 1
fi

# Get table statistics
echo ""
echo "📈 Database Statistics:"
docker exec homepage_backend sqlite3 /app/data/db.sqlite3 "
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Pages: ' || COUNT(*) FROM pages;
SELECT 'Audit Logs: ' || COUNT(*) FROM audit_logs;
"

# Clean up old backups
echo ""
echo "🗑️  Cleaning up old backups (older than $KEEP_DAYS days)..."
find "$BACKUP_DIR" -name "homepage_db_backup_*.sqlite3" -type f -mtime +$KEEP_DAYS -delete
REMAINING=$(find "$BACKUP_DIR" -name "homepage_db_backup_*.sqlite3" -type f | wc -l)
echo "  Backups remaining: $REMAINING"

# List recent backups
echo ""
echo "📁 Recent backups:"
ls -lht "$BACKUP_DIR"/homepage_db_backup_*.sqlite3 | head -5 | awk '{print "  " $9 " (" $5 ", " $6 " " $7 ")"}'

echo ""
echo "✅ Backup complete!"
echo ""
echo "💡 To restore a backup:"
echo "   1. Stop the containers: docker-compose down"
echo "   2. Copy backup: sudo cp $BACKUP_DIR/<backup-file> $DB_PATH"
echo "   3. Set permissions: sudo chown gallo:gallo $DB_PATH"
echo "   4. Start containers: docker-compose up -d"
