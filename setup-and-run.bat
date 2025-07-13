@echo off
echo ========================================
echo EuroMillions App - Local Setup & Run
echo ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from: https://nodejs.org/
    echo After installation, run this script again.
    pause
    exit /b 1
)

:: Display Node.js version
echo Node.js version:
node --version
echo.

:: Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this script from the EuroMillions app root directory.
    pause
    exit /b 1
)

:: Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    echo # EuroMillions App Environment Variables > .env
    echo # Generated automatically by setup-and-run.bat >> .env
    echo. >> .env
    echo NODE_ENV=development >> .env
    echo. >> .env
    echo # Database Configuration >> .env
    echo # For local development, you can use SQLite or PostgreSQL >> .env
    echo # SQLite (simpler, no setup required): >> .env
    echo DATABASE_URL=file:./local.db >> .env
    echo. >> .env
    echo # PostgreSQL (if you prefer): >> .env
    echo # DATABASE_URL=postgresql://username:password@localhost:5432/euromillions >> .env
    echo. >> .env
    echo # Optional: API Keys (leave empty for demo mode) >> .env
    echo # OPENAI_API_KEY=your_openai_key_here >> .env
    echo.
    echo ✓ Created .env file with default settings
) else (
    echo ✓ .env file already exists
)

:: Install dependencies
echo.
echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

:: Check if we need to set up the database
echo.
echo Setting up database...
npm run db:push
if %errorlevel% neq 0 (
    echo Warning: Database setup may have failed, but continuing...
)

:: Start the application
echo.
echo ========================================
echo Starting EuroMillions App...
echo ========================================
echo.
echo The app will be available at: http://localhost:5000
echo Press Ctrl+C to stop the application
echo.

:: Use the Node.js startup script for better Windows compatibility
node start-local.js