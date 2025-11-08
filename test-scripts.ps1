# Test All Scripts for Syntax Errors
# Usage: .\test-scripts.ps1

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Testing All PowerShell Scripts" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$scripts = @(
    "config.env.ps1",
    "start-all-services.ps1",
    "stop-all-services.ps1",
    "restart-docker.ps1",
    "check-docker.ps1",
    "check-services-status.ps1"
)

$errors = 0

foreach ($script in $scripts) {
    if (Test-Path $script) {
        Write-Host "Testing $script..." -ForegroundColor Yellow
        
        try {
            $null = [System.Management.Automation.PSParser]::Tokenize((Get-Content $script -Raw), [ref]$null)
            Write-Host "  OK" -ForegroundColor Green
        } catch {
            Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
            $errors++
        }
    } else {
        Write-Host "  MISSING: $script" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan

if ($errors -eq 0) {
    Write-Host "All scripts passed syntax check!" -ForegroundColor Green
} else {
    Write-Host "Found $errors error(s)" -ForegroundColor Red
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

