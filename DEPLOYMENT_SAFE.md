# Manual Deployment Guide - Preserving Existing Database

## Before Deployment

### 1. Backup Current Data
```bash
# Backup database
./backup-db.sh

# Or manually:
docker exec homepage_backend sqlite3 /app/data/db.sqlite3 ".backup /app/data/backup.db"
docker cp homepage_backend:/app/data/backup.db ./backups/
```

### 2. Check Current Volumes
```bash
docker volume ls | grep homepage
# You should see:
# - homepage_db_data
# - homepage_uploads_data
# - homepage_frontend_build
```

## Deployment Process

### 3. Pull Latest Code
```bash
cd /home/gallo/Code/Homepage
git pull origin main
```

### 4. Stop Containers (Keep Volumes!)
```bash
# IMPORTANT: Do NOT use -v flag!
docker-compose down
# This stops containers but keeps volumes
```

### 5. Rebuild Images
```bash
docker-compose build --no-cache
```

### 6. Start Containers
```bash
docker-compose up -d
```

### 7. Sync Frontend Build
```bash
cd frontend
npm run build
sudo cp -r dist/* /var/lib/docker/volumes/homepage_frontend_build/_data/
docker restart homepage_nginx
cd ..
```

### 8. Verify Database Preserved
```bash
docker exec homepage_backend sqlite3 /app/data/db.sqlite3 "SELECT username FROM users;"
# Should show: gallo
```

### 9. Test Website
```bash
curl http://localhost/
```

## Important Notes

### ⚠️ NEVER USE THESE COMMANDS (Unless Intentional)
```bash
docker-compose down -v          # ❌ Deletes ALL volumes!
docker volume rm homepage_*     # ❌ Deletes volumes!
docker volume prune             # ❌ Deletes unused volumes!
```

### ✅ Safe Commands
```bash
docker-compose down             # ✅ Stops containers, keeps volumes
docker-compose restart          # ✅ Restarts without changes
docker-compose up -d --build    # ✅ Rebuild and start, keeps volumes
```

## Restore Database (If Needed)

### From Backup
```bash
# Stop backend
docker-compose stop backend

# Copy backup to container
docker cp ./backups/backup_YYYYMMDD_HHMMSS.db homepage_backend:/app/data/db.sqlite3

# Start backend
docker-compose start backend
```

## Volume Locations

The actual data is stored at:
- Database: `/var/lib/docker/volumes/homepage_db_data/_data/`
- Uploads: `/var/lib/docker/volumes/homepage_uploads_data/_data/`
- Frontend: `/var/lib/docker/volumes/homepage_frontend_build/_data/`

You can manually backup these directories:
```bash
sudo cp -r /var/lib/docker/volumes/homepage_db_data/_data/ ./backups/db_$(date +%Y%m%d)/
```
