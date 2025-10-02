#!/bin/bash
# Homepage Deployment Script

set -e

echo "================================="
echo " Homepage Deployment"
echo " Made by GALLOGETA"
echo "================================="
echo ""

# Detect IP
SERVER_IP=$(hostname -I | awk "{print \$1}")
[ -z "$SERVER_IP" ] && SERVER_IP="localhost"
echo "Server IP: $SERVER_IP"
echo ""

# Install dependencies
echo "Checking dependencies..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt-get update -qq
    sudo apt-get install -y docker.io docker-compose curl
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
fi

if ! command -v docker-compose &> /dev/null; then
    sudo apt-get install -y docker-compose
fi

echo "Dependencies OK"
echo ""

# Create backend .env
echo "Configuring backend..."
if [ ! -f backend/.env ]; then
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "secret-$(date +%s)")
    cat > backend/.env <<EOF
DATABASE_URL=sqlite:///./data/db.sqlite3
JWT_SECRET_KEY=$JWT_SECRET
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
API_HOST=0.0.0.0
API_PORT=8000
ALLOWED_ORIGINS=http://$SERVER_IP:3000,http://localhost:3000
PRODUCTION=false
EOF
    echo "Created backend/.env"
else
    sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://$SERVER_IP:3000,http://localhost:3000|" backend/.env
    echo "Updated backend/.env"
fi
echo ""

# Update frontend proxy
echo "Configuring frontend..."
if [ -f frontend/vite.config.mjs ]; then
    sed -i "s|'/api': 'http://[^']*'|'/api': 'http://$SERVER_IP:8000'|" frontend/vite.config.mjs
    echo "Updated frontend proxy"
fi
echo ""

# Create directories
echo "Creating directories..."
mkdir -p backend/data backend/uploads backend/SNES backend/GBA
NES_COUNT=$(find backend/SNES -name "*.nes" 2>/dev/null | wc -l)
GBA_COUNT=$(find backend/GBA -name "*.gba" 2>/dev/null | wc -l)
echo "ROMs: $NES_COUNT NES, $GBA_COUNT GBA"
echo ""

# Deploy
echo "Deploying containers..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

echo ""
echo "Waiting for services..."
sleep 15

echo ""
echo "================================="
echo " Deployment Complete!"
echo "================================="
echo ""
echo "Access:"
echo "  http://$SERVER_IP:3000"
echo "  http://$SERVER_IP:8000/docs"
echo ""
echo "Commands:"
echo "  docker-compose logs -f"
echo "  docker-compose ps"
echo "  docker-compose down"
echo ""
