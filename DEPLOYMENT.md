# Homepage Deployment Guide

## Overview
This guide covers the complete deployment process for the Homepage project using Docker containers on an Ubuntu VM.

## Prerequisites
- Ubuntu VM with IP 192.168.0.90
- Docker and docker-compose installed on the VM
- Git installed on the VM
- Network access between your development machine and the VM

## Project Structure
```
Homepage/
├── backend/                 # FastAPI backend
│   ├── main.py             # Core application
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Backend container config
│   └── .env               # Environment variables
├── frontend/               # React frontend
│   ├── src/               # Source code
│   ├── package.json       # Node.js dependencies
│   └── Dockerfile         # Frontend container config
├── nginx/                  # Reverse proxy
│   ├── nginx-http.conf    # HTTP-only configuration
│   └── nginx.conf         # HTTPS configuration (for production)
├── docker-compose.yml      # Multi-container orchestration
├── update.sh              # Deployment update script
├── .gitignore             # Git ignore rules
└── README.md              # Project documentation
```

## Fixed Issues

### 1. localhost:8000 References
**Problem**: Frontend was hardcoded to call `localhost:8000` API endpoints.
**Solution**: Replaced all localhost:8000 references with dynamic detection using `location.origin`.

**Files Modified**:
- `frontend/App.jsx` - Updated demo node configurations
- `frontend/AuthForm.jsx` - Fixed API base URL detection
- `frontend/ContactForm.jsx` - Fixed API base URL detection
- `frontend/index.html` - Updated fallback API base
- `backend/main.py` - Updated demo topology
- `frontend/vite.config.mjs` - Updated proxy configuration

### 2. Missing Dependencies
**Problem**: Build failures due to missing npm packages.
**Solution**: Added missing dependencies to package.json.

**Added Dependencies**:
- `jsnes`: ^1.2.1 (for arcade functionality)
- `react-quill`: ^2.0.0 (for rich text editing)
- `quill`: ^2.0.2 (quill dependency)

### 3. Backend Authentication Issues
**Problem**: Import errors with passlib/bcrypt.
**Solution**: Switched from passlib to direct bcrypt usage.

**Changes**:
- Updated `requirements.txt` to use `bcrypt` instead of `passlib[bcrypt]`
- Modified import in `main.py` from `passlib.context` to direct `bcrypt`
- Kept existing bcrypt-based password functions

### 4. Nginx SSL Configuration
**Problem**: Nginx failing due to missing SSL certificates.
**Solution**: Created HTTP-only configuration for initial deployment.

**Configuration**: `nginx/nginx-http.conf` provides HTTP-only access on port 80.

## Deployment Process

### Step 1: Prepare Local Environment
```bash
# Fix all localhost references (already done)
# Add missing dependencies (already done)
# Test locally
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Verify local functionality
curl http://localhost/health          # Should return {"status":"ok"}
curl -I http://localhost/            # Should return 200 OK
```

### Step 2: Push to GitHub
```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial deployment-ready version"

# Add GitHub remote (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/Homepage.git
git push -u origin main
```

### Step 3: Deploy to VM
```bash
# SSH to your VM
ssh gallo@192.168.0.90

# Clone the repository
git clone https://github.com/YOUR_USERNAME/Homepage.git
cd Homepage

# Make update script executable
chmod +x update.sh

# Edit the update script to use your GitHub URL
nano update.sh
# Update the REPO_URL variable to your actual GitHub repository

# Run initial deployment
docker-compose build --no-cache
docker-compose up -d
```

### Step 4: Verify Deployment
```bash
# On the VM, test the services
curl http://localhost/health          # Should return {"status":"ok"}
curl -I http://localhost/            # Should return 200 OK

# From your development machine, test remote access
curl http://192.168.0.90/health      # Should return {"status":"ok"}
```

### Step 5: Set Up Automatic Updates
```bash
# On the VM, the update script can be used for future deployments
./update.sh

# Or set up a cron job for regular updates (optional)
crontab -e
# Add: 0 2 * * * /home/gallo/Homepage/update.sh > /home/gallo/update.log 2>&1
```

## Update Script Usage

The `update.sh` script provides automated deployment updates:

```bash
# Manual update
./update.sh

# The script will:
# 1. Create a backup of the current deployment
# 2. Pull latest code from GitHub
# 3. Rebuild Docker containers
# 4. Start services
# 5. Perform health checks
# 6. Rollback if deployment fails
```

## Service URLs (After Deployment)
- **Homepage**: http://192.168.0.90
- **API**: http://192.168.0.90/api
- **API Documentation**: http://192.168.0.90/docs
- **Health Check**: http://192.168.0.90/health

## Troubleshooting

### Container Issues
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs [service-name]

# Restart services
docker-compose restart [service-name]

# Full rebuild
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

### Network Issues
```bash
# Check if ports are accessible
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Check firewall (if applicable)
sudo ufw status
```

### Frontend API Connection Issues
```bash
# Verify compiled assets don't contain localhost:8000
docker-compose exec frontend grep -r "localhost:8000" /app/dist/assets/

# Should return no results after fix
```

## Security Considerations

### For Production Deployment
1. **SSL/TLS**: Switch to `nginx.conf` and configure SSL certificates
2. **Environment Variables**: Use secure values for JWT secrets
3. **Firewall**: Configure proper firewall rules
4. **Database**: Consider switching from SQLite to PostgreSQL for production
5. **Backup Strategy**: Implement regular database and file backups

### Current Security Features
- Rate limiting on API endpoints
- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Security headers in nginx

## Maintenance

### Regular Tasks
- Monitor disk space (`df -h`)
- Check container health (`docker-compose ps`)
- Review logs (`docker-compose logs`)
- Update dependencies periodically
- Backup database and uploads

### Log Management
```bash
# View recent logs
docker-compose logs --tail=100 [service-name]

# Follow logs in real-time
docker-compose logs -f [service-name]
```

## Support
For issues or questions:
1. Check container logs first
2. Verify network connectivity
3. Ensure all dependencies are installed
4. Review this documentation
5. Check GitHub repository for updates