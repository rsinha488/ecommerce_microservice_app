# Check if Docker Desktop is Running
# Usage: .\check-docker.ps1

Write-Host "Checking Docker Desktop status..." -ForegroundColor Cyan
Write-Host ""

$maxAttempts = 30
$attempt = 0
$dockerReady = $false

while ($attempt -lt $maxAttempts -and -not $dockerReady) {
    $attempt++
    
    try {
        $null = docker ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerReady = $true
            Write-Host "✓ Docker Desktop is running and ready!" -ForegroundColor Green
            Write-Host ""
            
            # Show Docker info
            Write-Host "Docker Information:" -ForegroundColor Cyan
            docker version --format "  Docker Version: {{.Server.Version}}"
            Write-Host ""
            
            # Show running containers
            Write-Host "Running Containers:" -ForegroundColor Cyan
            $containers = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
            if ($containers) {
                docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
            } else {
                Write-Host "  No containers running" -ForegroundColor Gray
            }
            
            Write-Host ""
            Write-Host "✓ You can now run: .\start-all-services.ps1" -ForegroundColor Green
            exit 0
        }
    } catch {
        # Docker not ready yet
    }
    
    if ($attempt -eq 1) {
        Write-Host "Docker Desktop is not running or still starting up..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please ensure Docker Desktop is running:" -ForegroundColor Yellow
        Write-Host "  1. Press Windows Key and search for 'Docker Desktop'" -ForegroundColor Gray
        Write-Host "  2. Click to open it" -ForegroundColor Gray
        Write-Host "  3. Wait for the Docker icon in system tray to turn green" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Waiting for Docker to start... (attempt $attempt of $maxAttempts)" -ForegroundColor Yellow
    } else {
        Write-Host "Still waiting... (attempt $attempt of $maxAttempts)" -ForegroundColor Gray
    }
    
    Start-Sleep -Seconds 2
}

if (-not $dockerReady) {
    Write-Host ""
    Write-Host "✗ Docker Desktop is not running after $maxAttempts attempts." -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting Steps:" -ForegroundColor Yellow
    Write-Host "  1. Open Docker Desktop manually" -ForegroundColor White
    Write-Host "  2. Check if you see any error messages" -ForegroundColor White
    Write-Host "  3. Try restarting Docker Desktop" -ForegroundColor White
    Write-Host "  4. Check if Hyper-V/WSL2 is enabled (required for Docker)" -ForegroundColor White
    Write-Host "  5. Restart your computer if needed" -ForegroundColor White
    Write-Host ""
    Write-Host "Common Issues:" -ForegroundColor Yellow
    Write-Host "  • WSL2 not installed: Run 'wsl --install' in PowerShell as Admin" -ForegroundColor Gray
    Write-Host "  • Virtualization disabled: Enable in BIOS settings" -ForegroundColor Gray
    Write-Host "  • Docker not installed: Download from https://www.docker.com/products/docker-desktop" -ForegroundColor Gray
    Write-Host ""
    exit 1
}


