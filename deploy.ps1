# Bean & Brew - Quick Start Script (PowerShell)
# This script deploys the complete Bean & Brew application stack

Write-Host "🚀 Bean & Brew - Quick Start Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "   Visit: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Create network if it doesn't exist
Write-Host "🌐 Creating Docker network..." -ForegroundColor Yellow
docker network create bean-brew-network 2>$null

# Pull images
Write-Host "📦 Pulling Docker images from Docker Hub..." -ForegroundColor Yellow
docker pull mcr.microsoft.com/mssql/server:2022-latest
docker pull tejdeep1/bean-brew-backend:latest
docker pull tejdeep1/bean-brew-frontend:latest

Write-Host ""
Write-Host "🗄️  Starting SQL Server database..." -ForegroundColor Yellow
docker run -d `
  --name bean-brew-database `
  -e "ACCEPT_EULA=Y" `
  -e "SA_PASSWORD=BeanBrew@2026" `
  -p 1433:1433 `
  --network bean-brew-network `
  mcr.microsoft.com/mssql/server:2022-latest 2>$null

if ($LASTEXITCODE -ne 0) {
    docker start bean-brew-database 2>$null
}

Write-Host "⏳ Waiting for database to be ready (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "🔧 Starting Bean & Brew backend..." -ForegroundColor Yellow
docker run -d `
  --name bean-brew-backend `
  -p 8082:8082 `
  -e SPRING_DATASOURCE_URL="jdbc:sqlserver://bean-brew-database:1433;databaseName=BaristaDatabase;encrypt=true;trustServerCertificate=true" `
  -e SPRING_DATASOURCE_USERNAME="SA" `
  -e SPRING_DATASOURCE_PASSWORD="BeanBrew@2026" `
  --network bean-brew-network `
  tejdeep1/bean-brew-backend:latest 2>$null

if ($LASTEXITCODE -ne 0) {
    docker start bean-brew-backend 2>$null
}

Write-Host "⏳ Waiting for backend to initialize (20 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

Write-Host ""
Write-Host "🎨 Starting Bean & Brew frontend..." -ForegroundColor Yellow
docker run -d `
  --name bean-brew-frontend `
  -p 3000:80 `
  --network bean-brew-network `
  tejdeep1/bean-brew-frontend:latest 2>$null

if ($LASTEXITCODE -ne 0) {
    docker start bean-brew-frontend 2>$null
}

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access your application:" -ForegroundColor Cyan
Write-Host "   Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API: http://localhost:8082" -ForegroundColor White
Write-Host "   Database:    localhost:1433 (SA/BeanBrew@2026)" -ForegroundColor White
Write-Host ""
Write-Host "📊 View logs:" -ForegroundColor Cyan
Write-Host "   docker logs -f bean-brew-backend" -ForegroundColor White
Write-Host "   docker logs -f bean-brew-frontend" -ForegroundColor White
Write-Host "   docker logs -f bean-brew-database" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop all services:" -ForegroundColor Cyan
Write-Host "   docker stop bean-brew-frontend bean-brew-backend bean-brew-database" -ForegroundColor White
Write-Host ""
Write-Host "🗑️  To remove all containers:" -ForegroundColor Cyan
Write-Host "   docker rm bean-brew-frontend bean-brew-backend bean-brew-database" -ForegroundColor White
Write-Host ""
Write-Host "☕ Enjoy Bean & Brew!" -ForegroundColor Yellow
