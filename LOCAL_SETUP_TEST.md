# Local Machine Setup and Testing Guide

## Prerequisites
- Node.js 18 or higher
- PostgreSQL database (local or cloud)
- Git

## Quick Setup Steps

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd euromillions-analysis
npm install
```

### 2. Database Setup
Choose one of these options:

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL locally
# Create database
createdb euromillions
```

#### Option B: Neon Database (Recommended)
- Sign up at https://neon.tech
- Create a new project
- Copy the connection string

### 3. Environment Configuration
Create `.env` file:
```
DATABASE_URL=postgresql://username:password@localhost:5432/euromillions
NODE_ENV=development
```

### 4. Database Schema Setup
```bash
npm run db:push
```

### 5. Start Application
```bash
npm run dev
```

## Testing Checklist

### ✅ Basic Functionality
- [ ] Application starts without errors
- [ ] Database connection successful
- [ ] Frontend loads at http://localhost:5000

### ✅ Data Loading
- [ ] Historical data loads (51 draws from Jan-July 2025)
- [ ] Latest draw shows: July 11, 2025
- [ ] Stats show: 51 drawn combinations
- [ ] Countdown timer works (updates every second)

### ✅ Real-time Features
- [ ] Jackpot amount: €97 million
- [ ] Exchange rate: ~20.9 ZAR per EUR
- [ ] Next draw countdown shows correct SA time (10:15 PM SAST)

### ✅ Navigation
- [ ] Search & Analyze tab works
- [ ] AI Predictions tab loads
- [ ] Draw History tab shows 51 historical draws
- [ ] Gap Analysis tab displays charts

### ✅ API Endpoints
Test these URLs in browser:
- http://localhost:5000/api/stats
- http://localhost:5000/api/history
- http://localhost:5000/api/jackpot
- http://localhost:5000/api/next-draw

## Common Issues and Solutions

### Issue: Database Connection Failed
**Solution:** 
- Check DATABASE_URL format
- Ensure PostgreSQL is running
- Verify credentials

### Issue: No Historical Data
**Solution:**
- Run `npm run db:push` to create tables
- Check logs for CSV fetch errors
- Restart application to trigger data initialization

### Issue: Countdown Not Updating
**Solution:**
- Clear browser cache
- Check browser console for JavaScript errors
- Verify API responses

### Issue: Dependencies Missing
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Performance Expectations
- **Startup time:** 5-10 seconds
- **Data loading:** 51 historical draws should load in 2-3 seconds
- **API response times:** < 500ms for most endpoints
- **Memory usage:** ~200-300MB for Node.js process

## Troubleshooting Commands
```bash
# Check database connection
npm run db:push

# View logs with detailed output
NODE_ENV=development npm run dev

# Test API endpoints
curl http://localhost:5000/api/stats
curl http://localhost:5000/api/history | head -20
```

## Expected Output
When everything works correctly, you should see:
- Real EuroMillions historical data (Jan 17 - July 11, 2025)
- Live countdown to next draw (July 15, 8:15 PM GMT / 10:15 PM SAST)
- Current jackpot: €97 million (R2.027 billion)
- 51 historical draws with position calculations
- Gap analysis and prediction algorithms working

## Need Help?
If you encounter issues:
1. Check console logs for error messages
2. Verify database connection
3. Ensure all dependencies are installed
4. Test individual API endpoints