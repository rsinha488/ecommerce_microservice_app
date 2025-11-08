#!/bin/bash
# Start Next.js Client Application
# Linux/Mac Bash Script

echo "======================================"
echo "  Starting Next.js Client App"
echo "======================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

echo "Starting development server..."
echo "Client will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the development server
npm run dev

