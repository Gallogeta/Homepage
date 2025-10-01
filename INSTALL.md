# Homepage - Multi-Server Deployment Guide

## 🚀 Quick Installation (Recommended)

For fresh installation on any server:

```bash
# Download and run quick installer
curl -sSL https://raw.githubusercontent.com/Gallogeta/Homepage/main/quick-install.sh | sudo bash
```

Or manually:

```bash
git clone https://github.com/Gallogeta/Homepage.git
cd Homepage
sudo ./install.sh
```

The interactive installer will ask you for:
- ✅ Server IP address
- ✅ Domain name (optional)
- ✅ Admin username & password
- ✅ Admin email
- ✅ Database setup (fresh or preserve)
- ✅ Deployment type (dev/production)

## 📋 What It Does Automatically

1. **Validates Configuration** - IP, domain, credentials
2. **Backs Up Existing Data** - Before any changes
3. **Updates Config Files** - Nginx, environment variables
4. **Builds Docker Containers** - With your configuration
5. **Creates Admin User** - Ready to login immediately
6. **Syncs Frontend Build** - Copies to Docker volume
7. **Tests Everything** - Verifies deployment works
8. **Shows Summary** - Access URLs and credentials

## 🌐 Multi-Server Deployment

Deploy the same project to multiple servers with different configurations:

### Server 1 (Main - itsusi.eu)
```bash
git clone https://github.com/Gallogeta/Homepage.git /opt/homepage-main
cd /opt/homepage-main
sudo ./install.sh
```
When prompted:
- IP: `192.168.0.90`
- Domain: `itsusi.eu`
- Admin: `gallo`
- Password: `secure123`

### Server 2 (Backup - backup.example.com)
```bash
git clone https://github.com/Gallogeta/Homepage.git /opt/homepage-backup
cd /opt/homepage-backup
sudo ./install.sh
```
When prompted:
- IP: `192.168.0.100`
- Domain: `backup.example.com`
- Admin: `admin`
- Password: `different456`

### Server 3 (Testing - 192.168.1.50)
```bash
git clone https://github.com/Gallogeta/Homepage.git /opt/homepage-test
cd /opt/homepage-test
sudo ./install.sh
```
When prompted:
- IP: `192.168.1.50`
- Domain: (skip, use IP)
- Admin: `testadmin`
- Password: `test789`

Each server will have:
- ✅ Independent database with its own admin user
- ✅ Custom IP/domain configuration
- ✅ Separate Docker volumes
- ✅ Automatic backup before deployment

## 📦 Prerequisites

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install -y git docker.io docker-compose nodejs npm
sudo usermod -aG docker $USER
newgrp docker
```

### CentOS/RHEL
```bash
sudo yum install -y git docker docker-compose nodejs npm
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
newgrp docker
```

## 🔄 Update Existing Deployment

To update code while preserving database:

```bash
cd /path/to/Homepage
git pull
./deploy-safe.sh
```

This will:
- Backup database first
- Pull latest code
- Rebuild containers
- Preserve existing users and data

## 🗂️ Directory Structure After Install

```
Homepage/
├── install.sh              # Interactive installer
├── quick-install.sh        # One-command installer
├── deploy-safe.sh          # Update with data preservation
├── backup-db.sh            # Manual backup script
├── backend/
│   ├── .env               # Auto-generated with your config
│   └── main.py
├── frontend/
│   ├── .env               # Auto-generated with your IP
│   └── dist/              # Built files
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
└── backups/               # Automatic backups
    └── backup_YYYYMMDD_HHMMSS/
        ├── db.sqlite3
        └── uploads/
```

## 🔐 Security Best Practices

1. **Change Default Credentials** - Use strong, unique passwords
2. **Firewall Configuration**:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
3. **SSL Certificate** (if using domain):
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```
4. **Regular Backups**:
   ```bash
   # Add to crontab (daily at 2 AM)
   0 2 * * * cd /opt/homepage && ./backup-db.sh
   ```

## 🆘 Troubleshooting

### Containers Not Starting
```bash
docker-compose logs -f
```

### Database Issues
```bash
docker exec homepage_backend sqlite3 /app/data/db.sqlite3 "SELECT * FROM users;"
```

### Frontend Not Updating
```bash
cd /opt/homepage
./sync-frontend.sh
```

### Reset Everything
```bash
docker-compose down -v
./install.sh  # Will create fresh installation
```

## 📊 Monitoring

### Check Container Status
```bash
docker ps --filter "name=homepage"
```

### View Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### Check Disk Usage
```bash
docker system df
```

## 🔄 Migration Between Servers

To migrate from one server to another:

1. **On Old Server** - Backup data:
   ```bash
   cd /opt/homepage
   ./backup-db.sh
   ```

2. **Copy Backup** to new server:
   ```bash
   scp -r backups/backup_YYYYMMDD_HHMMSS/ user@newserver:/tmp/
   ```

3. **On New Server** - Install and restore:
   ```bash
   ./install.sh  # Choose "Keep existing database"
   # Then manually restore from backup if needed
   ```

## 📝 Configuration Files

### backend/.env (Auto-generated)
```env
DATABASE_URL=sqlite:///./data/db.sqlite3
SECRET_KEY=<random-32-chars>
ADMIN_EMAIL=your@email.com
SERVER_IP=192.168.0.90
DOMAIN=itsusi.eu
```

### frontend/.env (Auto-generated)
```env
VITE_API_BASE=/api
VITE_SERVER_IP=192.168.0.90
```

## 🎯 Use Cases

### Scenario 1: High Availability
- Deploy to 2 servers with same content
- Use DNS failover or load balancer
- Different admin credentials for security

### Scenario 2: Development & Production
- Dev server: `192.168.1.10`
- Prod server: `192.168.0.90` (itsusi.eu)
- Same codebase, different data

### Scenario 3: Multi-Site
- Each server serves different content/users
- Same application, independent databases
- Easy to manage from single GitHub repo

## 📞 Support

- Repository: https://github.com/Gallogeta/Homepage
- Issues: https://github.com/Gallogeta/Homepage/issues

## 📄 License

[Your License Here]
