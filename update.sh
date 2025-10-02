#!/bin/bash

# Homepage Deployment Update Script
# This script pulls the latest version from GitHub and rebuilds the application

set -e  # Exit on any error

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
echo "🚀 Starting Homepage deployment update..."ash

# Homepage Deployment Update Script
# This script pulls the latest version from GitHub and rebuilds the application

set -e  # Exit on any error

echo "� Starting Homepage deployment update..."

# Configuration
REPO_URL="https://github.com/Gallogeta/Homepage.git"
PROJECT_DIR="/home/gallo/Homepage"
BACKUP_DIR="/home/gallo/Homepage_backup_$(date +%Y%m%d_%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if service is running
check_service() {
    if docker-compose ps | grep -q "Up"; then
        return 0
    else
        return 1
    fi
}

# Create backup of current deployment
create_backup() {
    log_info "Creating backup of current deployment..."
    if [ -d "$PROJECT_DIR" ]; then
        cp -r "$PROJECT_DIR" "$BACKUP_DIR"
        log_success "Backup created at $BACKUP_DIR"
    else
        log_warning "No existing deployment found to backup"
    fi
}

# Restore from backup
restore_backup() {
    log_warning "Restoring from backup..."
    if [ -d "$BACKUP_DIR" ]; then
        rm -rf "$PROJECT_DIR"
        mv "$BACKUP_DIR" "$PROJECT_DIR"
        log_success "Restored from backup"
    else
        log_error "No backup found to restore from"
    fi
}

# Main update function
update_deployment() {
    log_info "Stopping current services..."
    cd "$PROJECT_DIR" && docker-compose down || true

    log_info "Pulling latest code from GitHub..."
    if [ -d "$PROJECT_DIR/.git" ]; then
        cd "$PROJECT_DIR"
        git stash push -m "Auto-stash before update $(date)"
        git pull origin main
    else
        log_info "Cloning repository..."
        rm -rf "$PROJECT_DIR"
        git clone "$REPO_URL" "$PROJECT_DIR"
        cd "$PROJECT_DIR"
    fi

    log_info "Building Docker images..."
    docker-compose build --no-cache

    log_info "Starting services..."
    docker-compose up -d

    # Wait for services to start
    log_info "Waiting for services to start..."
    sleep 30

    # Health check
    log_info "Performing health checks..."
    
    # Check if containers are running
    if check_service; then
        log_success "Docker containers are running"
    else
        log_error "Docker containers failed to start"
        return 1
    fi

    # Check backend health
    if curl -f http://192.168.0.90/health >/dev/null 2>&1; then
        log_success "Backend health check passed"
    else
        log_warning "Backend health check failed"
    fi

    # Check frontend
    if curl -f http://192.168.0.90/ >/dev/null 2>&1; then
        log_success "Frontend health check passed"
    else
        log_warning "Frontend health check failed"
    fi

    log_success "Deployment update completed!"
    
    # Show service URLs
    echo ""
    echo "🌐 Service URLs:"
    echo "📍 Homepage: http://192.168.0.90"
    echo "📍 API: http://192.168.0.90/api"
    echo "📍 API Docs: http://192.168.0.90/docs"
    echo ""
    
    # Clean up old backup after successful deployment
    if [ -d "$BACKUP_DIR" ]; then
        read -p "Remove backup from $BACKUP_DIR? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$BACKUP_DIR"
            log_success "Backup cleaned up"
        fi
    fi
}

# Main execution
main() {
    log_info "Homepage Update Script v1.0"
    echo "=============================="
    
    # Check if Docker is running
    if ! docker --version >/dev/null 2>&1; then
        log_error "Docker is not installed or not running"
        exit 1
    fi

    # Check if docker-compose is available
    if ! docker-compose --version >/dev/null 2>&1; then
        log_error "docker-compose is not installed"
        exit 1
    fi

    # Create backup
    create_backup

    # Try to update
    if update_deployment; then
        log_success "Update completed successfully!"
        exit 0
    else
        log_error "Update failed, attempting to restore from backup..."
        restore_backup
        cd "$PROJECT_DIR" && docker-compose up -d
        log_warning "Restored to previous version"
        exit 1
    fi
}

# Handle script interruption
trap 'log_warning "Update interrupted"; exit 1' INT TERM

# Run main function
main "$@"

echo "✅ Update complete!"