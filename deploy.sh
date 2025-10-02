#!/bin/bash#!/bin/bash

# Homepage Complete Deployment Script# Homepage Deployment Script

# Interactive setup with admin account creation + deployment

set -e

set -e

echo "================================="

RED='\033[0;31m'echo " Homepage Deployment"

GREEN='\033[0;32m'echo " Made by GALLOGETA"

YELLOW='\033[1;33m'echo "================================="

CYAN='\033[0;36m'echo ""

NC='\033[0m'

# Detect IP

echo -e "${CYAN}"SERVER_IP=$(hostname -I | awk "{print \$1}")

echo "═══════════════════════════════════════════"[ -z "$SERVER_IP" ] && SERVER_IP="localhost"

echo "   ___   _   _    _    ___   ___  ___ _____ _   "echo "Server IP: $SERVER_IP"

echo "  / __| /_\ | |  | |  / _ \ / _ \| __|_   _/_\  "echo ""

echo " | (_ |/ _ \| |__| |_| (_) | (_) | _|  | |/ _ \ "

echo "  \___/_/ \_\____|____\___/ \___/|___| |_/_/ \_\\"# Install dependencies

echo ""echo "Checking dependencies..."

echo "         Made by GALLOGETA"if ! command -v docker &> /dev/null; then

echo "       Homepage Deployment Script"    echo "Installing Docker..."

echo "═══════════════════════════════════════════"    sudo apt-get update -qq

echo -e "${NC}"    sudo apt-get install -y docker.io docker-compose curl

echo ""    sudo systemctl start docker

    sudo systemctl enable docker

# ============================================    sudo usermod -aG docker $USER

# STEP 1: Environment Detectionfi

# ============================================

echo -e "${CYAN}[1/7] Detecting Environment${NC}"if ! command -v docker-compose &> /dev/null; then

echo "─────────────────────────────────────"    sudo apt-get install -y docker-compose

fi

SERVER_IP=$(hostname -I | awk '{print $1}')

[ -z "$SERVER_IP" ] && SERVER_IP="localhost"echo "Dependencies OK"

PROJECT_DIR=$(pwd)echo ""



echo "  Server IP: $SERVER_IP"# Create backend .env

echo "  Project:   $PROJECT_DIR"echo "Configuring backend..."

echo ""if [ ! -f backend/.env ]; then

    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "secret-$(date +%s)")

# ============================================    cat > backend/.env <<EOF

# STEP 2: Interactive ConfigurationDATABASE_URL=sqlite:///./data/db.sqlite3

# ============================================JWT_SECRET_KEY=$JWT_SECRET

echo -e "${CYAN}[2/7] Configuration Setup${NC}"JWT_ALGORITHM=HS256

echo "─────────────────────────────────────"JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

API_HOST=0.0.0.0

# Check if this is first run or re-deploymentAPI_PORT=8000

if [ -f "backend/.env" ] && [ -f "backend/data/db.sqlite3" ]; thenALLOWED_ORIGINS=http://$SERVER_IP:3000,http://localhost:3000

    echo -e "${YELLOW}Existing installation detected!${NC}"PRODUCTION=false

    echo ""EOF

    read -p "Keep existing database and configuration? (y/n): " KEEP_EXISTING    echo "Created backend/.env"

    if [ "$KEEP_EXISTING" = "y" ]; thenelse

        SKIP_SETUP=true    sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://$SERVER_IP:3000,http://localhost:3000|" backend/.env

        echo -e "${GREEN}✓ Using existing configuration${NC}"    echo "Updated backend/.env"

    elsefi

        SKIP_SETUP=falseecho ""

    fi

else# Update frontend proxy

    SKIP_SETUP=falseecho "Configuring frontend..."

fiif [ -f frontend/vite.config.mjs ]; then

    sed -i "s|'/api': 'http://[^']*'|'/api': 'http://$SERVER_IP:8000'|" frontend/vite.config.mjs

