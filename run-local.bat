@echo off
echo EuroMillions Analysis App - Local Setup ^(JSON Storage^)
echo ========================================================

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

:: Check if package.json exists
if not exist package.json (
    echo ERROR: package.json not found
    echo Make sure you're in the correct directory
    pause
    exit /b 1
)

:: Check if .env exists (now optional with JSON storage)
if not exist .env (
    echo Creating .env file for JSON storage mode...
    echo NODE_ENV=development > .env
    echo STORAGE_TYPE=json >> .env
    echo.
    echo Using JSON file storage mode ^(no database required^)
)

:: Install dependencies
echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

:: Create data directory for JSON storage
echo Setting up JSON storage...
if not exist "data" mkdir data
echo JSON storage directory created
echo No database setup required - using JSON files

:: Note: API tests will run after server starts
echo API tests will be available after the server starts
echo You can run "node test-local.js" in another terminal to test the API
echo Or run "node diagnose-local.js" for detailed diagnostics

echo.
echo ==========================================
echo Setup complete! Starting the application...
echo.
echo Application will be available at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo ==========================================
echo.

:: Start the application with Windows-compatible environment variable
set NODE_ENV=development
call npx tsx server/index.ts