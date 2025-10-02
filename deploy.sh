#!/bin/bash
# Homepage Deployment Script

set -e

# Colors
CYAN='\033[0;36m'
NC='\033[0m'

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
echo "🚀 Deploying Homepage..."

# Stop existing containers

# Colors for outputecho "⏹️  Stopping existing containers..."

RED='\033[0;31m'docker-compose down

GREEN='\033[0;32m'

YELLOW='\033[1;33m'# Pull latest changes (if using git)

BLUE='\033[0;34m'# echo "📥 Pulling latest changes..."

NC='\033[0m' # No Color# git pull origin main



# Configuration# Build and start containers

REPO_URL="https://github.com/Gallogeta/Homepage.git"echo "🔨 Building and starting containers..."

DEPLOY_DIR="/opt/homepage"docker-compose up -d --build

DOMAIN="itsusi.eu"

SERVER_IP="192.168.0.90"# Wait for services to be ready

ADMIN_USER="gallo"echo "⏳ Waiting for services to start..."

sleep 10

echo -e "${BLUE}========================================${NC}"

echo -e "${BLUE}Homepage Deployment Script${NC}"# Check if services are running

echo -e "${BLUE}Domain: ${DOMAIN}${NC}"echo "✅ Checking service status..."

echo -e "${BLUE}Server IP: ${SERVER_IP}${NC}"docker-compose ps

echo -e "${BLUE}========================================${NC}"

# Test backend health

# Check if running as rootecho "🩺 Testing backend health..."

if [[ $EUID -ne 0 ]]; thencurl -f http://192.168.0.90/health || echo "⚠️  Backend health check failed"

   echo -e "${RED}This script must be run as root${NC}" 

   echo "Please run: sudo ./deploy.sh"# Test frontend

   exit 1echo "🌐 Testing frontend..."

ficurl -f http://localhost:3000 || echo "⚠️  Frontend health check failed"



echo -e "${YELLOW}[1/11] Installing system dependencies...${NC}"echo "🎉 Deployment complete!"

apt-get updateecho "📍 Frontend: http://localhost:3000"

apt-get install -y \echo "📍 Backend: http://192.168.0.90"

    git \echo "📍 API Docs: http://192.168.0.90/docs"
    docker.io \
    docker-compose \
    nginx \
    certbot \
    python3-certbot-nginx \
    curl \
    wget \
    ufw \
    sqlite3

# Enable and start Docker
systemctl enable docker
systemctl start docker

# Add current user to docker group
if [ -n "$SUDO_USER" ]; then
    usermod -aG docker $SUDO_USER
fi

echo -e "${YELLOW}[2/11] Setting up firewall...${NC}"
ufw --force enable
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw allow 8000/tcp  # Backend (optional, for debugging)
ufw reload

echo -e "${YELLOW}[3/11] Creating deployment directory...${NC}"
mkdir -p ${DEPLOY_DIR}
cd ${DEPLOY_DIR}

echo -e "${YELLOW}[4/11] Cloning/updating repository...${NC}"
if [ -d "${DEPLOY_DIR}/.git" ]; then
    echo "Repository exists, pulling latest changes..."
    git fetch origin
    git reset --hard origin/main
    git pull origin main
else
    echo "Cloning repository..."
    git clone ${REPO_URL} .
fi

echo -e "${YELLOW}[5/11] Creating production environment files...${NC}"

# Create backend .env
cat > ${DEPLOY_DIR}/backend/.env << EOF
# Production Environment Configuration

# Database
DATABASE_URL=sqlite:///./data/db.sqlite3

# JWT Settings
JWT_SECRET_KEY=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Settings
API_HOST=0.0.0.0
API_PORT=8000

# CORS - Allow domain and www subdomain
ALLOWED_ORIGINS=https://${DOMAIN},https://www.${DOMAIN},http://${DOMAIN},http://www.${DOMAIN},http://${SERVER_IP}

# Admin user
ADMIN_USER=${ADMIN_USER}

