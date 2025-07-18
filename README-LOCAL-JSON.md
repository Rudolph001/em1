# EuroMillions Analysis App - Local Setup with JSON Storage

## Quick Start (No Database Required!)

This version uses JSON file storage instead of a database, making it much easier to run locally.

### Windows Users
```bash
# Double-click or run:
run-local.bat
```

### Mac/Linux Users  
```bash
# Run:
python3 run-local.py
```

### Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Create data folder
mkdir data

# 3. Set environment (optional - will be created automatically)
echo "NODE_ENV=development" > .env
echo "STORAGE_TYPE=json" >> .env

# 4. Start the app
npm run dev
```

## What's Different from Database Version

✅ **No database setup required** - uses JSON files in `/data` folder  
✅ **No connection strings** - works offline  
✅ **Instant setup** - just run and go  
✅ **Portable** - copy the folder anywhere  

## Features Working with JSON Storage

- ✅ **Real-time jackpot data**: €111M from EuroMillones.com
- ✅ **Advanced predictions**: 64.6% confidence with ML algorithms
- ✅ **Historical analysis**: 51 real EuroMillions draws
- ✅ **Live exchange rates**: Accurate EUR to ZAR conversion
- ✅ **Pattern analysis**: Hot/cold numbers, gap patterns, trends

## Application URLs

Once running, access the app at:
- **Main App**: http://localhost:5000
- **API Status**: http://localhost:5000/api/stats
- **Current Jackpot**: http://localhost:5000/api/jackpot
- **Latest Prediction**: http://localhost:5000/api/prediction

## Data Storage

All data is stored in JSON files in the `/data` folder:
- `draws.json` - Historical draw results
- `predictions.json` - AI predictions  
- `jackpot.json` - Current jackpot amounts
- `combinations.json` - Combination tracking

## Troubleshooting

**Port already in use?**
```bash
# Kill process on port 5000
npx kill-port 5000
```

**Missing data folder?**
```bash
mkdir data
```

**Want to reset data?**
```bash
# Delete and recreate data folder
rm -rf data
mkdir data
# Then restart the app
```

## Performance

JSON storage is perfect for local development and small to medium datasets. For production or large-scale use, consider upgrading to the PostgreSQL version.

## Migration Path

To upgrade to database storage later:
1. Set `DATABASE_URL` in `.env`
2. Run `npm run db:push` 
3. The app will automatically switch to database mode

---

**Need help?** Check the full documentation in `SETUP-INSTRUCTIONS.md` or run the diagnostic tools:
- `node test-local.js` - Test all API endpoints
- `node diagnose-local.js` - Full system diagnostics