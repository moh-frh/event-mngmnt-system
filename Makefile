# Makefile for Event Manager App
# Provides cross-platform commands for Docker operations

.PHONY: help build up down dev logs restart rebuild clean test

# Default target
help:
	@echo "Event Manager App - Available Commands:"
	@echo ""
	@echo "Production:"
	@echo "  build     - Build Docker images"
	@echo "  up        - Start production services"
	@echo "  down      - Stop all services"
	@echo "  restart   - Restart services"
	@echo "  rebuild   - Rebuild and restart services"
	@echo ""
	@echo "Development:"
	@echo "  dev       - Start development environment with hot reload"
	@echo "  dev-down  - Stop development services"
	@echo ""
	@echo "Maintenance:"
	@echo "  logs      - View service logs"
	@echo "  clean     - Clean up Docker resources"
	@echo "  test      - Run tests in container"
	@echo ""
	@echo "Examples:"
	@echo "  make up        # Start production"
	@echo "  make dev       # Start development"
	@echo "  make logs      # View logs"

# Production commands
build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

rebuild:
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

# Development commands
dev:
	docker-compose --profile development up -d

dev-down:
	docker-compose --profile development down

# Utility commands
logs:
	docker-compose logs -f

clean:
	docker system prune -f
	docker volume prune -f

test:
	docker-compose exec event-manager npm test

# Quick start for new developers
quickstart: build up
	@echo "✅ Event Manager App is starting up!"
	@echo "🌐 Backend API: http://localhost:5000"
	@echo "🔍 Health check: http://localhost:5000/health"
	@echo "📱 Frontend: http://localhost:5000"
	@echo ""
	@echo "View logs: make logs"
	@echo "Stop services: make down"

# Development quick start
dev-quickstart: build dev
	@echo "✅ Event Manager App (Development) is starting up!"
	@echo "🌐 Backend API: http://localhost:5000"
	@echo "📱 Frontend (Dev): http://localhost:3000"
	@echo "🔍 Health check: http://localhost:5000/health"
	@echo ""
	@echo "View logs: make logs"
	@echo "Stop services: make dev-down"

# Status check
status:
	@echo "📊 Container Status:"
	docker-compose ps
	@echo ""
	@echo "💾 Volume Status:"
	docker volume ls | grep event-manager
	@echo ""
	@echo "🌐 Port Status:"
	@echo "Port 5000 (Backend): $$(netstat -an 2>/dev/null | grep :5000 | head -1 || echo 'Not listening')"
	@echo "Port 3000 (Frontend Dev): $$(netstat -an 2>/dev/null | grep :3000 | head -1 || echo 'Not listening')"
