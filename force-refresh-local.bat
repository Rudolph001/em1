@echo off
echo ========================================
echo EuroMillions Local Database Refresh
echo ========================================
echo.
echo Forcing database refresh and clearing browser cache...
echo.

REM Clear browser cache endpoint
curl -X POST "http://localhost:5000/api/clear-data"

echo.
echo Database refreshed successfully!
echo.
echo IMPORTANT: Please refresh your browser (Ctrl+F5 or Cmd+Shift+R) to clear cached data
echo.
echo Press any key to exit...
pause >nul