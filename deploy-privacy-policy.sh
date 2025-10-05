#!/bin/bash

# Deploy Privacy Policy update to server

set -e

echo "🚀 Deploying Privacy Policy to server..."
echo ""

cd /mnt/data/Homepage

echo "📥 Pulling latest changes from GitHub..."
git pull origin main

echo ""
echo "🔄 Rebuilding frontend container to include new HTML..."
docker-compose build frontend

echo ""
echo "♻️  Restarting frontend container..."
docker-compose up -d frontend

echo ""
echo "⏳ Waiting for container to start..."
sleep 5

echo ""
echo "✅ Privacy Policy deployed successfully!"
echo ""
echo "🌐 Access the Privacy Policy at:"
echo "   https://itsusi.eu/privacy-policy.html"
echo ""
echo "📋 Test it:"
echo "   curl https://itsusi.eu/privacy-policy.html | grep 'Privacy Policy'"
