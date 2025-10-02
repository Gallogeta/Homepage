#!/bin/bash#!/bin/bash

# Homepage Automated Deployment Scriptset -e

# Detects environment, configures for VM IP, installs all dependencies

echo "======================================"

set -eecho "  Homepage Deployment"

echo "  Made by GALLOGETA"

RED='\033[0;31m'echo "======================================"

GREEN='\033[0;32m'echo ""

YELLOW='\033[1;33m'echo "Deploying Homepage with Docker..."

CYAN='\033[0;36m'echo ""

NC='\033[0m'

# Check Docker

echo -e "${CYAN}"if ! command -v docker &> /dev/null; then

echo "══════════════════════════════════════════════════════════"    echo "ERROR: Docker not installed"

echo "   ___   _   _    _    ___   ___  ___ _____ _   "    echo "Install with: sudo apt install -y docker.io docker-compose"

echo "  / __| /_\ | |  | |  / _ \ / _ \| __|_   _/_\  "    exit 1

echo " | (_ |/ _ \| |__| |_| (_) | (_) | _|  | |/ _ \ "fi

echo "  \___/_/ \_\____|____\___/ \___/|___| |_/_/ \_\\"

echo ""if ! command -v docker-compose &> /dev/null; then

echo "           Made by GALLOGETA"    echo "ERROR: docker-compose not installed"  

echo "        Automated Deployment Script"    echo "Install with: sudo apt install -y docker-compose"

echo "══════════════════════════════════════════════════════════"    exit 1

echo -e "${NC}"fi

echo ""

# Create directories

# ============================================================================echo "Creating directories..."

# STEP 1: Detect Environmentmkdir -p ./backend/data

# ============================================================================mkdir -p ./backend/uploads

echo -e "${CYAN}[1/8] Detecting Environment${NC}"mkdir -p ./backend/SNES

echo "───────────────────────────────────────────"mkdir -p ./backend/GBA



# Detect server IP# Stop existing containers

SERVER_IP=$(hostname -I | awk '{print $1}')echo "Stopping existing containers..."

if [ -z "$SERVER_IP" ]; thendocker-compose down 2>/dev/null || true

    SERVER_IP="localhost"

fi# Build and start

echo "Building and starting containers..."

echo "  ✓ Server IP detected: $SERVER_IP"docker-compose up -d --build



# Get project directory# Wait

PROJECT_DIR=$(pwd)echo "Waiting for services..."

echo "  ✓ Project directory: $PROJECT_DIR"sleep 10



# Detect OS# Status

if [ -f /etc/os-release ]; thenecho ""

    . /etc/os-releaseecho "======================================"

    echo "  ✓ OS: $NAME $VERSION"docker-compose ps

elseecho "======================================"

    echo "  ⚠ OS: Unknown Linux"echo ""

fiecho "Deployment complete!"

echo ""

echo ""echo "Access:"

echo "  Frontend: http://192.168.0.90:3000"

# ============================================================================echo "  Backend:  http://192.168.0.90:8000"

# STEP 2: Check/Install Dependenciesecho "  Arcade:   http://192.168.0.90:3000/arcade.html"

# ============================================================================echo ""

echo -e "${CYAN}[2/8] Checking Dependencies${NC}"echo "Commands:"

echo "───────────────────────────────────────────"echo "  Logs:    docker-compose logs -f"

echo "  Stop:    docker-compose down"

# Check Dockerecho "  Restart: docker-compose restart"

if ! command -v docker &> /dev/null; thenecho ""

    echo -e "${YELLOW}  ⚠ Docker not found. Installing...${NC}"
    sudo apt-get update -qq
    sudo apt-get install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo -e "${GREEN}  ✓ Docker installed${NC}"
else
    echo "  ✓ Docker found: $(docker --version)"
fi

# Check docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}  ⚠ docker-compose not found. Installing...${NC}"
    sudo apt-get install -y docker-compose
    echo -e "${GREEN}  ✓ docker-compose installed${NC}"
else
    echo "  ✓ docker-compose found: $(docker-compose --version)"
fi

