# 🎯 EuroMillions App - Windows Setup Guide

## One-Click Setup

### Step 1: Install Node.js
- Download from: https://nodejs.org/
- Choose "LTS" version (recommended)
- Run installer with default settings

### Step 2: Get Database (Choose One Option)

**🏆 RECOMMENDED: Free Cloud Database**
1. Go to https://neon.tech/
2. Sign up for free account
3. Create new project
4. Copy the connection string (looks like: `postgresql://user:pass@host/db`)

**Alternative: Local PostgreSQL**
1. Download from https://postgresql.org/
2. Install with default settings
3. Remember your password
4. Create database named `euromillions`

### Step 3: Run the App
1. **Double-click `run-local.bat`**
2. **Paste your database URL when prompted**
3. **Open browser to: http://localhost:5000**

---

## What You Get

✅ **Real EuroMillions Data**
- Current jackpot: €97 million
- Live exchange rates (EUR/ZAR)
- 50+ historical draws from National Lottery

✅ **Advanced Analytics**
- Hot/cold number analysis
- AI predictions with confidence scores
- Pattern recognition
- Gap analysis

✅ **Interactive Features**
- Search any combination (139M possibilities)
- Real-time countdown to next draw
- Historical trend analysis
- Multiple prediction algorithms

---

## Quick Troubleshooting

**"Node.js not found"**
→ Install Node.js from nodejs.org

**"Database connection failed"**
→ Check your DATABASE_URL in .env file

**"Port already in use"**
→ Close other apps or restart computer

**"Dependencies failed"**
→ Run: `npm install` manually

---

## Files Created

- `.env` - Configuration file
- `euromillions.db` - Local database (if using SQLite)
- `node_modules/` - Dependencies folder

## Support

Having issues? Check the console output for specific error messages.
The app fetches real lottery data and may take 30-60 seconds on first startup.

---

**Ready to analyze the lottery? Double-click `run-local.bat` to start!**