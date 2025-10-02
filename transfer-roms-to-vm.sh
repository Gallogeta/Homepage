#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "═══════════════════════════════════════════"
echo "   ___   _   _    _    ___   ___  ___ _____ _   "
echo "  / __| /_\ | |  | |  / _ \ / _ \| __|_   _/_\  "
echo " | (_ |/ _ \| |__| |_| (_) | (_) | _|  | |/ _ \ "
echo "  \___/_/ \_\____|____\___/ \___/|___| |_/_/ \_\\"
echo ""
echo "         Made by GALLOGETA"
echo "═══════════════════════════════════════════"
echo -e "${NC}"
echo ""

echo -e "${CYAN}ROM Transfer Script to VM${NC}"
echo "================================"
echo ""

# Configuration
VM_IP="192.168.0.90"
VM_USER="gallo"
VM_PATH="/home/gallo/Code/Homepage/backend"
LOCAL_BACKEND="./backend"

# Check if we're in the right directory
if [ ! -d "$LOCAL_BACKEND/SNES" ] || [ ! -d "$LOCAL_BACKEND/GBA" ]; then
    echo -e "${RED}Error: Must run from Homepage project root${NC}"
    echo "Expected directories: ./backend/SNES and ./backend/GBA"
    exit 1
fi

# Count ROMs
NES_COUNT=$(find "$LOCAL_BACKEND/SNES" -name "*.nes" | wc -l)
GBA_COUNT=$(find "$LOCAL_BACKEND/GBA" -name "*.gba" | wc -l)
TOTAL_COUNT=$((NES_COUNT + GBA_COUNT))

echo -e "${YELLOW}Found ROMs to transfer:${NC}"
echo "  - NES ROMs: $NES_COUNT"
echo "  - GBA ROMs: $GBA_COUNT"
echo "  - Total: $TOTAL_COUNT games"
echo ""

# Calculate total size
TOTAL_SIZE=$(du -sh "$LOCAL_BACKEND/SNES" "$LOCAL_BACKEND/GBA" | awk '{sum+=$1} END {print sum}')
echo -e "${YELLOW}Total size: ~${TOTAL_SIZE}MB${NC}"
echo ""

# Confirm before transfer
read -p "Transfer ROMs to $VM_USER@$VM_IP? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Transfer cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${CYAN}Starting ROM transfer...${NC}"
echo ""

# Test SSH connection
echo -e "${YELLOW}Testing SSH connection to VM...${NC}"
if ! ssh -o ConnectTimeout=5 "$VM_USER@$VM_IP" "echo 'Connection successful'" 2>/dev/null; then
    echo -e "${RED}Error: Cannot connect to $VM_USER@$VM_IP${NC}"
    echo "Please check:"
    echo "  1. VM is running and accessible"
    echo "  2. SSH is enabled on VM"
    echo "  3. SSH keys are set up (or you'll be prompted for password)"
    exit 1
fi
echo -e "${GREEN}✓ SSH connection successful${NC}"
echo ""

# Create directories on VM if they don't exist
echo -e "${YELLOW}Creating ROM directories on VM...${NC}"
ssh "$VM_USER@$VM_IP" "mkdir -p $VM_PATH/SNES $VM_PATH/GBA"
echo -e "${GREEN}✓ Directories ready${NC}"
echo ""

# Transfer NES ROMs
echo -e "${CYAN}Transferring NES ROMs...${NC}"
rsync -avz --progress \
    "$LOCAL_BACKEND/SNES/" \
    "$VM_USER@$VM_IP:$VM_PATH/SNES/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ NES ROMs transferred successfully${NC}"
else
    echo -e "${RED}✗ Error transferring NES ROMs${NC}"
    exit 1
fi
echo ""

# Transfer GBA ROMs
echo -e "${CYAN}Transferring GBA ROMs...${NC}"
rsync -avz --progress \
    "$LOCAL_BACKEND/GBA/" \
    "$VM_USER@$VM_IP:$VM_PATH/GBA/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ GBA ROMs transferred successfully${NC}"
else
    echo -e "${RED}✗ Error transferring GBA ROMs${NC}"
    exit 1
fi
echo ""

# Verify transfer
echo -e "${YELLOW}Verifying ROM transfer...${NC}"
VM_NES_COUNT=$(ssh "$VM_USER@$VM_IP" "find $VM_PATH/SNES -name '*.nes' | wc -l")
VM_GBA_COUNT=$(ssh "$VM_USER@$VM_IP" "find $VM_PATH/GBA -name '*.gba' | wc -l")

echo "  - Local NES: $NES_COUNT → VM NES: $VM_NES_COUNT"
echo "  - Local GBA: $GBA_COUNT → VM GBA: $VM_GBA_COUNT"

if [ "$NES_COUNT" -eq "$VM_NES_COUNT" ] && [ "$GBA_COUNT" -eq "$VM_GBA_COUNT" ]; then
    echo -e "${GREEN}✓ All ROMs transferred successfully!${NC}"
else
    echo -e "${YELLOW}⚠ Warning: ROM counts don't match${NC}"
    echo "Please verify manually"
fi
echo ""

echo -e "${GREEN}════════════════════════════════════${NC}"
echo -e "${GREEN}ROM Transfer Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo "  1. SSH to VM: ssh $VM_USER@$VM_IP"
echo "  2. Go to project: cd /home/gallo/Code/Homepage"
echo "  3. Pull latest code: git pull origin main"
echo "  4. Run deployment: ./deploy.sh"
echo ""
