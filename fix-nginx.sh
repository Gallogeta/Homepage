#!/bin/bash

# Fix nginx 504 timeout issue
# This script pulls the updated nginx config and reloads nginx

set -e

echo "🔄 Pulling latest changes from GitHub..."
git pull origin main

echo "🔍 Testing nginx configuration..."
docker exec homepage_nginx nginx -t

echo "♻️  Reloading nginx..."
docker exec homepage_nginx nginx -s reload

echo "✅ Nginx configuration reloaded successfully!"
echo ""
echo "🧪 Testing backend connection from nginx..."
docker exec homepage_nginx wget -q -O- http://homepage_backend:8000/api/pages/home | head -c 100
echo ""
echo ""
echo "✅ Fix applied! Your site should work now."
