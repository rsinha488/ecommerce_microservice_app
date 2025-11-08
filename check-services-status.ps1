# Check Status of All Services

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Service Status Checker" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check Infrastructure
Write-Host "Infrastructure Services (Docker):" -ForegroundColor Yellow
Write-Host ""

$containers = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-Object -Skip 1
if ($containers) {
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    Write-Host ""
    Write-Host "Infrastructure: OK" -ForegroundColor Green
} else {
    Write-Host "No Docker containers running" -ForegroundColor Red
    Write-Host "Run: .\start-all-services.ps1" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Microservices:" -ForegroundColor Yellow
Write-Host ""

# Function to check a port
function Test-Port {
    param([int]$Port, [string]$ServiceName)
    
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    try {
        $tcpClient.Connect("localhost", $Port)
        $tcpClient.Close()
        Write-Host "[OK]  $ServiceName on port $Port" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[--]  $ServiceName on port $Port (not ready)" -ForegroundColor Gray
        return $false
    }
}

# Check all microservices
$services = @(
    @{Name="User Service"; Port=3001},
    @{Name="Product Service"; Port=3002},
    @{Name="Inventory Service"; Port=3003},
    @{Name="Auth Service"; Port=4000},
    @{Name="Order Service"; Port=5003}
)

$runningCount = 0
foreach ($svc in $services) {
    if (Test-Port -Port $svc.Port -ServiceName $svc.Name) {
        $runningCount++
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Summary: $runningCount / 5 services running" -ForegroundColor $(if ($runningCount -eq 5) { "Green" } else { "Yellow" })
Write-Host ""

if ($runningCount -lt 5) {
    Write-Host "Troubleshooting Tips:" -ForegroundColor Yellow
    Write-Host "  1. Check the PowerShell windows for error messages" -ForegroundColor White
    Write-Host "  2. Services can take 1-2 minutes to start" -ForegroundColor White
    Write-Host "  3. Look for 'Nest application successfully started'" -ForegroundColor White
    Write-Host "  4. Common issues:" -ForegroundColor White
    Write-Host "     - Missing dependencies (run: npm install in service folder)" -ForegroundColor Gray
    Write-Host "     - MongoDB not ready (wait 30 seconds and check again)" -ForegroundColor Gray
    Write-Host "     - Port already in use" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Run this script again in 30 seconds: .\check-services-status.ps1" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Access Points (when ready):" -ForegroundColor Cyan
Write-Host "  Order API: http://localhost:5003/docs" -ForegroundColor White
Write-Host "  Product API: http://localhost:3002/api" -ForegroundColor White
Write-Host "  Inventory API: http://localhost:3003/api" -ForegroundColor White
Write-Host "  Auth OIDC: http://localhost:4000/.well-known/openid-configuration" -ForegroundColor White
Write-Host "  User API: http://localhost:3001/users" -ForegroundColor White
Write-Host "  Kafka UI: http://localhost:8080" -ForegroundColor White
Write-Host ""

