# PowerShell Script to Start All E-commerce Microservices

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "E-commerce Microservices Starter" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Load environment configuration
Write-Host "Loading environment configuration..." -ForegroundColor Yellow
if (Test-Path ".\config.env.ps1") {
    . .\config.env.ps1
} else {
    Write-Host "Warning: config.env.ps1 not found, using default values" -ForegroundColor Yellow
}

# Check if Docker is running
Write-Host ""
Write-Host "Checking Docker status..." -ForegroundColor Yellow
$dockerRunning = $false
try {
    docker ps | Out-Null
    $dockerRunning = $true
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Docker is not running" -ForegroundColor Red
    Write-Host "Starting Docker Desktop automatically..." -ForegroundColor Yellow
    & ".\restart-docker.ps1"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to start Docker. Please start it manually and try again." -ForegroundColor Red
        exit 1
    }
}

# Start infrastructure services
Write-Host ""
Write-Host "Starting infrastructure services..." -ForegroundColor Yellow
Write-Host "MongoDB, Redis, Kafka, Zookeeper..." -ForegroundColor Gray
Push-Location services/inventory
docker-compose up -d
Pop-Location

Write-Host "Infrastructure services started" -ForegroundColor Green
Write-Host "  - Redis: localhost:6379" -ForegroundColor Gray
Write-Host "  - Kafka: localhost:9092" -ForegroundColor Gray
Write-Host "  - Kafka UI: http://localhost:8080" -ForegroundColor Gray
Write-Host ""
Write-Host "Using MongoDB Atlas (cloud database)" -ForegroundColor Cyan
Write-Host "  - Connection: cluster0.ejp03r8.mongodb.net" -ForegroundColor Gray
Write-Host ""
Write-Host "Waiting 10 seconds for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Function to start a service
function Start-MicroService {
    param (
        [string]$ServiceName,
        [string]$ServicePath,
        [hashtable]$EnvVars,
        [int]$Port
    )
    
    Write-Host ""
    Write-Host "Starting $ServiceName on port $Port..." -ForegroundColor Cyan
    
    # Create environment variables string
    $envString = ""
    foreach ($key in $EnvVars.Keys) {
        $envString += "`$env:$key='$($EnvVars[$key])'; "
    }
    
    # Build the command
    $command = "$envString cd '$ServicePath'; npm run start:dev"
    
    # Start in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $command
    
    Write-Host "$ServiceName started in new window" -ForegroundColor Green
}

# Start all microservices
Write-Host ""
Write-Host "Starting microservices..." -ForegroundColor Yellow
Write-Host "Each service will open in a new PowerShell window" -ForegroundColor Gray
Write-Host ""

# Order Service
Start-MicroService -ServiceName "Order Service" -ServicePath "$PSScriptRoot\services\order" -EnvVars @{
    MONGO_URI = $env:MONGO_URI_ORDER
    PORT = $env:PORT_ORDER
} -Port $env:PORT_ORDER

Start-Sleep -Seconds 2

# Product Service
Start-MicroService -ServiceName "Product Service" -ServicePath "$PSScriptRoot\services\product" -EnvVars @{
    MONGO_URI = $env:MONGO_URI_PRODUCT
    PORT = $env:PORT_PRODUCT
    KAFKA_BROKERS = $env:KAFKA_BROKERS
    ELASTICSEARCH_NODE = $env:ELASTICSEARCH_NODE
} -Port $env:PORT_PRODUCT

Start-Sleep -Seconds 2

# Inventory Service
Start-MicroService -ServiceName "Inventory Service" -ServicePath "$PSScriptRoot\services\inventory" -EnvVars @{
    MONGO_URI = $env:MONGO_URI_INVENTORY
    INVENTORY_PORT = $env:PORT_INVENTORY
    PORT = $env:PORT_INVENTORY
    KAFKA_BROKER = $env:KAFKA_BROKER
    REDIS_HOST = $env:REDIS_HOST
    REDIS_URL = "redis://$($env:REDIS_HOST):6379"
} -Port $env:PORT_INVENTORY

Start-Sleep -Seconds 2

# Auth Service
Start-MicroService -ServiceName "Auth Service" -ServicePath "$PSScriptRoot\services\auth" -EnvVars @{
    MONGO_URI = $env:MONGO_URI_AUTH
    AUTH_PORT = $env:PORT_AUTH
    REDIS_HOST = $env:REDIS_HOST
    JWT_ISS = $env:JWT_ISS
} -Port $env:PORT_AUTH

Start-Sleep -Seconds 2

# User Service
Start-MicroService -ServiceName "User Service" -ServicePath "$PSScriptRoot\services\user" -EnvVars @{
    MONGO_URI = $env:MONGO_URI_USER
    PORT = $env:PORT_USER
    REDIS_HOST = $env:REDIS_HOST
} -Port $env:PORT_USER

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "All services are starting!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Database: MongoDB Atlas (Cloud)" -ForegroundColor Cyan
Write-Host "  cluster0.ejp03r8.mongodb.net" -ForegroundColor Gray
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  Order API: http://localhost:$($env:PORT_ORDER)/docs" -ForegroundColor White
Write-Host "  Product API: http://localhost:$($env:PORT_PRODUCT)/api" -ForegroundColor White
Write-Host "  Inventory API: http://localhost:$($env:PORT_INVENTORY)/api" -ForegroundColor White
Write-Host "  Auth OIDC: http://localhost:$($env:PORT_AUTH)/.well-known/openid-configuration" -ForegroundColor White
Write-Host "  User API: http://localhost:$($env:PORT_USER)/users" -ForegroundColor White
Write-Host "  Kafka UI: http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Yellow
Write-Host "  1. Close all service PowerShell windows" -ForegroundColor Gray
Write-Host "  2. Run stop-all-services.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "To change MongoDB URI:" -ForegroundColor Yellow
Write-Host "  Edit config.env.ps1" -ForegroundColor Gray
Write-Host ""