# Security
REQUIRE_EMAIL_VERIFIED_FOR_LOGIN=false

# Production mode
PRODUCTION=true
EOF

echo -e "${YELLOW}[6/11] Creating data directories...${NC}"
mkdir -p ${DEPLOY_DIR}/backend/data
mkdir -p ${DEPLOY_DIR}/backend/uploads
chmod -R 755 ${DEPLOY_DIR}/backend/data
chmod -R 755 ${DEPLOY_DIR}/backend/uploads

echo -e "${YELLOW}[7/11] Stopping existing containers...${NC}"
cd ${DEPLOY_DIR}
docker-compose down || true

echo -e "${YELLOW}[8/11] Building and starting containers...${NC}"
docker-compose build --no-cache
docker-compose up -d

echo -e "${YELLOW}[9/11] Waiting for services to start...${NC}"
sleep 15

# Check if containers are running
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${RED}Error: Containers failed to start${NC}"
    echo -e "${RED}Showing logs:${NC}"
    docker-compose logs --tail=50
    exit 1
fi

echo -e "${GREEN}Containers are running:${NC}"
docker-compose ps

echo -e "${YELLOW}[10/11] Configuring Nginx reverse proxy...${NC}"

# Stop nginx if running (we'll use Docker's nginx)
systemctl stop nginx || true
systemctl disable nginx || true

# Create production nginx config
cat > ${DEPLOY_DIR}/nginx/nginx.prod.conf << 'NGINX_EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        listen [::]:80;
        server_name itsusi.eu www.itsusi.eu 192.168.0.90;

        client_max_body_size 10M;

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Backend uploads
        location /uploads/ {
            limit_req zone=general burst=10 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Frontend
        location / {
            limit_req zone=general burst=20 nodelay;
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
NGINX_EOF

# Use the production nginx config
cp ${DEPLOY_DIR}/nginx/nginx.conf ${DEPLOY_DIR}/nginx/nginx.conf.backup || true
cp ${DEPLOY_DIR}/nginx/nginx.prod.conf ${DEPLOY_DIR}/nginx/nginx.conf

# Restart nginx container to use new config
docker-compose restart nginx

echo -e "${YELLOW}[11/11] Final checks...${NC}"

# Test the deployment
sleep 5
echo -e "${BLUE}Testing endpoints...${NC}"

if curl -s http://localhost/health > /dev/null; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
fi

if curl -s http://localhost/ > /dev/null; then
    echo -e "${GREEN}✓ Frontend accessible${NC}"
else
    echo -e "${RED}✗ Frontend not accessible${NC}"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Access your application at:${NC}"
echo -e "  ${GREEN}http://${SERVER_IP}${NC}"
echo -e "  ${GREEN}http://${DOMAIN}${NC} ${YELLOW}(configure DNS A record first)${NC}"
echo ""
echo -e "${BLUE}Container status:${NC}"
docker-compose ps
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo -e "  View logs:    ${YELLOW}cd ${DEPLOY_DIR} && docker-compose logs -f${NC}"
echo -e "  Restart:      ${YELLOW}cd ${DEPLOY_DIR} && docker-compose restart${NC}"
echo -e "  Stop:         ${YELLOW}cd ${DEPLOY_DIR} && docker-compose down${NC}"
echo -e "  Update:       ${YELLOW}cd ${DEPLOY_DIR} && git pull && docker-compose up -d --build${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "1. ${YELLOW}Point DNS:${NC} Configure ${DOMAIN} A record to point to ${SERVER_IP}"
echo -e "2. ${YELLOW}SSL Setup:${NC} Run after DNS is configured:"
echo -e "   ${GREEN}certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}${NC}"
echo -e "3. ${YELLOW}Create admin user:${NC} Login and register user '${ADMIN_USER}'"
echo ""
echo -e "${GREEN}LAN Access:${NC} You can access from any device on your network at ${GREEN}http://${SERVER_IP}${NC}"
echo ""
