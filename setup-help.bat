@echo off
echo.
echo 🆘 EuroMillions Local Setup - Help & Troubleshooting
echo ================================================
echo.
echo 📋 Common Issues and Solutions:
echo.
echo 1. "NODE_ENV is not recognized"
echo    Solution: This is fixed in the latest run-local.bat
echo    Manual fix: Use "set NODE_ENV=development"
echo.
echo 2. API tests fail with 500 errors
echo    Solution: Run diagnostics to identify the issue
echo    Command: node diagnose-local.js
echo.
echo 3. Database connection issues
echo    Solution: Check your .env file
echo    Example: DATABASE_URL=postgresql://user:pass@host:5432/db
echo.
echo 4. No historical data shows
echo    Solution: Visit http://localhost:5000/api/initialize
echo    Or restart the server after fixing database connection
echo.
echo 5. Port 5000 already in use
echo    Solution: Find and kill the process
echo    Command: netstat -ano | findstr :5000
echo    Command: taskkill /PID [PID_NUMBER] /F
echo.
echo 🛠️  Diagnostic Tools:
echo.
echo   node diagnose-local.js    - Comprehensive database diagnostics
echo   node test-local.js        - API endpoint testing
echo   test-windows.bat          - Windows-specific testing
echo.
echo 📁 Important Files:
echo.
echo   .env                      - Database configuration
echo   run-local.bat             - Main setup script
echo   WINDOWS_SETUP_GUIDE.md    - Detailed setup instructions
echo   SETUP-INSTRUCTIONS.md     - Cross-platform setup guide
echo.
echo 🔧 Manual Setup Steps:
echo.
echo   1. npm install
echo   2. npm run db:push
echo   3. set NODE_ENV=development
echo   4. npx tsx server/index.ts
echo   5. Open new terminal: node test-local.js
echo.
echo 💡 Need Help?
echo    Check WINDOWS_SETUP_GUIDE.md for detailed instructions
echo    Or run "node diagnose-local.js" for automated diagnostics
echo.
pause