# Check curl
if ! command -v curl &> /dev/null; then
    echo -e "${YELLOW}  ⚠ curl not found. Installing...${NC}"
    sudo apt-get install -y curl
    echo -e "${GREEN}  ✓ curl installed${NC}"
else
    echo "  ✓ curl found"
fi

echo ""

# ============================================================================
# STEP 3: Configure Backend
# ============================================================================
echo -e "${CYAN}[3/8] Configuring Backend${NC}"
echo "───────────────────────────────────────────"

# Create backend .env if it doesn't exist
if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
    echo "  → Creating backend/.env..."
    
    # Generate secure JWT secret
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-this-secret-key-$(date +%s)")
    
    cat > "$PROJECT_DIR/backend/.env" << EOF
# Database
DATABASE_URL=sqlite:///./data/db.sqlite3

# JWT Settings
JWT_SECRET_KEY=$JWT_SECRET
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Settings
API_HOST=0.0.0.0
API_PORT=8000

# CORS - Allow connections from frontend
ALLOWED_ORIGINS=http://$SERVER_IP:3000,http://localhost:3000,http://$SERVER_IP

# Production mode
PRODUCTION=false
EOF
    echo -e "${GREEN}  ✓ Backend configuration created${NC}"
else
    echo "  ✓ Backend .env already exists"
    # Update CORS with current IP
    if grep -q "ALLOWED_ORIGINS=" "$PROJECT_DIR/backend/.env"; then
        sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://$SERVER_IP:3000,http://localhost:3000,http://$SERVER_IP|" "$PROJECT_DIR/backend/.env"
        echo "  ✓ Updated ALLOWED_ORIGINS with current IP"
    fi
fi

echo ""

# ============================================================================
# STEP 4: Configure Frontend
# ============================================================================
echo -e "${CYAN}[4/8] Configuring Frontend${NC}"
echo "───────────────────────────────────────────"

# Update vite.config.mjs to use detected IP
if [ -f "$PROJECT_DIR/frontend/vite.config.mjs" ]; then
    echo "  → Updating Vite proxy to http://$SERVER_IP:8000..."
    
    # Backup original
    cp "$PROJECT_DIR/frontend/vite.config.mjs" "$PROJECT_DIR/frontend/vite.config.mjs.backup"
    
    # Update proxy
    sed -i "s|'/api': 'http://[^']*'|'/api': 'http://$SERVER_IP:8000'|" "$PROJECT_DIR/frontend/vite.config.mjs"
    
    echo -e "${GREEN}  ✓ Frontend proxy configured for $SERVER_IP${NC}"
else
    echo -e "${YELLOW}  ⚠ vite.config.mjs not found${NC}"
fi

echo ""

# ============================================================================
# STEP 5: Create Required Directories
# ============================================================================
echo -e "${CYAN}[5/8] Creating Directory Structure${NC}"
echo "───────────────────────────────────────────"

mkdir -p "$PROJECT_DIR/backend/data"
mkdir -p "$PROJECT_DIR/backend/uploads"
mkdir -p "$PROJECT_DIR/backend/SNES"
mkdir -p "$PROJECT_DIR/backend/GBA"
mkdir -p "$PROJECT_DIR/backend/logs"

echo "  ✓ backend/data"
echo "  ✓ backend/uploads"
echo "  ✓ backend/SNES"
echo "  ✓ backend/GBA"
echo "  ✓ backend/logs"

# Check ROM counts
NES_COUNT=$(find "$PROJECT_DIR/backend/SNES" -name '*.nes' 2>/dev/null | wc -l)
GBA_COUNT=$(find "$PROJECT_DIR/backend/GBA" -name '*.gba' 2>/dev/null | wc -l)

echo ""
echo "  📦 ROM Status:"
echo "     NES Games: $NES_COUNT"
echo "     GBA Games: $GBA_COUNT"

