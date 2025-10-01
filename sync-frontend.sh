#!/bin/bash
# Script to sync frontend build to Docker volume

echo "🔄 Syncing frontend build to Docker volume..."

# Build frontend
cd /home/gallo/Code/Homepage/frontend
echo "📦 Building frontend..."
npm run build

# Copy to Docker volume
echo "📋 Copying to Docker volume..."
sudo cp -r dist/* /var/lib/docker/volumes/homepage_frontend_build/_data/

# Restart nginx to clear any cache
echo "🔃 Restarting nginx..."
docker restart homepage_nginx

echo "✅ Sync complete! Files updated at $(date)"
