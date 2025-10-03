#!/bin/bash
# Quick deployment script for all security improvements
# Run this on your server (192.168.0.90)

set -e  # Exit on error

echo "🔒 Homepage Security Deployment"
echo "==============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on server
if [ ! -d "/mnt/data/Homepage" ]; then
    echo -e "${RED}❌ Error: This script must be run on the server (192.168.0.90)${NC}"
    echo "Run from local machine instead:"
    echo "  scp deploy-security.sh gallo@192.168.0.90:/tmp/"
    echo "  ssh gallo@192.168.0.90 'bash /tmp/deploy-security.sh'"
    exit 1
fi

cd /mnt/data/Homepage

echo -e "${YELLOW}📥 Step 1: Pulling latest changes from GitHub...${NC}"
git pull origin main
echo -e "${GREEN}✅ Code updated${NC}"
echo ""

echo -e "${YELLOW}🌐 Step 2: Deploying nginx configuration...${NC}"
docker-compose restart nginx
sleep 3
if docker-compose ps | grep -q "nginx.*Up"; then
    echo -e "${GREEN}✅ nginx restarted successfully${NC}"
else
    echo -e "${RED}❌ nginx failed to start! Check logs:${NC}"
    docker-compose logs nginx
    exit 1
fi
echo ""

echo -e "${YELLOW}🚫 Step 3: Installing fail2ban...${NC}"
if command -v fail2ban-client &> /dev/null; then
    echo "fail2ban already installed"
else
    sudo ./fail2ban-setup.sh
fi
echo -e "${GREEN}✅ Fail2ban configured${NC}"
echo ""

echo -e "${YELLOW}🔍 Step 4: Setting up monitoring...${NC}"
sudo ./setup-monitoring.sh
cd monitoring
sudo ./setup-cron.sh
cd ..
echo -e "${GREEN}✅ Monitoring enabled${NC}"
echo ""

echo -e "${YELLOW}📊 Step 5: Running initial security check...${NC}"
sudo /mnt/data/Homepage/monitoring/security-alerts.sh
echo ""

echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Security deployment complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📋 Summary:${NC}"
echo "  ✅ nginx rate limiting active"
echo "  ✅ Malicious request blocking enabled"
echo "  ✅ fail2ban auto-banning configured"
echo "  ✅ Monitoring scripts running"
echo "  ✅ Security alerts automated"
echo ""
echo -e "${YELLOW}🎯 Next Steps:${NC}"
echo ""
echo "1. Setup Cloudflare (HIGHLY RECOMMENDED for DDoS protection):"
echo "   Read: /mnt/data/Homepage/CLOUDFLARE_SETUP.md"
echo ""
echo "2. Monitor your site:"
echo "   sudo tail -f /var/log/security-alerts.log"
echo ""
echo "3. Check fail2ban status:"
echo "   sudo fail2ban-client status"
echo ""
echo "4. View security analysis:"
echo "   sudo /mnt/data/Homepage/monitoring/analyze-logs.sh"
echo ""
echo -e "${GREEN}Your site is now much more secure! 🎉${NC}"
echo ""
