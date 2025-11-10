#!/bin/bash

# ============================================
# E-Commerce Microservices Stop Script
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo ""
log_warning "=========================================="
log_warning "  Stopping E-Commerce Platform"
log_warning "=========================================="
echo ""

# Parse command line arguments
REMOVE_VOLUMES=false
CLEAN_ALL=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -v|--volumes) REMOVE_VOLUMES=true ;;
        -c|--clean) CLEAN_ALL=true ;;
        -h|--help)
            echo "Usage: ./stop-enhanced.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -v, --volumes    Remove volumes (deletes all data)"
            echo "  -c, --clean      Complete cleanup (removes images too)"
            echo "  -h, --help       Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./stop-enhanced.sh              # Stop services only"
            echo "  ./stop-enhanced.sh -v           # Stop and remove data volumes"
            echo "  ./stop-enhanced.sh -c           # Complete cleanup"
            exit 0
            ;;
        *)
            log_warning "Unknown parameter: $1"
            exit 1
            ;;
    esac
    shift
done

# Stop services
log_info "Stopping all running containers..."
docker-compose down 2>/dev/null || true
log_success "Containers stopped"

# Remove volumes if requested
if [ "$REMOVE_VOLUMES" = true ]; then
    log_warning "Removing volumes (this will delete all data)..."
    docker-compose down --volumes --remove-orphans
    log_success "Volumes removed"
fi

# Complete cleanup if requested
if [ "$CLEAN_ALL" = true ]; then
    log_warning "Performing complete cleanup..."
    docker-compose down --volumes --remove-orphans --rmi all
    docker system prune -af --volumes
    log_success "Complete cleanup done"
fi

echo ""
log_success "=========================================="
log_success "  E-Commerce Platform Stopped"
log_success "=========================================="
echo ""

# Show status
log_info "Current Docker status:"
docker-compose ps

echo ""
log_info "To restart the platform, run:"
echo "  ./start-enhanced.sh"
echo ""
