@echo off
echo EuroMillions Analysis App - Local Setup
echo ==========================================

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

:: Check if .env exists
if not exist .env (
    echo WARNING: .env file not found
    echo Please create .env file with your DATABASE_URL
    echo Example:
    echo DATABASE_URL=postgresql://username:password@localhost:5432/euromillions
    echo NODE_ENV=development
    echo.
    echo For cloud database ^(recommended^), sign up at https://neon.tech
    pause
    exit /b 1
)

:: Install dependencies
echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

:: Setup database schema
echo Setting up database schema...
call npm run db:push
if errorlevel 1 (
    echo ERROR: Failed to setup database schema
    echo Check your DATABASE_URL in .env file
    pause
    exit /b 1
)

:: Test the setup
echo Testing setup...
node test-local.js
if errorlevel 1 (
    echo WARNING: Some tests failed, but continuing...
)

echo.
echo ==========================================
echo Setup complete! Starting the application...
echo.
echo Application will be available at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo ==========================================
echo.

:: Start the application
call npm run dev