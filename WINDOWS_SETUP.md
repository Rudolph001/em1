
# Windows Setup Guide

## Prerequisites Installation

### 1. Install Node.js
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the LTS version for Windows
3. Run the installer with default settings
4. Verify installation by opening Command Prompt and running:
   ```cmd
   node --version
   npm --version
   ```

### 2. Install PostgreSQL
1. Go to [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Download and run the installer
3. During installation:
   - Remember the password for the `postgres` user
   - Default port 5432 is fine
   - Install pgAdmin (recommended for database management)

### 3. Create Database
1. Open pgAdmin or use psql command line
2. Create a new database named `euromillions`
3. Note your connection details:
   - Host: localhost
   - Port: 5432 (default)
   - Username: postgres (or your custom user)
   - Password: (what you set during installation)

## Quick Setup (Automated)

1. **Run the setup script:**
   ```cmd
   setup.bat
   ```
   This will install dependencies and create the .env file.

2. **Edit the .env file:**
   Open `.env` in any text editor and update the DATABASE_URL:
   ```
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/euromillions
   ```

3. **Start the app:**
   ```cmd
   start.bat
   ```

## Manual Setup

If you prefer to set up manually:

1. **Install dependencies:**
   ```cmd
   npm install
   ```

2. **Create .env file:**
   ```cmd
   copy .env.example .env
   ```

3. **Edit .env file** with your database credentials

4. **Setup database schema:**
   ```cmd
   npm run db:push
   ```

5. **Start development server:**
   ```cmd
   npm run dev
   ```

## Common Issues & Solutions

### Port 5000 Already in Use
If you get a port error, you can:
1. Find what's using port 5000: `netstat -ano | findstr :5000`
2. Kill the process or change the port in `server/index.ts`

### Database Connection Failed
1. Ensure PostgreSQL service is running:
   - Open Services (services.msc)
   - Look for "postgresql-x64-16" (or similar)
   - Make sure it's "Running"

2. Test connection using pgAdmin

3. Verify DATABASE_URL format:
   ```
   postgresql://username:password@host:port/database
   ```

### Permission Errors
Run Command Prompt as Administrator if you encounter permission issues.

## File Structure for Local Development

Your project should have these additional files for Windows:
- `.env` - Environment variables (create from .env.example)
- `setup.bat` - Automated setup script
- `start.bat` - Quick start script
- `README.md` - Documentation
- `WINDOWS_SETUP.md` - This guide

## Development Workflow

1. Start PostgreSQL service (if not auto-starting)
2. Run `start.bat` or `npm run dev`
3. Open browser to `http://localhost:5000`
4. The app will automatically fetch initial data from EuroMillions API

## Production Build

To create a production build:
```cmd
npm run build
npm start
```

This creates optimized files and starts the production server.
