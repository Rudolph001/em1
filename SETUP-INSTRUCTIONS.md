# EuroMillions Analysis App - Local Setup Guide

## Quick Start (Windows)

1. **Download and Install Node.js**
   - Go to: https://nodejs.org/
   - Download the LTS version (recommended)
   - Run the installer and follow the setup wizard

2. **Setup PostgreSQL Database**
   
   **Option A: Local PostgreSQL**
   - Install PostgreSQL from: https://www.postgresql.org/download/
   - Create a database: `CREATE DATABASE euromillions;`
   - Update the `DATABASE_URL` in `.env` file

   **Option B: Cloud Database (Recommended)**
   - Use Neon, Supabase, or any PostgreSQL cloud provider
   - Copy the connection string to `.env` file

3. **Run the App**
   - Double-click `run-local.bat`
   - Wait for setup to complete (first time may take 1-2 minutes)
   - Open browser to: http://localhost:5000

## First Launch

The app will automatically:
- Install dependencies
- Create configuration files
- Download real EuroMillions historical data (52 draws)
- Set up all 139+ million lottery combinations
- Start the web server

**Note:** First startup takes 30-60 seconds to load historical data.

## Features

✅ **Real Data**: Live jackpot amounts and exchange rates  
✅ **AI Predictions**: Machine learning analysis of patterns  
✅ **Historical Analysis**: 52+ real EuroMillions draws  
✅ **Gap Analysis**: Position pattern recognition  
✅ **Hot/Cold Numbers**: Frequency analysis  
✅ **Search Tool**: Check if combinations have been drawn  

## Database Setup Examples

### Neon Database (Free Cloud PostgreSQL)
```
DATABASE_URL=postgresql://username:password@ep-example.neon.tech/neondb?sslmode=require
```

### Local PostgreSQL
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/euromillions
```

### Supabase
```
DATABASE_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
```

## Troubleshooting

**"No historical data"**: 
- Check internet connection
- Database may need a few moments to initialize
- Try refreshing the page

**Database connection errors**:
- Verify DATABASE_URL is correct in .env file
- Ensure database exists and is accessible

**Node.js not found**:
- Install Node.js from https://nodejs.org/
- Restart the terminal/command prompt

## Support

For issues or questions, check the console logs in the terminal window where the app is running.