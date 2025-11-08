# Start Next.js Client Application
# Windows PowerShell Script

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Starting Next.js Client App" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

Write-Host "Starting development server..." -ForegroundColor Green
Write-Host "Client will be available at: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the development server
npm run dev

