# Quick Local Setup Instructions

## For Windows Users

### Option 1: One-Click Setup (Recommended)
```batch
run-local.bat
```
This will automatically:
- Check Node.js installation
- Install dependencies
- Setup database
- Run tests
- Start the application

### Option 2: Manual Setup
```batch
npm install
npm run db:push
npm run dev
```

## For Mac/Linux Users

### Setup Commands
```bash
# Install dependencies
npm install

# Setup database schema
npm run db:push

# Test the setup
node test-local.js

# Start application
npm run dev
```

## Database Setup Options

### Option A: Neon Database (Recommended - Free)
1. Visit https://neon.tech
2. Create free account
3. Create new project
4. Copy connection string
5. Add to `.env` file:
```
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
NODE_ENV=development
```

### Option B: Local PostgreSQL
1. Install PostgreSQL locally
2. Create database: `createdb euromillions`
3. Add to `.env` file:
```
DATABASE_URL=postgresql://username:password@localhost:5432/euromillions
NODE_ENV=development
```

## Verification

After setup, verify everything works:
```bash
node test-local.js
```

Should show:
- ✅ All 6 tests passed
- 📈 51 historical draws loaded
- 💰 Current jackpot: €97 million
- ⏰ Countdown to next draw

## Expected Results

When working correctly, you'll see:
- **Real historical data**: 51 EuroMillions draws (Jan-July 2025)
- **Live jackpot**: €97 million (R2.027 billion)
- **Countdown timer**: Updates every second to next draw
- **All features working**: Search, predictions, analytics, history

## Application Access

Open in browser: **http://localhost:5000**

## Troubleshooting

### Database Connection Issues
- Check DATABASE_URL format
- Ensure database exists and accessible
- Verify credentials

### No Historical Data
- Run `npm run db:push` to create tables
- Restart application to trigger data loading
- Check console logs for errors

### Dependencies Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

### Test Failures
- Ensure server is running (`npm run dev`)
- Check database connection
- Verify all API endpoints respond correctly

## Performance Notes

- **Startup time**: 5-10 seconds
- **Data loading**: 2-3 seconds for 51 historical draws
- **Memory usage**: ~200-300MB
- **API response times**: < 500ms

The application uses real EuroMillions data and should work identically to the Replit environment.