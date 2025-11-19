# Homepage Installation Guide

Complete installation guide for the Homepage project - a full-stack web application with FastAPI backend, React frontend, and Nginx reverse proxy.

## Table of Contents
- [Project Overview](#project-overview)
- [System Requirements](#system-requirements)
- [Quick Install](#quick-install)
- [Manual Installation](#manual-installation)
- [Post-Installation](#post-installation)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Project Overview

### What is Homepage?

A self-hosted personal homepage and portfolio website with:
- **Backend**: FastAPI (Python) REST API with SQLite database
- **Frontend**: React + Vite with responsive UI
- **Proxy**: Nginx for routing and SSL/TLS termination
- **Features**:
  - User authentication and authorization (JWT tokens)
  - Contact form with email sending (SMTP)
  - Admin panel for user management
  - File uploads and media management
  - Rate limiting and security features
  - Retro gaming emulator (SNES ROM support)

### Architecture

```
┌─────────────────────────────────────────────┐
│             Nginx (Port 80/443)             │
│         Reverse Proxy + SSL/TLS             │
└───────────┬─────────────────────┬───────────┘
            │                     │
            ├─────────────────────┼──────────────┐
            │                     │              │
    ┌───────▼─────────┐   ┌──────▼──────┐   ┌──▼──────┐
    │   Frontend      │   │   Backend   │   │ Static  │
    │   React + Vite  │   │   FastAPI   │   │ Files   │
    │   (Port 3000)   │   │ (Port 8000) │   │         │
    └─────────────────┘   └──────┬──────┘   └─────────┘
                                 │
                          ┌──────▼──────┐
                          │   SQLite    │
                          │  Database   │
                          └─────────────┘
```

### Directory Structure

```
Homepage/
├── backend/                # FastAPI backend
│   ├── main.py            # Main application file
│   ├── Dockerfile         # Backend container definition
│   ├── .env               # Backend environment variables
│   ├── data/              # SQLite database and logs
│   ├── uploads/           # User uploaded files
│   └── SNES/              # ROM files (optional)
│
├── frontend/              # React frontend
│   ├── src/               # Source files
│   ├── public/            # Static assets
│   ├── Dockerfile         # Frontend container definition
│   ├── .env               # Frontend environment variables
│   └── package.json       # Node dependencies
│
├── nginx/                 # Nginx configuration
│   └── nginx.conf         # Proxy configuration
│
├── docker-compose.yml     # Docker orchestration
├── install.sh             # Interactive installer
├── quick-install.sh       # One-command installer
└── scripts/               # Utility scripts
    ├── homepage-startup.sh      # Auto-start on boot
    ├── backup-db.sh             # Database backup
    └── unlock-user.sh           # Unlock locked accounts
```

---

## System Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04+ / Debian 11+ / any Linux with Docker support
- **CPU**: 1 core (2+ recommended)
- **RAM**: 1 GB (2 GB+ recommended)
- **Disk**: 2 GB free space (+ space for user uploads/media)
- **Network**: Internet connection for initial setup

### Required Software
- Docker 20.10+
- Docker Compose 2.0+ (use `docker compose`, not `docker-compose`)
- Git
- OpenSSL (usually pre-installed)
- Bash 4.0+

### Optional
- Domain name (for SSL/TLS certificates)
- SMTP server or Gmail account (for contact form email sending)
- External storage/HDD for media files

---

## Quick Install

### One-Line Installation

```bash
curl -fsSL https://raw.githubusercontent.com/Gallogeta/Homepage/main/quick-install.sh | sudo bash
```

This will:
1. Check dependencies
2. Clone the repository
3. Run the interactive installer
4. Set up Docker containers
5. Create admin user
6. Start the application

### Interactive Installer

If you've already cloned the repo:

```bash
cd Homepage
sudo ./install.sh
```

The installer will prompt you for:
- Installation path (default: `/opt/homepage`)
- Server IP address
- Domain name (optional)
- Admin username and password
- Admin email
- **SMTP configuration** (Gmail, Outlook, etc.) - **NEW!**
- Database initialization preference
- Deployment type (dev/production)

**Important Notes:**
- Admin account is created with `is_verified=1` and `is_approved=1` automatically
- No email verification needed for admin user created via installer
- SMTP setup is optional but required for contact form functionality

---

## Manual Installation

### Step 1: Install Dependencies

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y git docker.io docker-compose-plugin openssl curl
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
```

**Verify installation:**
```bash
docker --version          # Should be 20.10+
docker compose version    # Should be v2.0+
git --version
```

### Step 2: Clone Repository

```bash
git clone https://github.com/Gallogeta/Homepage.git
cd Homepage
```

### Step 3: Configure Environment Variables

**Backend (.env):**
```bash
cat > backend/.env <<EOF
DATABASE_URL=sqlite:///./data/db.sqlite3
SECRET_KEY=$(openssl rand -hex 32)
ADMIN_EMAIL=your-email@example.com
SERVER_IP=192.168.0.90
DOMAIN=yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
MAIL_FROM=noreply@yourdomain.com
MAIL_TO=your-email@example.com
SMTP_TLS=1
EOF
```

**Frontend (.env):**
```bash
cat > frontend/.env <<EOF
VITE_API_BASE=/api
VITE_SERVER_IP=192.168.0.90
EOF
```

### Step 4: Build and Start Containers

```bash
# Remove old containers if upgrading
docker compose down --remove-orphans

# Build and start
docker compose up -d --build

# Check status
docker compose ps
docker compose logs -f
```

### Step 5: Create Admin User

```bash
# Wait for database to be ready (about 10-15 seconds)
sleep 15

# Create admin user
docker exec homepage_backend python3 -c "
import bcrypt
import sqlite3

username = 'admin'
password = 'your-secure-password'
email = 'your-email@example.com'

hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
conn = sqlite3.connect('/app/data/db.sqlite3')
cursor = conn.cursor()

cursor.execute('''
    INSERT INTO users (username, email, hashed_password, is_verified, is_approved, failed_count, locked_until, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', (username, email, hashed, 1, 1, 0, 0, 'admin'))

conn.commit()
conn.close()
print(f'Admin user {username} created successfully!')
"
```

### Step 6: Access Your Homepage

Open browser and navigate to:
- `http://your-server-ip` (HTTP)
- `https://your-domain.com` (HTTPS with SSL)

Login with the admin credentials you created.

---

## Post-Installation

### Enable Auto-Start on Boot

The installer creates a systemd service to automatically start containers on boot:

```bash
# Install startup script (if not done by installer)
sudo cp scripts/homepage-startup.sh /usr/local/bin/homepage-startup.sh
sudo chmod +x /usr/local/bin/homepage-startup.sh

sudo cp systemd/homepage-startup.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now homepage-startup.service

# Check status
sudo systemctl status homepage-startup.service
sudo tail -f /var/log/homepage-startup.log
```

**What the startup script does:**
- Waits for Docker daemon to be ready
- Stops containers using ports 8000, 3000, and 80
- Kills any host processes using those ports
- Starts the docker compose stack
- Logs everything to `/var/log/homepage-startup.log`

### Configure SSL/TLS (HTTPS)

For production, set up SSL certificates:

**Option 1: Let's Encrypt (Free)**
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

**Option 2: Cloudflare (Recommended)**
- Use Cloudflare's free SSL with Full (strict) mode
- Proxy your domain through Cloudflare
- Enable automatic HTTPS rewrites

### Set Up Email Forwarding (for Gmail "Send As")

To send emails from a custom address (e.g., `info@yourdomain.com`) via Gmail:

1. **Set up email forwarding** (Cloudflare Email Routing is free):
   - Cloudflare Dashboard → Email → Email Routing
   - Add custom address: `info@yourdomain.com` → forward to `your-gmail@gmail.com`
   - Verify destination email

2. **Configure Gmail "Send mail as"**:
   - Gmail Settings → Accounts → "Send mail as" → Add another email
   - Email: `info@yourdomain.com`
   - **SMTP Server**: `smtp.gmail.com` (NOT `smtp.yourdomain.com`)
   - **Port**: `587`
   - **Username**: `your-gmail@gmail.com`
   - **Password**: Your Gmail app password
   - **TLS**: Enabled (recommended)
   - Verify the email via the forwarded confirmation link

3. **Gmail App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Generate a new app password
   - Use this in `SMTP_PASS` (NOT your regular Gmail password)

### Backups

**Database Backup:**
```bash
./scripts/backup-db.sh
# Backups saved to: backups/backup_YYYYMMDD_HHMMSS/db.sqlite3
```

**Full Backup:**
```bash
# Backup entire data directory
tar -czf homepage-backup-$(date +%Y%m%d).tar.gz \
  backend/data/ \
  backend/uploads/ \
  backend/.env \
  frontend/.env
```

**Automated Backups (cron):**
```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/Homepage/scripts/backup-db.sh
```

---

## Configuration

### Backend Configuration (backend/.env)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | SQLite database path | `sqlite:///./data/db.sqlite3` | Yes |
| `SECRET_KEY` | JWT token signing key | `32-character hex string` | Yes |
| `ADMIN_EMAIL` | Admin contact email | `admin@example.com` | Yes |
| `SERVER_IP` | Server IP address | `192.168.0.90` | Yes |
| `DOMAIN` | Domain name | `example.com` | Yes |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` | Optional |
| `SMTP_PORT` | SMTP server port | `587` (STARTTLS) | Optional |
| `SMTP_USER` | SMTP username | `your-email@gmail.com` | Optional |
| `SMTP_PASS` | SMTP password | Gmail app password | Optional |
| `MAIL_FROM` | Sender email address | `noreply@example.com` | Optional |
| `MAIL_TO` | Contact form recipient | `admin@example.com` | Optional |
| `SMTP_TLS` | Enable STARTTLS | `1` (yes) or `0` (no) | Optional |

**Important:**
- Use `SMTP_USER` and `SMTP_PASS` (NOT `SMTP_USERNAME` or `SMTP_PASSWORD`)
- Use `SMTP_TLS=1` (NOT `SMTP_TLS=True`)
- For Gmail, use an app password, not your regular password

### Frontend Configuration (frontend/.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE` | API base path | `/api` |
| `VITE_SERVER_IP` | Server IP (for dev) | `192.168.0.90` |

### Docker Compose Ports

Default port mappings in `docker-compose.yml`:
- **80**: Nginx HTTP
- **443**: Nginx HTTPS
- **3000**: Frontend (dev mode only)
- **8000**: Backend API

To change ports, edit `docker-compose.yml` and restart:
```bash
docker compose down
# Edit docker-compose.yml
docker compose up -d
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error:** `failed to bind host port for 0.0.0.0:8000: address already in use`

**Solution:**
```bash
# Find process using the port
sudo ss -ltnp | grep ':8000'
# or
sudo lsof -i :8000

# Kill the process
sudo kill <PID>

# Or use the startup script which handles this automatically
sudo /usr/local/bin/homepage-startup.sh
```

#### 2. Email Sending Fails - STARTTLS Error

**Error:** `5.7.0 Must issue a STARTTLS command first`

**Cause:** 
- Wrong environment variable names (SMTP_USERNAME vs SMTP_USER)
- Wrong SMTP_TLS value (True vs 1)
- Old Docker image cached with broken code

**Solution:**
```bash
# 1. Check .env has CORRECT variable names
cat ~/Homepage/backend/.env | grep SMTP

# Should show:
# SMTP_USER=your-email@gmail.com  (NOT SMTP_USERNAME)
# SMTP_PASS=your-app-password     (NOT SMTP_PASSWORD)
# SMTP_TLS=1                      (NOT True or "True")

# 2. Fix if needed
sudo nano ~/Homepage/backend/.env

# 3. REBUILD backend container (important!)
cd ~/Homepage
docker compose up -d --build backend

# 4. Test by submitting contact form
docker compose logs backend --tail 20 | grep -i email
cat backend/data/error.log | tail -5
```

#### 3. Can't Log In - Email Not Verified

**Error:** `Email not verified` or `Account not approved`

**Solution:**
```bash
# Check user status
docker exec homepage_backend python3 -c "
import sqlite3
conn = sqlite3.connect('/app/data/db.sqlite3')
cursor = conn.cursor()
cursor.execute('SELECT username, is_verified, is_approved, role FROM users')
for row in cursor.fetchall():
    print(f'User: {row[0]}, Verified: {row[1]}, Approved: {row[2]}, Role: {row[3]}')
conn.close()
"

# Fix user (set as verified and approved)
docker exec homepage_backend python3 -c "
import sqlite3
conn = sqlite3.connect('/app/data/db.sqlite3')
cursor = conn.cursor()
cursor.execute('UPDATE users SET is_verified = 1, is_approved = 1 WHERE username = ?', ('your-username',))
conn.commit()
conn.close()
print('User updated!')
"
```

#### 4. Account Locked

**Error:** `Account locked. Try again later.`

**Solution:**
```bash
# Use the unlock script
./scripts/unlock-user.sh your-username

# Or manually
docker exec homepage_backend python3 -c "
import sqlite3
conn = sqlite3.connect('/app/data/db.sqlite3')
cursor = conn.cursor()
cursor.execute('UPDATE users SET locked_until = 0, failed_count = 0 WHERE username = ?', ('your-username',))
conn.commit()
conn.close()
print('User unlocked!')
"
```

#### 5. Database Permission Issues

**Error:** `unable to open database file`

**Solution:**
```bash
# Fix permissions
sudo chown -R $(whoami):$(whoami) backend/data/
chmod 755 backend/data/
chmod 644 backend/data/db.sqlite3
```

#### 6. Docker Client Version Mismatch

**Error:** `client version 1.43 is too old. Minimum supported API version is 1.44`

**Cause:** Using old `docker-compose` v1 instead of `docker compose` v2

**Solution:**
```bash
# Use docker compose v2 (two words, no hyphen)
docker compose up -d

# NOT docker-compose (hyphen = old version)
```

#### 7. Admin User Not Created

**Error:** User doesn't exist after running installer

**Cause:** Installer script completed but admin creation step failed or was skipped

**Solution:**
```bash
# Manually create admin user
docker exec homepage_backend python3 -c "
import bcrypt
import sqlite3

username = 'admin'
password = 'your-password'
email = 'your-email@example.com'

hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
conn = sqlite3.connect('/app/data/db.sqlite3')
cursor = conn.cursor()

cursor.execute('''
    INSERT INTO users (username, email, hashed_password, is_verified, is_approved, failed_count, locked_until, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
''', (username, email, hashed, 1, 1, 0, 0, 'admin'))

conn.commit()
conn.close()
print('Admin user created!')
"
```

### Logs and Debugging

**View all logs:**
```bash
docker compose logs -f
```

**View specific service:**
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
```

**Backend error log:**
```bash
cat backend/data/error.log
tail -f backend/data/error.log
```

**Startup script log:**
```bash
sudo tail -f /var/log/homepage-startup.log
```

**Check container status:**
```bash
docker compose ps
docker ps
docker stats
```

### Getting Help

If you encounter issues not covered here:

1. Check the logs (see above)
2. Search existing GitHub issues: https://github.com/Gallogeta/Homepage/issues
3. Open a new issue with:
   - Error message
   - Relevant logs
   - System information (`docker --version`, OS version)
   - Steps to reproduce

---

## Updating

To update to the latest version:

```bash
cd ~/Homepage

# Backup first
./scripts/backup-db.sh

# Pull latest changes
git pull

# Rebuild and restart
docker compose down
docker compose up -d --build

# Check logs
docker compose logs -f
```

---

## Uninstallation

To completely remove Homepage:

```bash
# Stop and remove containers
cd ~/Homepage
docker compose down -v

# Remove systemd service
sudo systemctl disable --now homepage-startup.service
sudo rm /etc/systemd/system/homepage-startup.service
sudo rm /usr/local/bin/homepage-startup.sh
sudo systemctl daemon-reload

# Remove installation directory
sudo rm -rf /opt/homepage  # or your custom install path

# Remove Docker images (optional)
docker rmi homepage-backend homepage-frontend nginx:alpine
```

---

## License

This project is open-source. See LICENSE file for details.

## Credits

**Made by GALLOGETA**

For issues, questions, or contributions, visit:
https://github.com/Gallogeta/Homepage
