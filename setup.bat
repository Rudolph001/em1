
@echo off
echo EuroMillions App - Initial Setup
echo ================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Install dependencies
echo Installing dependencies...
npm install
if errorlevel 1 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file from template...
    copy ".env.example" ".env"
    echo.
    echo IMPORTANT: Please edit .env file and configure your DATABASE_URL
    echo Example: DATABASE_URL=postgresql://username:password@localhost:5432/euromillions
    echo.
)

REM Check if user wants to setup database
echo.
set /p setup_db="Do you want to push the database schema now? (y/n): "
if /i "%setup_db%"=="y" (
    echo Pushing database schema...
    npm run db:push
    if errorlevel 1 (
        echo Error: Failed to push database schema
        echo Please check your DATABASE_URL configuration
        pause
        exit /b 1
    )
    echo Database schema setup complete!
)

echo.
echo Setup complete! 
echo.
echo Next steps:
echo 1. Make sure PostgreSQL is running
echo 2. Edit .env file with your database credentials
echo 3. Run 'npm run db:push' to setup database schema
echo 4. Run 'start.bat' or 'npm run dev' to start the app
echo.
pause
