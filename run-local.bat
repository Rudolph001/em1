@echo off
title EuroMillions App - Local Setup

echo.
echo ==========================================
echo   EuroMillions Analysis App - Local Setup
echo ==========================================
echo.

:: Check Node.js
echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found!
    echo.
    echo Please install Node.js first:
    echo   1. Visit: https://nodejs.org/
    echo   2. Download LTS version
    echo   3. Run installer
    echo   4. Restart this script
    echo.
    pause
    exit /b 1
)
echo ✅ Node.js found: 
node --version
echo.

:: Install dependencies
echo [2/4] Installing dependencies...
if not exist "node_modules" (
    npm install --silent
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)
echo.

:: Create environment file
echo [3/4] Setting up configuration...
if not exist ".env" (
    echo # EuroMillions App - Local Development > .env
    echo NODE_ENV=development >> .env
    echo. >> .env
    echo # Database - Use PostgreSQL connection string >> .env
    echo # Example: postgresql://user:password@localhost:5432/euromillions >> .env
    echo # For cloud database, get connection string from your provider >> .env
    echo DATABASE_URL=postgresql://localhost:5432/euromillions >> .env
    echo. >> .env
    echo # Optional API keys >> .env
    echo # OPENAI_API_KEY=your_key_here >> .env
    echo.
    echo ✅ Created .env file
    echo.
    echo ⚠️  IMPORTANT: You need to set up PostgreSQL database
    echo    Please update DATABASE_URL in .env file with your database connection
    echo.
) else (
    echo ✅ Configuration file exists
)
echo.

:: Start the application
echo [4/4] Starting EuroMillions App...
echo.
echo ==========================================
echo   App starting at: http://localhost:5000
echo   Press Ctrl+C to stop
echo ==========================================
echo.

set NODE_ENV=development
node start-local.js