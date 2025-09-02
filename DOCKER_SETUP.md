# 🐳 Docker Setup Guide for Event Manager App

This guide explains how to use Docker to run the Event Manager App without version compatibility issues.

## 🎯 What This Solves

- **SQLITE_CANTOPEN errors** - Database issues are eliminated with proper container setup
- **Version conflicts** - Exact Node.js 18.19.0 and dependency versions are guaranteed
- **Cross-platform issues** - Works identically on Windows, Mac, and Linux
- **Dependency hell** - No more "works on my machine" problems

## 📁 New Files Created

### Core Docker Files
- **`Dockerfile`** - Multi-stage production build
- **`Dockerfile.dev`** - Development environment with hot reload
- **`docker-compose.yml`** - Production services configuration
- **`docker-compose.override.yml`** - Development overrides (auto-loaded)

### Launch Scripts
- **`start.bat`** - Windows launcher with menu interface
- **`start.sh`** - Unix launcher (Linux/Mac) with command-line interface
- **`Makefile`** - Cross-platform commands for Docker operations

### Configuration
- **`.dockerignore`** - Excludes unnecessary files from Docker build
- **Updated `package.json`** - Exact version pinning (no ^ or ~)
- **Updated `README.md`** - Comprehensive Docker documentation

## 🚀 Quick Start

### Option 1: Windows Users
```cmd
# Double-click start.bat or run from command prompt
start.bat

# Choose option 1 for production or 2 for development
```

### Option 2: Unix Users (Linux/Mac)
```bash
# Make script executable (first time only)
chmod +x start.sh

# Start production
./start.sh start

# Start development with hot reload
./start.sh dev

# View help
./start.sh help
```

### Option 3: Docker Compose Direct
```bash
# Production
docker-compose up -d

# Development with hot reload
docker-compose --profile development up -d

# Stop services
docker-compose down
```

### Option 4: Make Commands
```bash
# Quick start production
make quickstart

# Quick start development
make dev-quickstart

# View all available commands
make help
```

## 🔧 Docker Commands

### Production Environment
```bash
# Start production
npm run docker:compose:up
# or
make up

# Stop production
npm run docker:compose:down
# or
make down

# View logs
npm run docker:logs
# or
make logs
```

### Development Environment
```bash
# Start development with hot reload
npm run docker:compose:dev
# or
make dev

# Stop development
make dev-down

# View logs
make logs
```

### Maintenance
```bash
# Rebuild and restart
npm run docker:rebuild
# or
make rebuild

# Clean Docker resources
npm run docker:clean
# or
make clean

# Check status
make status
```

## 🌐 Access Points

### Production Mode
- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:5000 (served by backend)
- **Health Check**: http://localhost:5000/health

### Development Mode
- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:3000 (React dev server)
- **Health Check**: http://localhost:5000/health

## 📊 What Happens During Build

### Production Build (`Dockerfile`)
1. **Stage 1**: Install backend dependencies and copy source
2. **Stage 2**: Install frontend dependencies, build React app
3. **Stage 3**: Create production runtime with built frontend

### Development Build (`Dockerfile.dev`)
1. Install all dependencies (backend + frontend)
2. Mount source code for hot reload
3. Run both servers concurrently

## 💾 Data Persistence

### Volumes Created
- **`event_data`** - SQLite database files
- **`event_uploads`** - File uploads and media

### Data Location
- Database: `server/data/events.db` (persists across restarts)
- Uploads: `server/uploads/` (persists across restarts)

## 🔍 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Check what's using the port
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Mac/Linux

# Stop conflicting services or change ports in docker-compose.yml
```

**Permission denied:**
```bash
# On Linux/Mac, ensure proper file permissions
chmod -R 755 .
```

**Database connection issues:**
```bash
# Check container logs
docker-compose logs event-manager

# Verify database volume
docker volume ls
docker volume inspect event-manager-app_event_data
```

**Container won't start:**
```bash
# Check Docker logs
docker-compose logs

# Rebuild from scratch
make rebuild
# or
npm run docker:rebuild
```

### Debug Commands
```bash
# Check container status
make status

# View real-time logs
make logs

# Access container shell
docker-compose exec event-manager sh

# Check container resources
docker stats
```

## 🔄 Development Workflow

### With Hot Reload
1. Start development environment: `./start.sh dev`
2. Make changes to code
3. Changes automatically refresh in browser
4. Backend restarts automatically with nodemon

### Without Hot Reload
1. Start production environment: `./start.sh start`
2. Make changes to code
3. Rebuild: `make rebuild`

## 📦 Deployment

### Production Deployment
```bash
# Build and start
docker-compose up -d

# Update deployment
git pull
docker-compose down
docker-compose up -d --build
```

### Environment Variables
Create `.env` file for production:
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secret-key
```

## 🎉 Benefits of This Setup

- ✅ **No more SQLITE_CANTOPEN errors**
- ✅ **Exact version consistency across all environments**
- ✅ **Cross-platform compatibility**
- ✅ **Easy onboarding for new developers**
- ✅ **Production-ready deployment**
- ✅ **Development hot reload support**
- ✅ **Persistent data storage**
- ✅ **Health monitoring and logging**
- ✅ **Security best practices (non-root user)**

## 🆘 Getting Help

### Quick Commands
```bash
# Show all available commands
make help

# Show script help
./start.sh help

# Check Docker status
make status
```

### Logs and Debugging
```bash
# View all logs
make logs

# View specific service logs
docker-compose logs event-manager

# Access container for debugging
docker-compose exec event-manager sh
```

### Reset Everything
```bash
# Stop and remove everything
docker-compose down -v

# Clean Docker system
make clean

# Rebuild from scratch
make rebuild
```

---

**🎯 Your Event Manager App is now Docker-ready and version-conflict-free!**