if [ "$NES_COUNT" -eq 0 ] && [ "$GBA_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}     ⚠ No ROMs found. You can add them later to backend/SNES/ and backend/GBA/${NC}"
fi

echo ""

# ============================================================================
# STEP 6: Verify Docker Compose Configuration
# ============================================================================
echo -e "${CYAN}[6/8] Verifying Docker Configuration${NC}"
echo "───────────────────────────────────────────"

if [ -f "$PROJECT_DIR/docker-compose.yml" ]; then
    echo "  ✓ docker-compose.yml found"
    
    # Validate docker-compose file
    if docker-compose config > /dev/null 2>&1; then
        echo "  ✓ docker-compose.yml is valid"
    else
        echo -e "${YELLOW}  ⚠ docker-compose.yml has warnings (continuing anyway)${NC}"
    fi
else
    echo -e "${RED}  ✗ docker-compose.yml not found!${NC}"
    exit 1
fi

echo ""

# ============================================================================
# STEP 7: Deploy Docker Containers
# ============================================================================
echo -e "${CYAN}[7/8] Deploying Docker Containers${NC}"
echo "───────────────────────────────────────────"

# Stop existing containers
echo "  → Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Build and start containers
echo "  → Building and starting containers (this may take a few minutes)..."
docker-compose up -d --build

# Wait for services
echo "  → Waiting for services to start..."
sleep 15

# Check container status
echo ""
echo "  📊 Container Status:"
docker-compose ps

echo ""

# ============================================================================
# STEP 8: Health Checks
# ============================================================================
echo -e "${CYAN}[8/8] Running Health Checks${NC}"
echo "───────────────────────────────────────────"

# Check backend
echo -n "  → Backend (http://localhost:8000/health): "
sleep 3
if curl -f -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${YELLOW}⚠ Not responding (may need more time)${NC}"
fi

# Check frontend
echo -n "  → Frontend (http://localhost:3000): "
if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Accessible${NC}"
else
    echo -e "${YELLOW}⚠ Not responding (may need more time)${NC}"
fi

echo ""

# ============================================================================
# Deployment Complete
# ============================================================================
echo -e "${GREEN}"
echo "══════════════════════════════════════════════════════════"
echo "  ✓ Deployment Complete!"
echo "══════════════════════════════════════════════════════════"
echo -e "${NC}"
echo ""
echo -e "${CYAN}📍 Access Your Site:${NC}"
echo ""
echo "   Local:       http://localhost:3000"
echo "   Network:     http://$SERVER_IP:3000"
echo "   Backend:     http://$SERVER_IP:8000"
echo "   API Docs:    http://$SERVER_IP:8000/docs"
echo "   Arcade:      http://$SERVER_IP:3000/arcade.html (members only)"
echo ""
echo -e "${CYAN}📁 Project Structure:${NC}"
echo "   Location:    $PROJECT_DIR"
echo "   Database:    $PROJECT_DIR/backend/data/db.sqlite3"
echo "   Uploads:     $PROJECT_DIR/backend/uploads/"
echo "   ROMs:        $PROJECT_DIR/backend/SNES/ ($NES_COUNT games)"
echo "                $PROJECT_DIR/backend/GBA/ ($GBA_COUNT games)"
echo ""
echo -e "${CYAN}🔧 Useful Commands:${NC}"
echo "   View logs:           docker-compose logs -f"
echo "   View backend logs:   docker logs homepage_backend -f"
echo "   View frontend logs:  docker logs homepage_frontend -f"
echo "   Stop services:       docker-compose down"
echo "   Restart:             docker-compose restart"
echo "   Rebuild:             docker-compose up -d --build"
echo ""
echo -e "${CYAN}🌐 Port Forwarding (for public access):${NC}"
echo "   1. Configure your router to forward ports 80/443 to $SERVER_IP:3000"
echo "   2. Or use nginx reverse proxy (see DEPLOYMENT.md)"
echo ""
echo -e "${CYAN}📋 Next Steps:${NC}"
echo "   1. Create admin account by registering at http://$SERVER_IP:3000"
echo "   2. Add ROM files to backend/SNES/ and backend/GBA/ directories"
echo "   3. Test arcade functionality after logging in"
echo "   4. Configure firewall/port forwarding for public access"
echo ""
echo -e "${GREEN}Need help? Check the documentation or logs above.${NC}"
echo ""
