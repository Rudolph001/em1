# EuroMillions App - Local Setup Guide

## Quick Start (Windows)

1. **Install Node.js**
   - Visit: https://nodejs.org/
   - Download LTS version (recommended)
   - Run installer and follow prompts

2. **Set Up Database**
   Choose one option:
   
   **Option A: Cloud Database (Easiest)**
   - Sign up for a free PostgreSQL database at:
     - [Neon](https://neon.tech) (recommended)
     - [Supabase](https://supabase.com)
     - [Railway](https://railway.app)
   - Get your connection string
   
   **Option B: Local PostgreSQL**
   - Download PostgreSQL from https://postgresql.org/
   - Install and create a database named `euromillions`

3. **Run the App**
   - Double-click `run-local.bat`
   - Update the DATABASE_URL in `.env` when prompted
   - The app will start automatically

4. **Access the App**
   - Open browser to: `http://localhost:5000`
   - Enjoy real EuroMillions data and analysis!

## Manual Setup (Alternative)

If you prefer to run commands manually:

```bash
# Install dependencies
npm install

# Set up database
npm run db:push

# Start the app
npm run dev
```

## Configuration

The setup script creates a `.env` file with these default settings:

```env
NODE_ENV=development
DATABASE_URL=file:./local.db
```

### Database Configuration

Update the `.env` file with your database connection:

**Cloud Database (Recommended):**
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

**Local PostgreSQL:**
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/euromillions
```

The app will automatically:
- Create all required tables
- Load real historical lottery data
- Set up the prediction system

## Features Available Locally

✅ **Real EuroMillions Data**
- Current jackpot amounts (€97M as of July 2025)
- Live EUR/ZAR exchange rates
- Historical draw results from National Lottery
- AI-powered predictions

✅ **Full Analytics**
- Hot/cold number analysis
- Gap pattern analysis
- Combination search (all 139M possibilities)
- Statistical insights

✅ **Interactive Interface**
- Search for specific combinations
- View prediction confidence scores
- Browse historical draws
- Real-time countdown to next draw

## Troubleshooting

**Problem**: "Node.js is not installed"
- **Solution**: Download from https://nodejs.org/ and install

**Problem**: Database errors
- **Solution**: Delete `local.db` file and run `npm run db:push`

**Problem**: Port already in use
- **Solution**: Close other applications using port 5000, or change port in package.json

**Problem**: API errors
- **Solution**: Check internet connection - the app fetches real lottery data

## System Requirements

- **Operating System**: Windows 10/11, macOS, or Linux
- **Node.js**: Version 18 or higher
- **RAM**: 4GB minimum
- **Storage**: 500MB for app and data
- **Internet**: Required for real-time lottery data

## Performance Notes

- First startup may take 30-60 seconds to download lottery data
- Database initialization processes 52 historical draws
- Subsequent startups are much faster (5-10 seconds)
- Data updates automatically every 2-5 minutes

---

For support or questions, check the logs in the terminal window or create an issue in the project repository.