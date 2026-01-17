#!/bin/bash

# Shambit Hotel Booking Platform - Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
PROJECT_NAME="shambit-hotel-portal"

echo -e "${BLUE}🚀 Starting deployment for ${PROJECT_NAME} in ${ENVIRONMENT} environment${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Docker is running"

# Check if environment file exists
if [ ! -f ".env.${ENVIRONMENT}" ]; then
    print_warning "Environment file .env.${ENVIRONMENT} not found. Using .env.example"
    if [ -f ".env.example" ]; then
        cp .env.example .env.${ENVIRONMENT}
    else
        print_error "No environment file found. Please create .env.${ENVIRONMENT}"
        exit 1
    fi
fi

# Load environment variables
export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)

print_status "Environment variables loaded"

# Build and deploy based on environment
case $ENVIRONMENT in
    "development")
        echo -e "${BLUE}🔧 Building for development...${NC}"
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
        ;;
    "staging")
        echo -e "${BLUE}🔧 Building for staging...${NC}"
        docker-compose -f docker-compose.yml -f docker-compose.staging.yml up --build -d
        ;;
    "production")
        echo -e "${BLUE}🔧 Building for production...${NC}"
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
        ;;
    *)
        print_error "Unknown environment: $ENVIRONMENT"
        echo "Usage: $0 [development|staging|production]"
        exit 1
        ;;
esac

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to be healthy...${NC}"
sleep 30

# Check service health
check_service_health() {
    local service=$1
    local url=$2
    
    if curl -f -s "$url" > /dev/null; then
        print_status "$service is healthy"
        return 0
    else
        print_error "$service is not responding"
        return 1
    fi
}

# Health checks
BACKEND_URL="http://localhost:3002/health"
FRONTEND_URL="http://localhost:3000"

if check_service_health "Backend" "$BACKEND_URL" && check_service_health "Frontend" "$FRONTEND_URL"; then
    print_status "All services are healthy!"
    
    echo -e "${GREEN}"
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📱 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:3002/api/v1"
    echo "🏥 Health Check: http://localhost:3002/health"
    echo ""
    echo "📊 View logs: docker-compose logs -f"
    echo "🛑 Stop services: docker-compose down"
    echo -e "${NC}"
else
    print_error "Some services are not healthy. Check logs with: docker-compose logs"
    exit 1
fi