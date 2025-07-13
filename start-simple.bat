@echo off
title EuroMillions App

echo.
echo ==========================================
echo   Starting EuroMillions App...
echo ==========================================
echo.
echo Opening at: http://localhost:5000
echo Press Ctrl+C to stop the app
echo.

:: Set environment and start directly
set NODE_ENV=development
npx tsx server/index.ts