#!/bin/bash
# Database backup script

# Colors
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "═══════════════════════════════════════════"
echo "   ___   _   _    _    ___   ___  ___ _____ _   "
echo "  / __| /_\ | |  | |  / _ \ / _ \| __|_   _/_\  "
echo " | (_ |/ _ \| |__| |_| (_) | (_) | _|  | |/ _ \ "
echo "  \___/_/ \_\____|____\___/ \___/|___| |_/_/ \_\\"
echo ""
echo "         Made by GALLOGETA"
echo "═══════════════════════════════════════════"
echo -e "${NC}"
echo ""

BACKUP_DIR="/home/gallo/Code/Homepage/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📦 Creating database backup..."

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup database from Docker volume
docker exec homepage_backend sqlite3 /app/data/db.sqlite3 ".backup /app/data/backup_${TIMESTAMP}.db"
docker cp homepage_backend:/app/data/backup_${TIMESTAMP}.db $BACKUP_DIR/
docker exec homepage_backend rm /app/data/backup_${TIMESTAMP}.db

# Backup uploads/media if they exist
if docker exec homepage_backend test -d /app/uploads; then
    echo "📁 Backing up media files..."
    docker cp homepage_backend:/app/uploads $BACKUP_DIR/uploads_${TIMESTAMP}
fi

echo "✅ Backup completed!"
echo "   Database: $BACKUP_DIR/backup_${TIMESTAMP}.db"
echo "   Media: $BACKUP_DIR/uploads_${TIMESTAMP}/"
