#!/bin/bash
set -e

echo "======================================"
echo "  Homepage Deployment"
echo "  Made by GALLOGETA"
echo "======================================"
echo ""
echo "Deploying Homepage with Docker..."
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker not installed"
    echo "Install with: sudo apt install -y docker.io docker-compose"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: docker-compose not installed"  
    echo "Install with: sudo apt install -y docker-compose"
    exit 1
fi

# Create directories
echo "Creating directories..."
mkdir -p ./backend/data
mkdir -p ./backend/uploads
mkdir -p ./backend/SNES
mkdir -p ./backend/GBA

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Build and start
echo "Building and starting containers..."
docker-compose up -d --build

# Wait
echo "Waiting for services..."
sleep 10

# Status
echo ""
echo "======================================"
docker-compose ps
echo "======================================"
echo ""
echo "Deployment complete!"
echo ""
echo "Access:"
echo "  Frontend: http://192.168.0.90:3000"
echo "  Backend:  http://192.168.0.90:8000"
echo "  Arcade:   http://192.168.0.90:3000/arcade.html"
echo ""
echo "Commands:"
echo "  Logs:    docker-compose logs -f"
echo "  Stop:    docker-compose down"
echo "  Restart: docker-compose restart"
echo ""
