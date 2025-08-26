@echo off
echo Starting Event Manager Application...
echo.

echo Installing dependencies...
call npm run install-all

echo.
echo Starting the application...
call npm run dev-full

pause

