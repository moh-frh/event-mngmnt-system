#!/bin/bash

# Event Manager App - Unix Launcher
# Provides easy Docker commands for Linux and Mac users

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running or not installed!"
        echo "Please start Docker and try again."
        exit 1
    fi
    print_status "Docker is running"
}

# Function to start production
start_production() {
    print_info "Starting production environment..."
    docker-compose up -d
    if [ $? -eq 0 ]; then
        print_status "Production environment started successfully!"
        echo
        echo "🌐 Backend API: http://localhost:5000"
        echo "📱 Frontend: http://localhost:5000"
        echo "🔍 Health check: http://localhost:5000/health"
        echo
        echo "To view logs: make logs or docker-compose logs -f"
        echo "To stop: make down or docker-compose down"
    else
        print_error "Failed to start production environment"
    fi
}

# Function to start development
start_development() {
    print_info "Starting development environment..."
    docker-compose --profile development up -d
    if [ $? -eq 0 ]; then
        print_status "Development environment started successfully!"
        echo
        echo "🌐 Backend API: http://localhost:5000"
        echo "📱 Frontend (Dev): http://localhost:3000"
        echo "🔍 Health check: http://localhost:5000/health"
        echo
        echo "Hot reload is enabled - changes will auto-refresh!"
        echo "To view logs: make logs or docker-compose logs -f"
        echo "To stop: make dev-down or docker-compose --profile development down"
    else
        print_error "Failed to start development environment"
    fi
}

# Function to stop services
stop_services() {
    print_info "Stopping all services..."
    docker-compose down
    if [ $? -eq 0 ]; then
        print_status "All services stopped successfully!"
    else
        print_error "Failed to stop services"
    fi
}

# Function to view logs
view_logs() {
    print_info "Viewing logs (Press Ctrl+C to exit)..."
    docker-compose logs -f
}

# Function to rebuild services
rebuild_services() {
    print_info "Rebuilding and restarting services..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    if [ $? -eq 0 ]; then
        print_status "Services rebuilt and restarted successfully!"
    else
        print_error "Failed to rebuild services"
    fi
}

# Function to clean Docker resources
clean_docker() {
    print_info "Cleaning Docker resources..."
    docker system prune -f
    docker volume prune -f
    print_status "Docker resources cleaned!"
}

# Function to show status
show_status() {
    print_info "Container Status:"
    docker-compose ps
    echo
    print_info "Volume Status:"
    docker volume ls | grep event-manager || echo "No event-manager volumes found"
    echo
    print_info "Port Status:"
    if command -v netstat >/dev/null 2>&1; then
        echo "Port 5000 (Backend): $(netstat -an 2>/dev/null | grep :5000 | head -1 || echo 'Not listening')"
        echo "Port 3000 (Frontend Dev): $(netstat -an 2>/dev/null | grep :3000 | head -1 || echo 'Not listening')"
    elif command -v lsof >/dev/null 2>&1; then
        echo "Port 5000 (Backend): $(lsof -i :5000 2>/dev/null | head -1 || echo 'Not listening')"
        echo "Port 3000 (Frontend Dev): $(lsof -i :3000 2>/dev/null | head -1 || echo 'Not listening')"
    else
        echo "Port status check not available (install netstat or lsof)"
    fi
}

# Function to show help
show_help() {
    echo "Event Manager App - Available Commands:"
    echo
    echo "Production:"
    echo "  start     - Start production environment"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart services"
    echo "  rebuild   - Rebuild and restart services"
    echo
    echo "Development:"
    echo "  dev       - Start development environment with hot reload"
    echo "  dev-stop  - Stop development services"
    echo
    echo "Maintenance:"
    echo "  logs      - View service logs"
    echo "  clean     - Clean up Docker resources"
    echo "  status    - Show service status"
    echo "  help      - Show this help message"
    echo
    echo "Examples:"
    echo "  ./start.sh start     # Start production"
    echo "  ./start.sh dev       # Start development"
    echo "  ./start.sh logs      # View logs"
}

# Main script logic
main() {
    echo "========================================"
    echo "Event Manager App - Unix Launcher"
    echo "========================================"
    echo

    # Check Docker first
    check_docker

    # Parse command line arguments
    case "${1:-}" in
        "start"|"production")
            start_production
            ;;
        "dev"|"development")
            start_development
            ;;
        "stop"|"down")
            stop_services
            ;;
        "dev-stop"|"dev-down")
            docker-compose --profile development down
            print_status "Development services stopped"
            ;;
        "logs")
            view_logs
            ;;
        "rebuild")
            rebuild_services
            ;;
        "clean")
            clean_docker
            ;;
        "status")
            show_status
            ;;
        "help"|"-h"|"--help"|"")
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Use './start.sh help' for available commands"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
