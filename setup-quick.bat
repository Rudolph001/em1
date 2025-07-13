@echo off
echo ========================================
echo EuroMillions App - Quick Setup
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is required but not installed!
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org/
    echo 2. Download the LTS version
    echo 3. Run the installer
    echo 4. Restart this script
    echo.
    pause
    exit /b 1
)

echo ✓ Node.js detected:
node --version
echo.

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
) else (
    echo ✓ Dependencies already installed
    echo.
)

:: Create .env file with SQLite configuration
echo Creating local configuration...
echo NODE_ENV=development > .env
echo DATABASE_URL=file:./euromillions.db >> .env
echo.
echo ✓ Configuration created

:: Set up database
echo Setting up database...
npx drizzle-kit push --config=drizzle.config.local.ts
echo.

:: Start the app
echo ========================================
echo Starting EuroMillions App...
echo ========================================
echo.
echo ► Open your browser to: http://localhost:5000
echo ► Press Ctrl+C to stop the app
echo.

:: Start with proper Windows environment variables
set NODE_ENV=development
node start-local.js