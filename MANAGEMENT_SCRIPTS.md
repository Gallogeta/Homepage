# Database & User Management Scripts

This directory contains utility scripts for managing your Homepage application.

## 📜 Available Scripts

### 1. `unlock-user.sh` - Unlock Locked User Accounts

Unlocks user accounts that have been locked due to too many failed login attempts.

**Usage:**
```bash
# List all users and their lock status
./unlock-user.sh

# Unlock a specific user
./unlock-user.sh gallo
./unlock-user.sh admin
```

**What it does:**
- Shows current lock status and failed login attempts
- Resets `failed_count` to 0
- Removes `locked_until` timestamp
- User can log in immediately after unlock

**Example:**
```bash
$ ./unlock-user.sh gallo
🔓 User Account Unlock Tool
============================

Current status for user 'gallo':
  Failed login attempts: 5
  Locked until: Thu Oct  3 16:30:00 UTC 2025
  Status: 🔒 LOCKED

Do you want to unlock this user? (y/n): y
🔓 Unlocking user 'gallo'...

✅ User 'gallo' has been unlocked!
  Failed attempts reset to: 0
  Lock status: Unlocked

The user can now log in immediately.
```

---

### 2. `backup-database.sh` - Backup Database

Creates a timestamped backup of the SQLite database with automatic cleanup of old backups.

**Usage:**
```bash
# Create a backup
./backup-database.sh
```

**What it does:**
- Creates consistent SQLite backup using `.backup` command
- Saves to `/mnt/data/Homepage/backups/` with timestamp
- Shows database statistics (users, pages, audit logs)
- Automatically deletes backups older than 30 days
- Lists recent backups

**Backup Location:**
```
/mnt/data/Homepage/backups/homepage_db_backup_YYYYMMDD_HHMMSS.sqlite3
```

**Example:**
```bash
$ ./backup-database.sh
💾 Database Backup Tool
======================

📊 Database Information:
  Source: /var/lib/docker/volumes/homepage_db_data/_data/db.sqlite3
  Destination: /mnt/data/Homepage/backups/homepage_db_backup_20251003_162000.sqlite3
  Timestamp: 20251003_162000
  Database size: 64K

🔄 Creating backup...
📦 Copying backup to host...
✅ Backup created successfully!
  File: homepage_db_backup_20251003_162000.sqlite3
  Size: 64K
  Location: /mnt/data/Homepage/backups

📈 Database Statistics:
Users: 2
Pages: 8
Audit Logs: 145

🗑️  Cleaning up old backups (older than 30 days)...
  Backups remaining: 5

📁 Recent backups:
  homepage_db_backup_20251003_162000.sqlite3 (64K, Oct 3 16:20)
  homepage_db_backup_20251003_140000.sqlite3 (64K, Oct 3 14:00)
  homepage_db_backup_20251002_220000.sqlite3 (63K, Oct 2 22:00)

✅ Backup complete!
```

---

## 🔄 Restoring a Backup

To restore a database backup:

```bash
# 1. Stop all containers
cd /mnt/data/Homepage
docker-compose down

# 2. List available backups
ls -lh /mnt/data/Homepage/backups/

# 3. Copy the backup file (replace with your backup filename)
sudo cp /mnt/data/Homepage/backups/homepage_db_backup_YYYYMMDD_HHMMSS.sqlite3 \
        /var/lib/docker/volumes/homepage_db_data/_data/db.sqlite3

# 4. Fix permissions
sudo chown gallo:gallo /var/lib/docker/volumes/homepage_db_data/_data/db.sqlite3

# 5. Start containers
docker-compose up -d

# 6. Verify
docker logs homepage_backend --tail=20
curl http://localhost:8000/api/pages/home
```

---

## 🤖 Automated Backups (Optional)

To automatically backup the database daily, add a cron job:

```bash
# Edit crontab
crontab -e

# Add this line to backup daily at 3 AM
0 3 * * * /mnt/data/Homepage/backup-database.sh >> /var/log/homepage_backup.log 2>&1
```

---

## 🔐 Security Notes

- Backup files have `600` permissions (owner read/write only)
- Database contains hashed passwords (bcrypt)
- Store backups in a secure location
- Consider encrypting backups for sensitive data
- Regular backups are essential before:
  - Major updates
  - System changes
  - Database migrations
  - Testing new features

---

## 📞 Support

If you encounter issues:

1. Check Docker containers are running: `docker ps`
2. Check database exists: `sudo ls -la /var/lib/docker/volumes/homepage_db_data/_data/`
3. Check backend logs: `docker logs homepage_backend --tail=50`
4. Verify database integrity: `docker exec homepage_backend sqlite3 /app/data/db.sqlite3 "PRAGMA integrity_check;"`

---

## 📝 Additional Commands

**Check database integrity:**
```bash
docker exec homepage_backend sqlite3 /app/data/db.sqlite3 "PRAGMA integrity_check;"
```

**View all users:**
```bash
docker exec homepage_backend sqlite3 /app/data/db.sqlite3 "SELECT username, email, role, is_verified, is_approved FROM users;"
```

**View all pages:**
```bash
docker exec homepage_backend sqlite3 /app/data/db.sqlite3 "SELECT name, length(content) FROM pages;"
```

**Database statistics:**
```bash
docker exec homepage_backend sqlite3 /app/data/db.sqlite3 "
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Pages: ' || COUNT(*) FROM pages;
SELECT 'Audit Logs: ' || COUNT(*) FROM audit_logs;
"
```
