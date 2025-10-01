#!/bin/bash
# Remove Homepage Installation Script
# Safely removes containers, volumes, and installation directory

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${RED}╔════════════════════════════════════════════╗${NC}"
echo -e "${RED}║   Homepage Installation Removal Tool      ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ This script must be run with sudo${NC}"
    exit 1
fi

# Show current installations
echo -e "${CYAN}📂 Checking for installations...${NC}"
echo ""

FOUND_PATHS=()
for path in /opt/homepage /home/homepage; do
    if [ -d "$path" ]; then
        SIZE=$(du -sh "$path" 2>/dev/null | cut -f1)
        echo -e "  ${YELLOW}Found: $path ($SIZE)${NC}"
        FOUND_PATHS+=("$path")
    fi
done

if [ ${#FOUND_PATHS[@]} -eq 0 ]; then
    echo -e "  ${GREEN}No standard installations found${NC}"
    echo ""
    read -p "Enter custom installation path to remove (or press Enter to skip): " CUSTOM_PATH
    if [ -n "$CUSTOM_PATH" ] && [ -d "$CUSTOM_PATH" ]; then
        FOUND_PATHS+=("$CUSTOM_PATH")
    else
        echo -e "${GREEN}Nothing to remove. Exiting.${NC}"
        exit 0
    fi
fi

echo ""

# Warning
echo -e "${RED}⚠️  WARNING: This will:${NC}"
echo -e "${RED}  • Stop and remove all Homepage Docker containers${NC}"
echo -e "${RED}  • Remove Docker volumes (database, uploads, etc.)${NC}"
echo -e "${RED}  • Delete installation directories${NC}"
echo -e "${RED}  • Free up ports 80, 443, 3000, 8000${NC}"
echo ""

# Confirmation
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "${GREEN}Cancelled. No changes made.${NC}"
    exit 0
fi

echo ""
echo -e "${CYAN}🗑️  Starting removal process...${NC}"
echo ""

# Step 1: Stop containers
echo -e "${YELLOW}Step 1: Stopping Docker containers...${NC}"
cd /opt/homepage 2>/dev/null || cd /home/homepage 2>/dev/null || cd "${FOUND_PATHS[0]}" 2>/dev/null || true

if [ -f "docker-compose.yml" ]; then
    docker-compose down -v 2>/dev/null || true
    echo -e "${GREEN}✓ Containers stopped and volumes removed${NC}"
else
    docker stop homepage_nginx homepage_frontend homepage_backend 2>/dev/null || true
    docker rm homepage_nginx homepage_frontend homepage_backend 2>/dev/null || true
    docker volume rm homepage_db_data homepage_uploads_data homepage_frontend_build 2>/dev/null || true
    echo -e "${GREEN}✓ Containers and volumes removed manually${NC}"
fi

# Step 2: Remove network
echo -e "${YELLOW}Step 2: Removing Docker network...${NC}"
docker network rm homepage_homepage_network 2>/dev/null || true
echo -e "${GREEN}✓ Network removed${NC}"

# Step 3: Free up ports
echo -e "${YELLOW}Step 3: Freeing up ports...${NC}"
for port in 80 443 3000 8000; do
    pids=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "  Killing process(es) on port $port..."
        echo "$pids" | xargs kill -9 2>/dev/null || true
    fi
done
echo -e "${GREEN}✓ Ports freed${NC}"

# Step 4: Remove installation directories
echo -e "${YELLOW}Step 4: Removing installation directories...${NC}"
for path in "${FOUND_PATHS[@]}"; do
    if [ -d "$path" ]; then
        echo "  Removing $path..."
        rm -rf "$path"
        echo -e "${GREEN}✓ Removed $path${NC}"
    fi
done

# Step 5: Clean up orphaned data
echo -e "${YELLOW}Step 5: Cleaning up orphaned Docker data...${NC}"
docker system prune -f 2>/dev/null || true
echo -e "${GREEN}✓ Cleanup completed${NC}"

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       ✅ Removal Completed! ✅            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}What was removed:${NC}"
for path in "${FOUND_PATHS[@]}"; do
    echo -e "  • $path"
done
echo -e "  • All Docker containers and volumes"
echo -e "  • Docker network: homepage_homepage_network"
echo -e "  • Freed ports: 80, 443, 3000, 8000"
echo ""
echo -e "${CYAN}Disk space freed:${NC}"
df -h | grep -E "Filesystem|^/dev/" | awk 'NR==1 || $5 > 0' | head -5
echo ""
echo -e "${GREEN}You can now run a fresh installation.${NC}"
