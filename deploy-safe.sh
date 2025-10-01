#!/bin/bash
# Homepage Safe Deployment Script
# Preserves database and media files during deployment

set -e  # Exit on error

echo "🚀 Starting Homepage Deployment..."

# Step 1: Backup database and media
echo ""
echo "📦 Step 1: Creating backup..."
./backup-db.sh

# Step 2: Pull latest code
echo ""
echo "📥 Step 2: Pulling latest code from GitHub..."
git pull origin main

# Step 3: Stop containers (WITHOUT removing volumes)
echo ""
echo "⏹️  Step 3: Stopping containers..."
docker-compose down
# NOTE: We DON'T use -v flag to preserve volumes (db_data, uploads_data)

# Step 4: Rebuild images
echo ""
echo "🔨 Step 4: Building updated images..."
docker-compose build --no-cache

# Step 5: Start containers
echo ""
echo "▶️  Step 5: Starting containers..."
docker-compose up -d

# Step 6: Wait for services
echo ""
echo "⏳ Step 6: Waiting for services to be ready..."
sleep 10

# Step 7: Sync frontend build to volume
echo ""
echo "🔄 Step 7: Syncing frontend build..."
cd frontend
npm install
npm run build
sudo cp -r dist/* /var/lib/docker/volumes/homepage_frontend_build/_data/
cd ..

# Step 8: Restart nginx to clear cache
echo ""
echo "🔃 Step 8: Restarting nginx..."
docker restart homepage_nginx

# Step 9: Check service status
echo ""
echo "✅ Step 9: Checking service status..."
docker ps --filter "name=homepage" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Step 10: Test endpoints
echo ""
echo "🧪 Step 10: Testing endpoints..."
echo -n "  Backend health: "
if curl -s http://localhost:8000/ > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

echo -n "  Frontend: "
if curl -s http://localhost/ > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

echo -n "  API: "
if curl -s http://localhost/api/ > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📊 Summary:"
echo "  - Database: Preserved in volume 'homepage_db_data'"
echo "  - Media files: Preserved in volume 'homepage_uploads_data'"
echo "  - Backup saved in: ./backups/"
echo "  - Website: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "💡 Tips:"
echo "  - View logs: docker-compose logs -f"
echo "  - Restart: docker-compose restart"
echo "  - Stop: docker-compose down"
