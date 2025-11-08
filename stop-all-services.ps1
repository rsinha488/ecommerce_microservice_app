# PowerShell Script to Stop All E-commerce Microservices

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Stopping E-commerce Microservices" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Stop Docker containers
Write-Host "Stopping infrastructure services..." -ForegroundColor Yellow
Push-Location services/inventory
docker-compose down
Pop-Location

Write-Host "Infrastructure services stopped" -ForegroundColor Green
Write-Host ""

# Stop Node processes on specific ports
$ports = @(3001, 3002, 3003, 4000, 5003)

Write-Host "Checking for services running on ports..." -ForegroundColor Yellow

foreach ($port in $ports) {
    $connections = netstat -ano | Select-String ":$port " | Select-String "LISTENING"
    
    if ($connections) {
        foreach ($connection in $connections) {
            $parts = $connection -split '\s+' | Where-Object { $_ -ne '' }
            $processId = $parts[-1]
            
            if ($processId -match '^\d+$') {
                try {
                    $process = Get-Process -Id $processId -ErrorAction Stop
                    Write-Host "  Stopping process on port $port (PID: $processId)" -ForegroundColor Gray
                    Stop-Process -Id $processId -Force -ErrorAction Stop
                    Write-Host "  Process stopped" -ForegroundColor Green
                } catch {
                    Write-Host "  Could not stop process $processId" -ForegroundColor Red
                }
            }
        }
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "All services stopped!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
