#!/bin/bash
# Emergency Disk Cleanup for Homepage VM
# Frees up disk space by removing Docker data and unnecessary files

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${RED}╔════════════════════════════════════════════╗${NC}"
echo -e "${RED}║     Emergency Disk Space Cleanup Tool     ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════╝${NC}"
echo ""

# Show current disk usage
echo -e "${CYAN}📊 Current Disk Usage:${NC}"
df -h | grep -E "Filesystem|^/dev/" | head -5
echo ""

SPACE_BEFORE=$(df / | awk 'NR==2 {print $3}')

echo -e "${YELLOW}This will clean:${NC}"
echo -e "  • Docker containers, images, volumes"
echo -e "  • Docker build cache"
echo -e "  • /tmp directory"
echo -e "  • /opt/homepage (if exists)"
echo -e "  • APT cache"
echo -e "  • Journal logs older than 3 days"
echo ""

read -p "Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo -e "${CYAN}🧹 Starting cleanup...${NC}"
echo ""

# Step 1: Stop and remove all Docker containers
echo -e "${YELLOW}1. Cleaning Docker containers...${NC}"
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
echo -e "${GREEN}✓ Containers removed${NC}"

# Step 2: Remove all Docker images
echo -e "${YELLOW}2. Removing Docker images...${NC}"
docker rmi $(docker images -q) -f 2>/dev/null || true
echo -e "${GREEN}✓ Images removed${NC}"

# Step 3: Remove all Docker volumes
echo -e "${YELLOW}3. Removing Docker volumes...${NC}"
docker volume rm $(docker volume ls -q) 2>/dev/null || true
echo -e "${GREEN}✓ Volumes removed${NC}"

# Step 4: Clean Docker build cache
echo -e "${YELLOW}4. Cleaning Docker build cache...${NC}"
docker builder prune -af 2>/dev/null || true
echo -e "${GREEN}✓ Build cache cleaned${NC}"

# Step 5: System prune
echo -e "${YELLOW}5. Docker system prune...${NC}"
docker system prune -af --volumes 2>/dev/null || true
echo -e "${GREEN}✓ System cleaned${NC}"

# Step 6: Remove /opt/homepage
if [ -d "/opt/homepage" ]; then
    echo -e "${YELLOW}6. Removing /opt/homepage...${NC}"
    rm -rf /opt/homepage
    echo -e "${GREEN}✓ /opt/homepage removed${NC}"
else
    echo -e "${YELLOW}6. /opt/homepage not found, skipping${NC}"
fi

# Step 7: Clean /tmp
echo -e "${YELLOW}7. Cleaning /tmp...${NC}"
find /tmp -type f -atime +1 -delete 2>/dev/null || true
find /tmp -type d -empty -delete 2>/dev/null || true
echo -e "${GREEN}✓ /tmp cleaned${NC}"

# Step 8: Clean APT cache
echo -e "${YELLOW}8. Cleaning APT cache...${NC}"
apt-get clean 2>/dev/null || true
apt-get autoclean 2>/dev/null || true
apt-get autoremove -y 2>/dev/null || true
echo -e "${GREEN}✓ APT cache cleaned${NC}"

# Step 9: Clean journal logs
echo -e "${YELLOW}9. Cleaning old journal logs...${NC}"
journalctl --vacuum-time=3d 2>/dev/null || true
echo -e "${GREEN}✓ Journal logs cleaned${NC}"

# Step 10: Remove thumbnail cache
if [ -d "$HOME/.cache/thumbnails" ]; then
    echo -e "${YELLOW}10. Cleaning thumbnail cache...${NC}"
    rm -rf "$HOME/.cache/thumbnails"
    echo -e "${GREEN}✓ Thumbnail cache cleaned${NC}"
fi

# Calculate space freed
SPACE_AFTER=$(df / | awk 'NR==2 {print $3}')
SPACE_FREED=$((SPACE_BEFORE - SPACE_AFTER))

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ✅ Cleanup Completed! ✅          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📊 Final Disk Usage:${NC}"
df -h | grep -E "Filesystem|^/dev/" | head -5
echo ""
echo -e "${GREEN}Space freed: ~${SPACE_FREED}KB${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo -e "  1. Clone Homepage to a location with space: /home/homepage"
echo -e "  2. Run: ${YELLOW}sudo git clone https://github.com/Gallogeta/Homepage.git /home/homepage${NC}"
echo -e "  3. Run: ${YELLOW}cd /home/homepage && sudo ./install.sh${NC}"
echo ""
