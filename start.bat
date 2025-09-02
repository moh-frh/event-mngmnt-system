@echo off
echo ========================================
echo Event Manager App - Windows Launcher
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running or not installed!
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

:menu
echo Choose an option:
echo 1. Start Production (Docker)
echo 2. Start Development (Docker with hot reload)
echo 3. Stop All Services
echo 4. View Logs
echo 5. Rebuild and Restart
echo 6. Clean Docker Resources
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto production
if "%choice%"=="2" goto development
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto logs
if "%choice%"=="5" goto rebuild
if "%choice%"=="6" goto clean
if "%choice%"=="7" goto exit
echo Invalid choice. Please try again.
echo.
goto menu

:production
echo.
echo 🚀 Starting production environment...
docker-compose up -d
if %errorlevel% equ 0 (
    echo.
    echo ✅ Production environment started successfully!
    echo 🌐 Backend API: http://localhost:5000
    echo 📱 Frontend: http://localhost:5000
    echo 🔍 Health check: http://localhost:5000/health
    echo.
    echo To view logs: docker-compose logs -f
    echo To stop: docker-compose down
) else (
    echo ❌ Failed to start production environment
)
echo.
pause
goto menu

:development
echo.
echo 🔧 Starting development environment...
docker-compose --profile development up -d
if %errorlevel% equ 0 (
    echo.
    echo ✅ Development environment started successfully!
    echo 🌐 Backend API: http://localhost:5000
    echo 📱 Frontend (Dev): http://localhost:3000
    echo 🔍 Health check: http://localhost:5000/health
    echo.
    echo Hot reload is enabled - changes will auto-refresh!
    echo To view logs: docker-compose logs -f
    echo To stop: docker-compose --profile development down
) else (
    echo ❌ Failed to start development environment
)
echo.
pause
goto menu

:stop
echo.
echo 🛑 Stopping all services...
docker-compose down
if %errorlevel% equ 0 (
    echo ✅ All services stopped successfully!
) else (
    echo ❌ Failed to stop services
)
echo.
pause
goto menu

:logs
echo.
echo 📋 Viewing logs (Press Ctrl+C to exit)...
docker-compose logs -f
echo.
pause
goto menu

:rebuild
echo.
echo 🔄 Rebuilding and restarting services...
docker-compose down
docker-compose build --no-cache
docker-compose up -d
if %errorlevel% equ 0 (
    echo ✅ Services rebuilt and restarted successfully!
) else (
    echo ❌ Failed to rebuild services
)
echo.
pause
goto menu

:clean
echo.
echo 🧹 Cleaning Docker resources...
docker system prune -f
docker volume prune -f
echo ✅ Docker resources cleaned!
echo.
pause
goto menu

:exit
echo.
echo 👋 Goodbye! Event Manager App launcher closed.
echo.
pause
exit /b 0

