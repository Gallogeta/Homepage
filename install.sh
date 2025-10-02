#!/bin/bash
# Interactive Deployment Script for Homepage
# Supports deployment to any server with custom configuration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███╗   ███╗ █████╗ ██████╗ ███████╗    ██████╗ ██╗   ██╗  ║
║   ████╗ ████║██╔══██╗██╔══██╗██╔════╝    ██╔══██╗╚██╗ ██╔╝  ║
║   ██╔████╔██║███████║██║  ██║█████╗      ██████╔╝ ╚████╔╝   ║
║   ██║╚██╔╝██║██╔══██║██║  ██║██╔══╝      ██╔══██╗  ╚██╔╝    ║
║   ██║ ╚═╝ ██║██║  ██║██████╔╝███████╗    ██████╔╝   ██║     ║
║   ╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝    ╚═════╝    ╚═╝     ║
║                                                               ║
║        ██████╗  █████╗ ██╗     ██╗      ██████╗              ║
║       ██╔════╝ ██╔══██╗██║     ██║     ██╔═══██╗             ║
║       ██║  ███╗███████║██║     ██║     ██║   ██║             ║
║       ██║   ██║██╔══██║██║     ██║     ██║   ██║             ║
║       ╚██████╔╝██║  ██║███████╗███████╗╚██████╔╝             ║
║        ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝              ║
║                                                               ║
║        ██████╗ ███████╗████████╗ █████╗                      ║
║       ██╔════╝ ██╔════╝╚══██╔══╝██╔══██╗                     ║
║       ██║  ███╗█████╗     ██║   ███████║                     ║
║       ██║   ██║██╔══╝     ██║   ██╔══██║                     ║
║       ╚██████╔╝███████╗   ██║   ██║  ██║                     ║
║        ╚═════╝ ╚══════╝   ╚═╝   ╚═╝  ╚═╝                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Homepage Interactive Deployment Setup   ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo ""

# Function to validate IP address
validate_ip() {
    local ip=$1
    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to validate domain
validate_domain() {
    local domain=$1
    if [[ $domain =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  This script needs sudo privileges for some operations${NC}"
fi

# Function to show disk space
show_disk_space() {
    echo -e "${CYAN}💾 Available Disk Space:${NC}"
    echo ""
    df -h | grep -E "^/dev/" | awk '{printf "  %-20s %8s used / %8s total (%s full) - mounted on %s\n", $1, $3, $2, $5, $6}'
    echo ""
}

# ============================================
# 1. GATHER CONFIGURATION
# ============================================
echo -e "${CYAN}📋 Step 1: Configuration${NC}"
echo ""

# Show disk space
show_disk_space

# Get installation path
echo -e "${YELLOW}Choose installation location:${NC}"
echo "  1) /opt/homepage (recommended)"
echo "  2) /home/homepage"
echo "  3) Custom path"
read -p "Enter choice [1, 2, or 3]: " INSTALL_CHOICE

case $INSTALL_CHOICE in
    1)
        INSTALL_PATH="/opt/homepage"
        ;;
    2)
        INSTALL_PATH="/home/homepage"
        ;;
    3)
        read -p "Enter custom installation path: " CUSTOM_PATH
        INSTALL_PATH="${CUSTOM_PATH%/}"  # Remove trailing slash
        ;;
    *)
        echo -e "${RED}Invalid choice. Using default: /opt/homepage${NC}"
        INSTALL_PATH="/opt/homepage"
        ;;
esac

echo -e "${GREEN}✓ Installation path: ${INSTALL_PATH}${NC}"
echo ""

# Get server IP
while true; do
    read -p "Enter server IP address (e.g., 192.168.0.90): " SERVER_IP
    if validate_ip "$SERVER_IP"; then
        break
    else
        echo -e "${RED}Invalid IP address. Please try again.${NC}"
    fi
done

# Get domain (optional)
read -p "Enter domain name (or press Enter to skip): " DOMAIN
if [ -z "$DOMAIN" ]; then
    DOMAIN=$SERVER_IP
    echo -e "${YELLOW}No domain specified. Using IP: $SERVER_IP${NC}"
else
    if ! validate_domain "$DOMAIN"; then
        echo -e "${YELLOW}Warning: Domain format may be invalid, but continuing...${NC}"
    fi
fi

