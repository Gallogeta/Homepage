#!/bin/bash
# Copy Media Files (ROMs, Music, etc.) to Homepage Installation
# Run this after deployment to sync all media files

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Homepage Media Files Sync Tool        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ This script must be run with sudo${NC}"
    exit 1
fi

# Check if containers are running
if ! docker ps | grep -q homepage_backend; then
    echo -e "${RED}❌ Homepage containers are not running!${NC}"
    echo -e "${YELLOW}Please start them first: docker-compose up -d${NC}"
    exit 1
fi

echo -e "${CYAN}📦 Syncing media files...${NC}"
echo ""

# ============================================
# 1. COPY ROMs
# ============================================
echo -e "${YELLOW}Step 1: Copying ROMs...${NC}"

if [ -d "backend/SNES" ]; then
    ROM_COUNT=$(ls backend/SNES/*.nes 2>/dev/null | wc -l)
    if [ "$ROM_COUNT" -gt 0 ]; then
        echo "Found $ROM_COUNT ROM files"
        
        # Create directory in container if it doesn't exist
        docker exec homepage_backend mkdir -p /app/SNES
        
        # Copy all ROMs
        docker cp backend/SNES/. homepage_backend:/app/SNES/
        
        # Verify copy
        COPIED_COUNT=$(docker exec homepage_backend sh -c 'ls /app/SNES/*.nes 2>/dev/null | wc -l' || echo "0")
        echo -e "${GREEN}✓ Copied $COPIED_COUNT ROM files to backend container${NC}"
        
        # List some ROMs
        echo -e "${CYAN}Sample ROMs:${NC}"
        docker exec homepage_backend sh -c 'ls /app/SNES/*.nes | head -5' | sed 's/^/  /'
    else
        echo -e "${YELLOW}⚠ No ROM files found in backend/SNES/${NC}"
    fi
else
    echo -e "${RED}✗ backend/SNES directory not found${NC}"
fi

echo ""

# ============================================
# 2. COPY MUSIC FILES
# ============================================
echo -e "${YELLOW}Step 2: Copying music files...${NC}"

if [ -d "frontend/public/media" ]; then
    MUSIC_COUNT=$(find frontend/public/media -name "*.mp3" 2>/dev/null | wc -l)
    if [ "$MUSIC_COUNT" -gt 0 ]; then
        echo "Found $MUSIC_COUNT music files"
        
        # Create directory in volume
        mkdir -p /var/lib/docker/volumes/homepage_uploads_data/_data/media
        
        # Copy music files
        cp -r frontend/public/media/* /var/lib/docker/volumes/homepage_uploads_data/_data/media/ 2>/dev/null || true
        
        # Verify copy
        COPIED_MUSIC=$(find /var/lib/docker/volumes/homepage_uploads_data/_data/media -name "*.mp3" 2>/dev/null | wc -l || echo "0")
        echo -e "${GREEN}✓ Copied $COPIED_MUSIC music files to uploads volume${NC}"
    else
        echo -e "${YELLOW}⚠ No music files found${NC}"
    fi
else
    echo -e "${YELLOW}⚠ frontend/public/media directory not found${NC}"
fi

echo ""

# ============================================
# 3. COPY IMAGES
# ============================================
echo -e "${YELLOW}Step 3: Copying images...${NC}"

if [ -d "frontend/public/media/pics" ]; then
    IMAGE_COUNT=$(find frontend/public/media/pics -type f 2>/dev/null | wc -l)
    if [ "$IMAGE_COUNT" -gt 0 ]; then
        echo "Found $IMAGE_COUNT image files"
        
        # Create directory
        mkdir -p /var/lib/docker/volumes/homepage_uploads_data/_data/media/pics
        
        # Copy images
        cp -r frontend/public/media/pics/* /var/lib/docker/volumes/homepage_uploads_data/_data/media/pics/ 2>/dev/null || true
        
        echo -e "${GREEN}✓ Copied $IMAGE_COUNT image files${NC}"
    else
        echo -e "${YELLOW}⚠ No image files found${NC}"
    fi
else
    echo -e "${YELLOW}⚠ frontend/public/media/pics directory not found${NC}"
fi

echo ""

# ============================================
# 4. COPY ADDITIONAL UPLOADS
# ============================================
echo -e "${YELLOW}Step 4: Copying additional uploads...${NC}"

if [ -d "backend/uploads" ]; then
    UPLOAD_COUNT=$(find backend/uploads -type f 2>/dev/null | wc -l)
    if [ "$UPLOAD_COUNT" -gt 0 ]; then
        echo "Found $UPLOAD_COUNT additional files"
        cp -r backend/uploads/* /var/lib/docker/volumes/homepage_uploads_data/_data/ 2>/dev/null || true
        echo -e "${GREEN}✓ Copied additional uploads${NC}"
    else
        echo -e "${YELLOW}⚠ No additional uploads found${NC}"
    fi
else
    echo -e "${YELLOW}⚠ backend/uploads directory not found${NC}"
fi

echo ""

# ============================================
# 5. SET PERMISSIONS
# ============================================
echo -e "${YELLOW}Step 5: Setting permissions...${NC}"

# Set ownership in backend container
docker exec homepage_backend chown -R app:app /app/SNES 2>/dev/null || true

# Set permissions on uploads volume
chown -R 1000:1000 /var/lib/docker/volumes/homepage_uploads_data/_data/ 2>/dev/null || true
chmod -R 755 /var/lib/docker/volumes/homepage_uploads_data/_data/ 2>/dev/null || true

echo -e "${GREEN}✓ Permissions set${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      ✅ Media Sync Complete! ✅           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""

# Summary
echo -e "${CYAN}📊 Summary:${NC}"
docker exec homepage_backend sh -c 'echo "  ROMs: $(ls /app/SNES/*.nes 2>/dev/null | wc -l) files"' 2>/dev/null || echo "  ROMs: 0 files"
echo "  Music: $(find /var/lib/docker/volumes/homepage_uploads_data/_data/media -name '*.mp3' 2>/dev/null | wc -l || echo '0') files"
echo "  Images: $(find /var/lib/docker/volumes/homepage_uploads_data/_data/media/pics -type f 2>/dev/null | wc -l || echo '0') files"
echo ""

echo -e "${GREEN}Media files are now available:${NC}"
echo -e "  • ROMs at: ${CYAN}http://your-server/api/snes/Game-Name.nes${NC}"
echo -e "  • Music at: ${CYAN}http://your-server/media/01.mp3${NC}"
echo -e "  • Arcade page: ${CYAN}http://your-server/arcade.html${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Restart nginx: ${CYAN}docker restart homepage_nginx${NC}"
echo -e "  2. Visit arcade page to test ROMs"
echo -e "  3. Check mobile arcade for music player"
echo ""