if [ "$SKIP_SETUP" = false ]; then    echo "Updated frontend proxy"

    echo ""fi

    echo -e "${CYAN}👤 Admin Account Setup${NC}"echo ""

    echo ""

    # Create directories

    # Admin usernameecho "Creating directories..."

    read -p "Admin username [default: admin]: " ADMIN_USERmkdir -p backend/data backend/uploads backend/SNES backend/GBA

    ADMIN_USER=${ADMIN_USER:-admin}NES_COUNT=$(find backend/SNES -name "*.nes" 2>/dev/null | wc -l)

    GBA_COUNT=$(find backend/GBA -name "*.gba" 2>/dev/null | wc -l)

    # Admin passwordecho "ROMs: $NES_COUNT NES, $GBA_COUNT GBA"

    while true; doecho ""

        read -sp "Admin password (min 4 chars): " ADMIN_PASSWORD

        echo ""# Deploy

        if [ ${#ADMIN_PASSWORD} -ge 4 ]; thenecho "Deploying containers..."

            read -sp "Confirm password: " ADMIN_PASSWORD_CONFIRMdocker-compose down 2>/dev/null || true

            echo ""docker-compose up -d --build

            if [ "$ADMIN_PASSWORD" = "$ADMIN_PASSWORD_CONFIRM" ]; then

                breakecho ""

            elseecho "Waiting for services..."

                echo -e "${RED}Passwords don't match. Try again.${NC}"sleep 15

            fi

        elseecho ""

            echo -e "${RED}Password must be at least 4 characters${NC}"echo "================================="

        fiecho " Deployment Complete!"

    doneecho "================================="

    echo ""

    # Admin emailecho "Access:"

    read -p "Admin email: " ADMIN_EMAILecho "  http://$SERVER_IP:3000"

    echo "  http://$SERVER_IP:8000/docs"

    echo ""echo ""

    echo -e "${CYAN}📊 Configuration Summary:${NC}"echo "Commands:"

    echo "  Server IP:   $SERVER_IP"echo "  docker-compose logs -f"

    echo "  Admin User:  $ADMIN_USER"echo "  docker-compose ps"

    echo "  Admin Email: $ADMIN_EMAIL"echo "  docker-compose down"

    echo ""echo ""

    read -p "Continue with deployment? (y/n): " CONFIRM
    if [ "$CONFIRM" != "y" ]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 0
    fi
fi

echo ""

# ============================================
# STEP 3: Install Dependencies
# ============================================
echo -e "${CYAN}[3/7] Installing Dependencies${NC}"
echo "─────────────────────────────────────"

if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get update -qq
    sudo apt-get install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo "✓ Docker found"
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installing docker-compose..."
    sudo apt-get install -y docker-compose
    echo -e "${GREEN}✓ docker-compose installed${NC}"
else
    echo "✓ docker-compose found"
fi

if ! command -v curl &> /dev/null; then
    sudo apt-get install -y curl
fi

echo ""

# ============================================
# STEP 4: Configure Backend
# ============================================
echo -e "${CYAN}[4/7] Configuring Backend${NC}"
echo "─────────────────────────────────────"

if [ "$SKIP_SETUP" = false ] || [ ! -f "backend/.env" ]; then
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "secret-$(date +%s)")
    
    cat > backend/.env << EOF
# Database
DATABASE_URL=sqlite:///./data/db.sqlite3

# JWT Settings
JWT_SECRET_KEY=$JWT_SECRET
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Settings
API_HOST=0.0.0.0
API_PORT=8000

# CORS
ALLOWED_ORIGINS=http://$SERVER_IP:3000,http://localhost:3000,http://$SERVER_IP

# Admin User (for initial setup)
ADMIN_USERNAME=$ADMIN_USER
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_EMAIL=$ADMIN_EMAIL

# Production
PRODUCTION=false
EOF
    echo "✓ Created backend/.env"
else
    sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://$SERVER_IP:3000,http://localhost:3000|" backend/.env
    echo "✓ Updated backend/.env"
fi

echo ""

# ============================================
# STEP 5: Configure Frontend
# ============================================
echo -e "${CYAN}[5/7] Configuring Frontend${NC}"
echo "─────────────────────────────────────"

if [ -f "frontend/vite.config.mjs" ]; then
    cp frontend/vite.config.mjs frontend/vite.config.mjs.backup 2>/dev/null || true
    sed -i "s|'/api': 'http://[^']*'|'/api': 'http://$SERVER_IP:8000'|" frontend/vite.config.mjs
    echo "✓ Updated Vite proxy to $SERVER_IP:8000"
fi

echo ""

# ============================================
# STEP 6: Prepare Directories & Data
# ============================================
echo -e "${CYAN}[6/7] Preparing Directories${NC}"
echo "─────────────────────────────────────"

mkdir -p backend/data backend/uploads backend/SNES backend/GBA backend/logs

# Backup existing database if requested
if [ "$SKIP_SETUP" = false ] && [ -f "backend/data/db.sqlite3" ]; then
    BACKUP_DIR="./backups/backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp backend/data/db.sqlite3 "$BACKUP_DIR/" 2>/dev/null || true
    echo "✓ Backed up database to $BACKUP_DIR"
    rm backend/data/db.sqlite3
    echo "✓ Removed old database (fresh install)"
fi

NES_COUNT=$(find backend/SNES -name '*.nes' 2>/dev/null | wc -l)
GBA_COUNT=$(find backend/GBA -name '*.gba' 2>/dev/null | wc -l)
echo "✓ ROM files: $NES_COUNT NES, $GBA_COUNT GBA"

echo ""

# ============================================
# STEP 7: Deploy Docker Containers
# ============================================
echo -e "${CYAN}[7/7] Deploying Containers${NC}"
echo "─────────────────────────────────────"

# Stop existing containers
echo "Stopping old containers..."
docker-compose down 2>/dev/null || true

# Clean up
echo "Cleaning up..."
docker system prune -f > /dev/null 2>&1 || true

# Build and start
echo "Building and starting services..."
docker-compose up -d --build

# Wait for services
echo "Waiting for services to start..."
sleep 15

# Check status
echo ""
docker-compose ps

# Create admin user if new installation
if [ "$SKIP_SETUP" = false ]; then
    echo ""
    echo "Creating admin user..."
    sleep 5
    
    # Try to create admin user via API
    curl -s -X POST "http://localhost:8000/api/register" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$ADMIN_USER\",\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
        > /dev/null 2>&1 || echo "Note: Admin user will be created on first manual registration"
fi

# ============================================
# Deployment Complete
# ============================================
echo ""
echo -e "${GREEN}"
echo "═══════════════════════════════════════════"
echo "  ✓ Deployment Complete!"
echo "═══════════════════════════════════════════"
echo -e "${NC}"
echo ""
echo -e "${CYAN}📍 Access Your Site:${NC}"
echo ""
echo "   Website:     http://$SERVER_IP:3000"
echo "   Backend:     http://$SERVER_IP:8000"
echo "   API Docs:    http://$SERVER_IP:8000/docs"
echo "   Arcade:      http://$SERVER_IP:3000/arcade.html (login required)"
echo ""
echo -e "${CYAN}👤 Admin Access:${NC}"
if [ "$SKIP_SETUP" = false ]; then
    echo "   Username:    $ADMIN_USER"
    echo "   Email:       $ADMIN_EMAIL"
    echo "   Password:    (the one you entered)"
else
    echo "   Using existing admin credentials"
fi
echo ""
echo -e "${CYAN}🎮 ROMs:${NC}"
echo "   NES Games:   $NES_COUNT in backend/SNES/"
echo "   GBA Games:   $GBA_COUNT in backend/GBA/"
if [ "$NES_COUNT" -eq 0 ] && [ "$GBA_COUNT" -eq 0 ]; then
    echo -e "   ${YELLOW}⚠ No ROMs found. Add .nes and .gba files to the directories above.${NC}"
fi
echo ""
echo -e "${CYAN}🔧 Useful Commands:${NC}"
echo "   View logs:       docker-compose logs -f"
echo "   Restart:         docker-compose restart"
echo "   Stop:            docker-compose down"
echo "   Rebuild:         ./deploy.sh (run this script again)"
echo ""
echo -e "${CYAN}🌐 Public Access:${NC}"
echo "   Configure port forwarding on your router:"
echo "   Forward port 80 → $SERVER_IP:3000"
echo "   Forward port 443 → $SERVER_IP:3000 (for HTTPS)"
echo ""
echo -e "${GREEN}Ready to use! Open http://$SERVER_IP:3000 and login!${NC}"
echo ""
