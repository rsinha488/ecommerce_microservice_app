# Restart Docker Desktop

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Restarting Docker Desktop" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Stop Docker Desktop
Write-Host "Stopping Docker Desktop..." -ForegroundColor Yellow

$dockerProcesses = Get-Process -Name "*docker*" -ErrorAction SilentlyContinue
if ($dockerProcesses) {
    foreach ($proc in $dockerProcesses) {
        Write-Host "  Stopping $($proc.Name) (PID: $($proc.Id))..." -ForegroundColor Gray
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Done" -ForegroundColor Green
}

Write-Host ""
Write-Host "Waiting 5 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Docker Desktop
Write-Host ""
Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow

$dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if (Test-Path $dockerPath) {
    Start-Process $dockerPath
    Write-Host "Docker Desktop started" -ForegroundColor Green
} else {
    Write-Host "Docker Desktop not found. Please start it manually." -ForegroundColor Red
    exit 1
}

# Wait for Docker to be ready
Write-Host ""
Write-Host "Waiting for Docker daemon (up to 60 seconds)..." -ForegroundColor Yellow

$maxAttempts = 60
$attempt = 0
$dockerReady = $false

while ($attempt -lt $maxAttempts -and -not $dockerReady) {
    $attempt++
    
    try {
        $null = docker ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerReady = $true
        }
    } catch {
        # Not ready yet
    }
    
    if ($attempt % 5 -eq 0) {
        Write-Host "  Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
    }
    
    if (-not $dockerReady) {
        Start-Sleep -Seconds 1
    }
}

Write-Host ""
if ($dockerReady) {
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "Docker is ready!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run: .\start-all-services.ps1" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "Docker did not start properly" -ForegroundColor Red
    Write-Host "Please check Docker Desktop for errors" -ForegroundColor Yellow
    exit 1
}
