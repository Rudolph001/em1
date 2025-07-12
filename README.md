
# EuroMillions Analysis & Prediction App

A full-stack web application for analyzing EuroMillions lottery data and generating predictions based on historical patterns.

## Features

- Historical draw analysis with position tracking
- Next draw predictions using gap analysis
- Real-time jackpot updates with EUR/ZAR conversion
- Interactive charts and analytics
- Combination search and lookup
- Automatic draw result updates

## Local Development Setup (Windows)

### Prerequisites

1. **Node.js** (v20 or higher) - Download from [nodejs.org](https://nodejs.org/)
2. **PostgreSQL** (v16 or higher) - Download from [postgresql.org](https://www.postgresql.org/download/windows/)

### Installation Steps

1. **Clone or download this project** to your local machine

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup PostgreSQL Database:**
   - Install PostgreSQL and create a new database named `euromillions`
   - Note your database connection details (host, port, username, password)

4. **Environment Configuration:**
   - Copy `.env.example` to `.env`
   - Update the `DATABASE_URL` with your PostgreSQL connection string:
     ```
     DATABASE_URL=postgresql://username:password@localhost:5432/euromillions
     ```

5. **Initialize Database Schema:**
   ```bash
   npm run db:push
   ```

6. **Start Development Server:**
   ```bash
   npm run dev
   ```

7. **Access the Application:**
   - Open your browser and go to `http://localhost:5000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run check` - TypeScript type checking

### Database Schema

The app automatically creates the following tables:
- `draw_history` - Historical lottery draws
- `combinations` - All possible number combinations
- `predictions` - Generated predictions

### API Endpoints

- `GET /api/history` - Historical draws
- `GET /api/prediction` - Current prediction
- `GET /api/jackpot` - Current jackpot amounts
- `GET /api/stats` - Application statistics
- `GET /api/analytics/*` - Various analytics endpoints

### Troubleshooting

1. **Database Connection Issues:**
   - Ensure PostgreSQL is running
   - Verify DATABASE_URL in .env file
   - Check firewall settings

2. **Port Already in Use:**
   - The app runs on port 5000 by default
   - Change port in server/index.ts if needed

3. **Missing Dependencies:**
   - Run `npm install` to ensure all packages are installed
   - Delete node_modules and package-lock.json, then reinstall if issues persist

### External APIs Used

- EuroMillions API: `https://euromillions.api.pedromealha.dev/v1`
- Currency API: `https://latest.currency-api.pages.dev/v1/currencies`
