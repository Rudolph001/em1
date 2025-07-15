@echo off
echo.
echo 🧪 EuroMillions App - Windows Test Script
echo ==========================================
echo.

:: Check if server is running
echo Checking if server is running...
timeout /t 2 >nul

:: Wait for server to be ready
echo Waiting for server to start...
timeout /t 5 >nul

:: Run the test script
echo Running API tests...
node test-local.js

:: Check if initialization is needed
echo.
echo Checking data initialization...
curl -s http://localhost:5000/api/initialize >nul 2>&1
if not errorlevel 1 (
    echo ✅ Data initialization complete
) else (
    echo ⚠️  Could not reach server. Make sure it's running first.
)

echo.
echo ==========================================
echo Test complete! Check results above.
echo.
pause