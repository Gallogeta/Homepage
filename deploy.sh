#!/bin/bash

# Homepage Deployment Script
set -e

echo "🚀 Deploying Homepage..."

# Stop existing containers
echo "⏹️  Stopping existing containers..."
docker-compose down

# Pull latest changes (if using git)
# echo "📥 Pulling latest changes..."
# git pull origin main

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "✅ Checking service status..."
docker-compose ps

# Test backend health
echo "🩺 Testing backend health..."
curl -f http://192.168.0.90/health || echo "⚠️  Backend health check failed"

# Test frontend
echo "🌐 Testing frontend..."
curl -f http://localhost:3000 || echo "⚠️  Frontend health check failed"

echo "🎉 Deployment complete!"
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend: http://192.168.0.90"
echo "📍 API Docs: http://192.168.0.90/docs"