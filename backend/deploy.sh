#!/bin/bash

# Government Scheme Backend - Deployment Script
# This script automates the deployment process on Linux servers

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        print_info "Please install Docker first. See LINUX_DEPLOYMENT.md for instructions"
        exit 1
    fi
    print_success "Docker is installed"
}

# Check if Docker Compose is installed
check_docker_compose() {
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed"
        print_info "Please install Docker Compose first. See LINUX_DEPLOYMENT.md for instructions"
        exit 1
    fi
    print_success "Docker Compose is installed"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_info "Creating .env file from template..."
        cp .env.example .env
        print_error ".env file created. Please edit it with your configuration:"
        print_info "  nano .env"
        print_info "Add your GEMINI_API_KEY and other settings, then run this script again"
        exit 1
    fi
    
    # Check if GEMINI_API_KEY is set
    if ! grep -q "GEMINI_API_KEY=.*[^[:space:]]" .env; then
        print_error "GEMINI_API_KEY is not set in .env file"
        print_info "Please edit .env and add your Gemini API key"
        exit 1
    fi
    
    print_success ".env file is configured"
}

# Build Docker images
build_images() {
    print_info "Building Docker images (this may take 5-10 minutes)..."
    docker compose build --no-cache
    print_success "Docker images built successfully"
}

# Start services
start_services() {
    print_info "Starting services..."
    docker compose up -d
    print_success "Services started"
}

# Wait for database
wait_for_db() {
    print_info "Waiting for database to be ready..."
    sleep 15
    
    # Check if database is ready
    if docker compose exec -T db pg_isready -U postgres &> /dev/null; then
        print_success "Database is ready"
    else
        print_error "Database is not ready. Check logs with: docker compose logs db"
        exit 1
    fi
}

# Run migrations
run_migrations() {
    print_info "Running database migrations..."
    docker compose exec -T api npm run migrate:deploy
    print_success "Migrations completed"
}

# Seed sample data
seed_data() {
    read -p "Do you want to seed sample data? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Seeding sample data..."
        docker compose exec -T api npm run seed:sample
        print_success "Sample data seeded"
    fi
}

# Check deployment
check_deployment() {
    print_info "Checking deployment..."
    
    # Check if API is responding
    sleep 5
    if curl -s http://localhost:8000/health > /dev/null; then
        print_success "API is responding"
        echo
        print_success "Deployment completed successfully!"
        echo
        print_info "Access your API at: http://localhost:8000"
        print_info "Health check: http://localhost:8000/health"
        echo
        print_info "Useful commands:"
        echo "  View logs:        docker compose logs -f api"
        echo "  Stop services:    docker compose down"
        echo "  Restart services: docker compose restart"
        echo "  View status:      docker compose ps"
    else
        print_error "API is not responding"
        print_info "Check logs with: docker compose logs api"
        exit 1
    fi
}

# Main deployment flow
main() {
    echo "=========================================="
    echo "  Government Scheme Backend Deployment"
    echo "=========================================="
    echo

    check_docker
    check_docker_compose
    check_env_file
    
    echo
    read -p "Ready to deploy? This will build and start all services. Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi
    
    echo
    build_images
    start_services
    wait_for_db
    run_migrations
    seed_data
    check_deployment
}

# Run main function
main

