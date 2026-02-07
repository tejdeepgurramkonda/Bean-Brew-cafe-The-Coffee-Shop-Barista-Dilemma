#!/bin/bash

# Bean & Brew - Quick Start Script
# This script deploys the complete Bean & Brew application stack

echo "🚀 Bean & Brew - Quick Start Deployment"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed. Please install Docker Desktop first."
    echo "   Visit: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is installed and running"
echo ""

# Pull images
echo "📦 Pulling Docker images from Docker Hub..."
docker pull mcr.microsoft.com/mssql/server:2022-latest
docker pull tejdeep1/bean-brew-backend:latest
docker pull tejdeep1/bean-brew-frontend:latest

echo ""
echo "🗄️  Starting SQL Server database..."
docker run -d \
  --name bean-brew-database \
  -e "ACCEPT_EULA=Y" \
  -e "SA_PASSWORD=BeanBrew@2026" \
  -p 1433:1433 \
  --network bean-brew-network \
  mcr.microsoft.com/mssql/server:2022-latest 2>/dev/null || docker start bean-brew-database

echo "⏳ Waiting for database to be ready (30 seconds)..."
sleep 30

echo ""
echo "🔧 Starting Bean & Brew backend..."
docker run -d \
  --name bean-brew-backend \
  -p 8082:8082 \
  -e SPRING_DATASOURCE_URL="jdbc:sqlserver://bean-brew-database:1433;databaseName=BaristaDatabase;encrypt=true;trustServerCertificate=true" \
  -e SPRING_DATASOURCE_USERNAME="SA" \
  -e SPRING_DATASOURCE_PASSWORD="BeanBrew@2026" \
  --network bean-brew-network \
  tejdeep1/bean-brew-backend:latest 2>/dev/null || docker start bean-brew-backend

echo "⏳ Waiting for backend to initialize (20 seconds)..."
sleep 20

echo ""
echo "🎨 Starting Bean & Brew frontend..."
docker run -d \
  --name bean-brew-frontend \
  -p 3000:80 \
  --network bean-brew-network \
  tejdeep1/bean-brew-frontend:latest 2>/dev/null || docker start bean-brew-frontend

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Access your application:"
echo "   Frontend:    http://localhost:3000"
echo "   Backend API: http://localhost:8082"
echo "   Database:    localhost:1433 (SA/BeanBrew@2026)"
echo ""
echo "📊 View logs:"
echo "   docker logs -f bean-brew-backend"
echo "   docker logs -f bean-brew-frontend"
echo "   docker logs -f bean-brew-database"
echo ""
echo "🛑 To stop all services:"
echo "   docker stop bean-brew-frontend bean-brew-backend bean-brew-database"
echo ""
echo "🗑️  To remove all containers:"
echo "   docker rm bean-brew-frontend bean-brew-backend bean-brew-database"
echo ""
echo "☕ Enjoy Bean & Brew!"
