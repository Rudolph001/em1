# EuroMillions App - Windows Setup Guide

## Quick Setup (Windows)

### 1. Prerequisites
- **Node.js 18+** installed from [nodejs.org](https://nodejs.org)
- **Git** (optional, for cloning)

### 2. Database Setup
You need a PostgreSQL database. **Recommended**: Use [Neon](https://neon.tech) (free cloud database).

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new database
3. Copy the connection string

### 3. Environment Setup
Create a `.env` file in the project root:
```
DATABASE_URL=postgresql://username:password@host:5432/database_name
NODE_ENV=development
```

### 4. Installation & Setup

#### Option A: One-Click Setup (Recommended)
```cmd
run-local.bat
```

#### Option B: Manual Setup
```cmd
npm install
npm run db:push
set NODE_ENV=development
npx tsx server/index.ts
```

### 5. Testing Setup
Open a **new terminal** and run:
```cmd
node test-local.js
```

### 6. Access the Application
Open your browser: [http://localhost:5000](http://localhost:5000)

## Troubleshooting

### Issue: "NODE_ENV is not recognized"
**Solution**: Use the Windows-compatible command:
```cmd
set NODE_ENV=development && npx tsx server/index.ts
```

### Issue: API Tests Fail
**Cause**: Server isn't running yet
**Solution**: 
1. Start the server first: `run-local.bat`
2. In another terminal, run: `node test-local.js`

### Issue: Database Connection Error
**Solution**: 
1. Check your `.env` file has correct `DATABASE_URL`
2. Test connection at [neon.tech](https://neon.tech) dashboard
3. Run: `npm run db:push`

### Issue: Empty Database
**Solution**: Visit [http://localhost:5000/api/initialize](http://localhost:5000/api/initialize) to load data

### Issue: Port 5000 Already in Use
**Solution**: Kill existing processes:
```cmd
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

## Expected Results

✅ **Server Output:**
```
Connected to PostgreSQL database
serving on localhost:5000
```

✅ **Test Results:**
```
✅ Passed: 7
❌ Failed: 0
🎉 All tests passed!
```

✅ **Browser:**
- Current jackpot: €97,000,000
- Countdown timer updating every second
- 51 historical draws loaded
- All analytics working

## Support

If you encounter issues:
1. Check the terminal output for error messages
2. Ensure Node.js 18+ is installed: `node --version`
3. Verify database connection in `.env` file
4. Run `npm run db:push` to ensure schema is deployed

## Next Steps

Once setup is complete:
- Visit [http://localhost:5000](http://localhost:5000)
- All features work identically to the Replit version
- Historical data, predictions, and analytics are fully functional