#!/bin/bash
# Pre-installation cleanup script
# Kills processes and cleans up ports before installation

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
echo "🧹 Cleaning up system before installation..."

# Function to kill process on port
kill_port() {
    local port=$1
    echo "Checking port $port..."
    
    # Find and kill process using the port
    local pids=$(sudo lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "  Killing process(es) on port $port: $pids"
        echo "$pids" | xargs sudo kill -9 2>/dev/null || true
        sleep 1
    else
        echo "  Port $port is free"
    fi
}

# Stop and remove all homepage-related containers
echo ""
echo "🐳 Stopping Docker containers..."
docker stop $(docker ps -aq --filter "name=homepage") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=homepage") 2>/dev/null || true

# Remove homepage networks
echo "🌐 Cleaning up Docker networks..."
docker network rm homepage_homepage_network 2>/dev/null || true
docker network prune -f 2>/dev/null || true

# Kill processes on required ports
echo ""
echo "🔌 Freeing up ports..."
kill_port 80
kill_port 443
kill_port 3000
kill_port 8000

# Remove any orphaned docker containers
echo ""
echo "🗑️  Removing orphaned containers..."
docker container prune -f

# Check final status
echo ""
echo "✅ Cleanup completed!"
echo ""
echo "Port status:"
ss -tulpn | grep -E ':(80|443|3000|8000)\s' && echo "⚠️  Some ports still in use!" || echo "✅ All ports are free"

echo ""
echo "Docker containers:"
docker ps -a --filter "name=homepage" --format "table {{.Names}}\t{{.Status}}" || echo "✅ No homepage containers"

echo ""
echo "Ready for installation!"
