@echo off
echo EuroMillions App - Windows Setup
echo ================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found. Installing dependencies...
npm install

if errorlevel 1 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Creating .env file from template...
if not exist ".env" (
    copy ".env.example" ".env"
    echo .env file created successfully!
    echo.
    echo IMPORTANT: Please edit .env file and update DATABASE_URL with your PostgreSQL credentials
    echo Example: DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/euromillions
) else (
    echo .env file already exists, skipping...
)

echo.

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
echo Setup complete! You can now run start.bat to launch the application.
echo Don't forget to configure your database connection in the .env file.
pause