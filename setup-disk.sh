#!/bin/bash
# Setup 450GB disk for Homepage installation
# Run this on the VM as: sudo ./setup-disk.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       450GB Disk Setup for Homepage       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ This script must be run with sudo${NC}"
    exit 1
fi

# Show current disks
echo -e "${CYAN}📊 Current disks:${NC}"
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT | grep -E "NAME|sd"
echo ""

# Check if /dev/sdb exists
if [ ! -b "/dev/sdb" ]; then
    echo -e "${RED}❌ /dev/sdb not found! Is the disk attached?${NC}"
    exit 1
fi

# Warning
echo -e "${YELLOW}⚠️  WARNING: This will format /dev/sdb (450GB disk)${NC}"
echo -e "${YELLOW}   All data on /dev/sdb will be LOST!${NC}"
echo ""
read -p "Type 'yes' to continue: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${GREEN}Cancelled. No changes made.${NC}"
    exit 0
fi

echo ""
echo -e "${CYAN}🔨 Setting up disk...${NC}"
echo ""

# Step 1: Create partition table
echo -e "${YELLOW}Step 1: Creating GPT partition table on /dev/sdb...${NC}"
parted /dev/sdb --script mklabel gpt
echo -e "${GREEN}✓ Partition table created${NC}"

# Step 2: Create partition
echo -e "${YELLOW}Step 2: Creating partition...${NC}"
parted /dev/sdb --script mkpart primary ext4 0% 100%
echo -e "${GREEN}✓ Partition created${NC}"

# Wait for device
sleep 2

# Step 3: Format with ext4
echo -e "${YELLOW}Step 3: Formatting /dev/sdb1 with ext4...${NC}"
mkfs.ext4 -F /dev/sdb1
echo -e "${GREEN}✓ Filesystem created${NC}"

# Step 4: Create mount point
echo -e "${YELLOW}Step 4: Creating mount point /mnt/data...${NC}"
mkdir -p /mnt/data
echo -e "${GREEN}✓ Mount point created${NC}"

# Step 5: Mount the disk
echo -e "${YELLOW}Step 5: Mounting /dev/sdb1 to /mnt/data...${NC}"
mount /dev/sdb1 /mnt/data
echo -e "${GREEN}✓ Disk mounted${NC}"

# Step 6: Set permissions
echo -e "${YELLOW}Step 6: Setting permissions...${NC}"
chown -R gallo:gallo /mnt/data
chmod 755 /mnt/data
echo -e "${GREEN}✓ Permissions set${NC}"

# Step 7: Add to fstab for auto-mount on boot
echo -e "${YELLOW}Step 7: Adding to /etc/fstab for auto-mount...${NC}"
UUID=$(blkid /dev/sdb1 -s UUID -o value)
if ! grep -q "$UUID" /etc/fstab; then
    echo "UUID=$UUID /mnt/data ext4 defaults 0 2" >> /etc/fstab
    echo -e "${GREEN}✓ Added to fstab${NC}"
else
    echo -e "${YELLOW}Already in fstab, skipping${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ✅ Disk Setup Complete! ✅        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""

# Show disk info
echo -e "${CYAN}📊 Disk Information:${NC}"
df -h /mnt/data
echo ""
lsblk /dev/sdb
echo ""

echo -e "${GREEN}The 450GB disk is now ready at: ${CYAN}/mnt/data${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Clone Homepage: ${CYAN}sudo git clone https://github.com/Gallogeta/Homepage.git /mnt/data/homepage${NC}"
echo -e "  2. Run installer:  ${CYAN}cd /mnt/data/homepage && sudo ./install.sh${NC}"
echo -e "  3. Choose custom path: ${CYAN}/mnt/data/homepage${NC}"
echo ""
