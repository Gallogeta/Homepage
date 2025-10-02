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

echo -e "${CYAN}VM Deployment Script${NC}"
echo "================================"
echo ""

VM_IP="192.168.0.90"
VM_USER="gallo"

echo -e "${YELLOW}This script will help you deploy the Homepage to VM${NC}"
echo "VM IP: $VM_IP"
echo "VM User: $VM_USER"
echo ""

# Step 1: Commit local changes
echo -e "${CYAN}Step 1: Commit and push local changes${NC}"
echo "─────────────────────────────────────────"
read -p "Have you committed all local changes? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Please commit your changes first:${NC}"
    echo "  git add ."
    echo "  git commit -m 'Prepare for VM deployment'"
    echo "  git push origin main"
    exit 0
fi
echo -e "${GREEN}✓ Local changes committed${NC}"
echo ""

# Step 2: Transfer ROMs
echo -e "${CYAN}Step 2: Transfer ROM files to VM${NC}"
echo "─────────────────────────────────────────"
echo "This will transfer 34 game ROMs (24 NES + 10 GBA) to the VM"
read -p "Run ROM transfer script now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./transfer-roms-to-vm.sh
    if [ $? -ne 0 ]; then
        echo -e "${RED}ROM transfer failed. Please fix errors before continuing.${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠ Skipping ROM transfer - make sure ROMs are already on VM${NC}"
fi
echo ""

# Step 3: SSH to VM and deploy
echo -e "${CYAN}Step 3: Deploy on VM server${NC}"
echo "─────────────────────────────────────────"
echo ""
echo -e "${YELLOW}The following commands will be executed on VM:${NC}"
echo ""
echo "  cd /home/gallo/Code/Homepage"
echo "  git pull origin main"
echo "  ./deploy.sh"
echo ""
read -p "SSH to VM and run deployment? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${CYAN}Connecting to VM...${NC}"
    ssh -t "$VM_USER@$VM_IP" << 'ENDSSH'
        echo -e "\033[0;36m"
        echo "═══════════════════════════════════════════"
        echo "Connected to VM"
        echo "═══════════════════════════════════════════"
        echo -e "\033[0m"
        echo ""
        
        cd /home/gallo/Code/Homepage || exit 1
        
        echo -e "\033[1;33mPulling latest code from GitHub...\033[0m"
        git pull origin main
        
        echo ""
        echo -e "\033[1;33mStarting deployment...\033[0m"
        ./deploy.sh
        
        echo ""
        echo -e "\033[0;32m════════════════════════════════════\033[0m"
        echo -e "\033[0;32mDeployment Complete!\033[0m"
        echo -e "\033[0;32m════════════════════════════════════\033[0m"
        echo ""
        echo -e "\033[0;36mServices running:\033[0m"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
ENDSSH
else
    echo -e "${YELLOW}Manual deployment required. SSH to VM and run:${NC}"
    echo "  ssh $VM_USER@$VM_IP"
    echo "  cd /home/gallo/Code/Homepage"
    echo "  git pull origin main"
    echo "  ./deploy.sh"
    exit 0
fi

echo ""
echo -e "${GREEN}════════════════════════════════════${NC}"
echo -e "${GREEN}VM Deployment Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Access your site:${NC}"
echo "  - Website: http://192.168.0.90:3000"
echo "  - Backend API: http://192.168.0.90:8000"
echo "  - Arcade (members only): http://192.168.0.90:3000/arcade.html"
echo ""
echo -e "${CYAN}Test checklist:${NC}"
echo "  [ ] Open http://192.168.0.90:3000 from another device"
echo "  [ ] Register/login with a test account"
echo "  [ ] Navigate to Arcade section"
echo "  [ ] Test NES games (24 games available)"
echo "  [ ] Test GBA games (10 games available)"
echo "  [ ] Test on mobile device (fullscreen, landscape mode)"
echo ""
echo -e "${YELLOW}To check logs:${NC}"
echo "  ssh $VM_USER@$VM_IP"
echo "  cd /home/gallo/Code/Homepage"
echo "  docker logs homepage_backend"
echo "  docker logs homepage_frontend"
echo ""
