@echo off
title EuroMillions App

echo.
echo ==========================================
echo   EuroMillions Analysis App
echo ==========================================
echo.

:: Check if we're in the right directory
if not exist "package.json" (
    echo Error: Please run this from the app directory
    pause
    exit /b 1
)

:: Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Create .env if it doesn't exist
if not exist ".env" (
    echo Creating configuration file...
    echo NODE_ENV=development > .env
    echo DATABASE_URL=postgresql://localhost:5432/euromillions >> .env
    echo.
    echo Created .env file - please update DATABASE_URL with your database connection
    echo.
)

echo Starting server at: http://localhost:5000
echo Press Ctrl+C to stop
echo.

:: Use npm script to avoid tsx path issues
npm run dev