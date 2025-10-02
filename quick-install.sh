#!/bin/bash
# Quick Install Script - Downloads and runs the installer

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

REPO_URL="https://github.com/Gallogeta/Homepage.git"
INSTALL_DIR="/opt/homepage"

echo "╔════════════════════════════════════════════╗"
echo "║   Homepage Quick Install Script            ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Please run as root or with sudo"
    echo "   sudo bash quick-install.sh"
    exit 1
fi

# Check dependencies
echo "📋 Checking dependencies..."
MISSING_DEPS=()

if ! command -v git &> /dev/null; then
    MISSING_DEPS+=("git")
fi

if ! command -v docker &> /dev/null; then
    MISSING_DEPS+=("docker")
fi

if ! command -v docker-compose &> /dev/null; then
    MISSING_DEPS+=("docker-compose")
fi

if ! command -v node &> /dev/null; then
    MISSING_DEPS+=("nodejs")
fi

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo "❌ Missing dependencies: ${MISSING_DEPS[*]}"
    echo ""
    echo "Install them with:"
    echo "  Ubuntu/Debian:"
    echo "    sudo apt update"
    echo "    sudo apt install -y git docker.io docker-compose nodejs npm"
    echo ""
    echo "  After installation, add user to docker group:"
    echo "    sudo usermod -aG docker \$USER"
    echo "    newgrp docker"
    exit 1
fi

echo "✓ All dependencies found"
echo ""

# Ask for installation directory
read -p "Install directory [$INSTALL_DIR]: " CUSTOM_DIR
if [ -n "$CUSTOM_DIR" ]; then
    INSTALL_DIR=$CUSTOM_DIR
fi

# Check if directory exists
if [ -d "$INSTALL_DIR" ]; then
    echo "⚠️  Directory $INSTALL_DIR already exists"
    read -p "Remove and reinstall? (yes/no): " CONFIRM
    if [ "$CONFIRM" = "yes" ]; then
        rm -rf "$INSTALL_DIR"
    else
        echo "Installation cancelled"
        exit 0
    fi
fi

# Clone repository
echo "📥 Cloning repository..."
git clone "$REPO_URL" "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Run installer
echo ""
echo "🚀 Starting interactive installer..."
echo ""
./install.sh

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║     Installation Complete!                 ║"
echo "╚════════════════════════════════════════════╝"