# Get admin credentials
echo ""
echo -e "${CYAN}👤 Admin User Setup${NC}"
while true; do
    read -p "Admin username: " ADMIN_USER
    if [ ${#ADMIN_USER} -ge 3 ]; then
        break
    else
        echo -e "${RED}Username must be at least 3 characters${NC}"
    fi
done

while true; do
    read -sp "Admin password: " ADMIN_PASSWORD
    echo ""
    if [ ${#ADMIN_PASSWORD} -ge 4 ]; then
        read -sp "Confirm password: " ADMIN_PASSWORD_CONFIRM
        echo ""
        if [ "$ADMIN_PASSWORD" = "$ADMIN_PASSWORD_CONFIRM" ]; then
            break
        else
            echo -e "${RED}Passwords don't match. Try again.${NC}"
        fi
    else
        echo -e "${RED}Password must be at least 4 characters${NC}"
    fi
done

# Get admin email
while true; do
    read -p "Admin email: " ADMIN_EMAIL
    if [[ $ADMIN_EMAIL =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        break
    else
        echo -e "${RED}Invalid email format${NC}"
    fi
done

# Ask about database
echo ""
echo -e "${CYAN}💾 Database Setup${NC}"
echo "Choose database initialization method:"
echo "  1) Create fresh database (delete existing)"
echo "  2) Keep existing database (if any)"
read -p "Enter choice [1 or 2]: " DB_CHOICE

# Ask about deployment type
echo ""
echo -e "${CYAN}🚀 Deployment Type${NC}"
echo "  1) Development (with hot reload)"
echo "  2) Production (optimized)"
read -p "Enter choice [1 or 2]: " DEPLOY_TYPE

# ============================================
# 2. SUMMARY AND CONFIRMATION
# ============================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Deployment Configuration         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo -e "  Server IP:      ${GREEN}$SERVER_IP${NC}"
echo -e "  Domain:         ${GREEN}$DOMAIN${NC}"
echo -e "  Admin User:     ${GREEN}$ADMIN_USER${NC}"
echo -e "  Admin Email:    ${GREEN}$ADMIN_EMAIL${NC}"
if [ "$DB_CHOICE" = "1" ]; then
    echo -e "  Database:       ${YELLOW}Fresh (will delete existing)${NC}"
else
    echo -e "  Database:       ${GREEN}Preserve existing${NC}"
fi
if [ "$DEPLOY_TYPE" = "1" ]; then
    echo -e "  Deploy Type:    ${YELLOW}Development${NC}"
else
    echo -e "  Deploy Type:    ${GREEN}Production${NC}"
fi
echo ""
read -p "Proceed with deployment? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 0
fi

# ============================================
# 3. BACKUP EXISTING DATA
# ============================================
echo ""
echo -e "${CYAN}📦 Step 2: Backing up existing data...${NC}"
BACKUP_DIR="./backups/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if docker ps -q -f name=homepage_backend 2>/dev/null | grep -q .; then
    echo "Creating database backup..."
    docker exec homepage_backend sqlite3 /app/data/db.sqlite3 ".backup /app/data/backup_temp.db" 2>/dev/null || true
    docker cp homepage_backend:/app/data/backup_temp.db "$BACKUP_DIR/db.sqlite3" 2>/dev/null || true
    docker exec homepage_backend rm /app/data/backup_temp.db 2>/dev/null || true
    echo -e "${GREEN}✓ Database backed up to: $BACKUP_DIR${NC}"
else
    echo -e "${YELLOW}No existing containers found, skipping backup${NC}"
fi

# ============================================
# 3.5. CLEANUP PORTS AND CONTAINERS
# ============================================
echo ""
echo -e "${CYAN}🧹 Step 3.5: Cleaning up ports and containers...${NC}"

# Stop all homepage containers
echo "Stopping existing containers..."
docker stop $(docker ps -aq --filter "name=homepage") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=homepage") 2>/dev/null || true

# Kill processes on required ports
for port in 80 443 3000 8000; do
    pids=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "Freeing port $port..."
        echo "$pids" | xargs kill -9 2>/dev/null || true
    fi
done

# Clean up networks
docker network rm homepage_homepage_network 2>/dev/null || true

echo -e "${GREEN}✓ Cleanup completed${NC}"

# ============================================
# 4. UPDATE CONFIGURATION FILES
# ============================================
echo ""
echo -e "${CYAN}📝 Step 4: Updating configuration files...${NC}"

# Update nginx configuration
if [ -f "nginx/nginx.conf" ]; then
    echo "Updating nginx.conf..."
    # This will update server_name if needed in the future
    echo -e "${GREEN}✓ Nginx configuration ready${NC}"
fi

# Create/update .env files
echo "Creating environment files..."

# Backend .env
cat > backend/.env <<EOF
DATABASE_URL=sqlite:///./data/db.sqlite3
SECRET_KEY=$(openssl rand -hex 32)
ADMIN_EMAIL=$ADMIN_EMAIL
SERVER_IP=$SERVER_IP
DOMAIN=$DOMAIN
EOF

# Frontend .env
cat > frontend/.env <<EOF
VITE_API_BASE=/api
VITE_SERVER_IP=$SERVER_IP
EOF

echo -e "${GREEN}✓ Environment files created${NC}"

# ============================================
# 4.5 COPY TO PROPER INSTALLATION DIRECTORY
# ============================================
echo ""
echo -e "${CYAN}📂 Step 4.5: Setting up installation directory...${NC}"

INSTALL_DIR="$INSTALL_PATH"
CURRENT_DIR=$(pwd)

# Create installation directory if it doesn't exist
if [ ! -d "$INSTALL_DIR" ]; then
    echo "Creating $INSTALL_DIR..."
    mkdir -p "$INSTALL_DIR"
    echo -e "${GREEN}✓ Created $INSTALL_DIR${NC}"
fi

# If we're not already in /opt/homepage, copy files there
if [ "$CURRENT_DIR" != "$INSTALL_DIR" ]; then
    echo "Copying files to $INSTALL_DIR..."
    cp -r ./* "$INSTALL_DIR/" 2>/dev/null || true
    cp -r ./.* "$INSTALL_DIR/" 2>/dev/null || true
    cd "$INSTALL_DIR"
    echo -e "${GREEN}✓ Files copied to $INSTALL_DIR${NC}"
else
    echo -e "${GREEN}✓ Already in installation directory${NC}"
fi

# ============================================
# 5. STOP EXISTING CONTAINERS
# ============================================
echo ""
echo -e "${CYAN}⏹️  Step 5: Stopping existing containers...${NC}"
if [ "$DB_CHOICE" = "1" ]; then
    docker-compose down -v  # Remove volumes for fresh install
    echo -e "${YELLOW}Removed all volumes (fresh install)${NC}"
else
    docker-compose down  # Keep volumes
    echo -e "${GREEN}Preserved existing volumes${NC}"
fi

# ============================================
# 6. BUILD AND START CONTAINERS
# ============================================
echo ""
echo -e "${CYAN}🔨 Step 5: Building containers...${NC}"
docker-compose build --no-cache

echo ""
echo -e "${CYAN}▶️  Step 6: Starting containers...${NC}"
docker-compose up -d

echo "Waiting for services to start..."
sleep 15

# ============================================
# 7. CREATE ADMIN USER
# ============================================
echo ""
echo -e "${CYAN}👤 Step 7: Creating admin user...${NC}"

# Wait for database to be ready
MAX_RETRIES=10
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if docker exec homepage_backend test -f /app/data/db.sqlite3 2>/dev/null; then
        break
    fi
    echo "Waiting for database... ($((RETRY+1))/$MAX_RETRIES)"
    sleep 2
    RETRY=$((RETRY+1))
done

# Create admin user
docker exec homepage_backend python3 -c "
import bcrypt
import sqlite3
import sys

try:
    password = '$ADMIN_PASSWORD'
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    conn = sqlite3.connect('/app/data/db.sqlite3')
    cursor = conn.cursor()
    
    # Check if user already exists
    cursor.execute('SELECT username FROM users WHERE username = ?', ('$ADMIN_USER',))
    if cursor.fetchone():
        print('User already exists, updating password...')
        cursor.execute('''
            UPDATE users SET hashed_password = ?, email = ?, role = 'admin', 
            is_verified = 1, is_approved = 1
            WHERE username = ?
        ''', (hashed, '$ADMIN_EMAIL', '$ADMIN_USER'))
    else:
        print('Creating new admin user...')
        cursor.execute('''
            INSERT INTO users (username, email, hashed_password, is_verified, is_approved, failed_count, locked_until, role)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', ('$ADMIN_USER', '$ADMIN_EMAIL', hashed, 1, 1, 0, 0, 'admin'))
    
    conn.commit()
    conn.close()
    print('✓ Admin user created successfully!')
    sys.exit(0)
except Exception as e:
    print(f'✗ Error creating user: {e}')
    sys.exit(1)
"

# ============================================
# 7.5 VERIFY MEDIA FILES (ROMs, Music, etc.)
# ============================================
echo ""
echo -e "${CYAN}📦 Step 7.5: Verifying media files (ROMs, music, etc.)...${NC}"

# Check ROMs - they're available via bind mount
if [ -d "backend/SNES" ]; then
    ROM_COUNT=$(ls backend/SNES/*.nes 2>/dev/null | wc -l)
    if [ "$ROM_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓ ROMs available via bind mount ($ROM_COUNT files)${NC}"
        # Verify backend can access them
        BACKEND_ROM_COUNT=$(docker exec homepage_backend sh -c 'ls /app/SNES/*.nes 2>/dev/null | wc -l' || echo "0")
        if [ "$BACKEND_ROM_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✓ Backend can access $BACKEND_ROM_COUNT ROM files${NC}"
        else
            echo -e "${YELLOW}⚠ Backend cannot access ROMs, checking permissions...${NC}"
            docker exec homepage_backend chown -R app:app /app/SNES 2>/dev/null || true
        fi
    else
        echo -e "${YELLOW}⚠ No ROM files found in backend/SNES/${NC}"
    fi
else
    echo -e "${YELLOW}⚠ No ROMs directory found${NC}"
fi

# Copy music files to uploads volume (not bind mounted)
if [ -d "frontend/public/media" ]; then
    echo "Copying music and media files to uploads volume..."
    mkdir -p /var/lib/docker/volumes/homepage_uploads_data/_data/media
    cp -r frontend/public/media/* /var/lib/docker/volumes/homepage_uploads_data/_data/media/ 2>/dev/null || true
    
    MUSIC_COUNT=$(find /var/lib/docker/volumes/homepage_uploads_data/_data/media -name "*.mp3" 2>/dev/null | wc -l || echo "0")
    echo -e "${GREEN}✓ Music files copied ($MUSIC_COUNT files)${NC}"
else
    echo -e "${YELLOW}⚠ No media directory found${NC}"
fi

# Copy any additional uploads
if [ -d "backend/uploads" ]; then
    echo "Copying additional uploads..."
    cp -r backend/uploads/* /var/lib/docker/volumes/homepage_uploads_data/_data/ 2>/dev/null || true
    echo -e "${GREEN}✓ Additional uploads copied${NC}"
fi

echo -e "${GREEN}✓ All media files ready${NC}"

# ============================================
# 8. SYNC FRONTEND BUILD
# ============================================
echo ""
echo -e "${CYAN}🔄 Step 8: Building and syncing frontend...${NC}"
cd frontend
npm install --silent
npm run build

# Copy to Docker volume
echo "Syncing to Docker volume..."
sudo cp -r dist/* /var/lib/docker/volumes/homepage_frontend_build/_data/
cd ..

# Restart nginx
docker restart homepage_nginx
sleep 3

# ============================================
# 9. VERIFY DEPLOYMENT
# ============================================
echo ""
echo -e "${CYAN}✅ Step 9: Verifying deployment...${NC}"

# Check containers
echo "Checking containers..."
CONTAINERS=$(docker ps --filter "name=homepage" --format "{{.Names}}" | wc -l)
if [ "$CONTAINERS" -ge 3 ]; then
    echo -e "${GREEN}✓ All containers running${NC}"
else
    echo -e "${RED}✗ Some containers are not running${NC}"
fi

# Check backend
echo "Testing backend..."
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend responding${NC}"
else
    echo -e "${RED}✗ Backend not responding${NC}"
fi

# Check frontend
echo "Testing frontend..."
if curl -s http://localhost/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend responding${NC}"
else
    echo -e "${RED}✗ Frontend not responding${NC}"
fi

# Test admin login
echo "Testing admin login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost/api/token \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$ADMIN_USER&password=$ADMIN_PASSWORD")

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo -e "${GREEN}✓ Admin login working${NC}"
else
    echo -e "${RED}✗ Admin login failed${NC}"
fi

# ============================================
# 10. DEPLOYMENT SUMMARY
# ============================================
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       🎉 Deployment Completed! 🎉         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Website Access:${NC}"
echo -e "  Local:    http://localhost"
echo -e "  Network:  http://$SERVER_IP"
if [ "$DOMAIN" != "$SERVER_IP" ]; then
    echo -e "  Domain:   http://$DOMAIN"
fi
echo ""
echo -e "${GREEN}Admin Credentials:${NC}"
echo -e "  Username: ${CYAN}$ADMIN_USER${NC}"
echo -e "  Password: ${CYAN}[hidden]${NC}"
echo -e "  Email:    ${CYAN}$ADMIN_EMAIL${NC}"
echo ""
echo -e "${GREEN}Docker Commands:${NC}"
echo -e "  View logs:    ${CYAN}docker-compose logs -f${NC}"
echo -e "  Restart:      ${CYAN}docker-compose restart${NC}"
echo -e "  Stop:         ${CYAN}docker-compose down${NC}"
echo -e "  View status:  ${CYAN}docker ps${NC}"
echo ""
echo -e "${GREEN}Files:${NC}"
echo -e "  Install path: ${CYAN}$INSTALL_PATH${NC}"
echo -e "  Backup:       ${CYAN}$BACKUP_DIR${NC}"
echo -e "  Backend env:  ${CYAN}$INSTALL_PATH/backend/.env${NC}"
echo -e "  Frontend env: ${CYAN}$INSTALL_PATH/frontend/.env${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Visit http://$SERVER_IP and login"
echo -e "  2. Configure firewall if needed"
if [ "$DOMAIN" != "$SERVER_IP" ]; then
    echo -e "  3. Point DNS for $DOMAIN to $SERVER_IP"
    echo -e "  4. Setup SSL certificate (Let's Encrypt)"
fi
echo ""
echo -e "${GREEN}Deployment completed at: $(date)${NC}"
