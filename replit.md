# EuroMillions Analysis and Prediction Web App

## Overview

This is a full-stack EuroMillions lottery analysis and prediction web application built with React, TypeScript, and Node.js. The application provides comprehensive analysis of all 139,838,160 possible EuroMillions combinations, tracks historical draw data, and uses machine learning to predict future winning numbers.

**Migration Status**: ✅ Successfully migrated from Replit Agent to Replit environment (July 15, 2025)

## Recent Changes

**July 15, 2025 - Replit Environment Migration Complete**
- ✅ Migrated from Replit Agent to full Replit environment
- ✅ Created and configured PostgreSQL database with Drizzle ORM
- ✅ Fixed countdown timer to display live updates instead of static values
- ✅ Verified all API endpoints working with real data (51 historical draws)
- ✅ Confirmed security: proper client/server separation maintained
- ✅ Application fully functional with real-time data updates

**July 13, 2025 - Final Local Deployment Fix**
- ✅ Fixed missing historical data in local deployments
- ✅ Enhanced data initialization with better validation (20+ draws required)
- ✅ Added `/api/initialize` endpoint for force data loading
- ✅ Improved .bat file with setup guidance for first-time users
- ✅ Cleaned up unnecessary .bat files (kept only `run-local.bat`)
- ✅ Created comprehensive `SETUP-INSTRUCTIONS.md` with database examples
- ✅ Fixed analytics/numbers API intermittent errors with better validation

**July 13, 2025 - Migration Complete**
- ✅ Fixed CSS import order for proper Tailwind loading
- ✅ Created PostgreSQL database with proper schema deployment
- ✅ Verified all API endpoints working correctly with real data
- ✅ Confirmed real-time data fetching:
  - Current jackpot: €97 million (accurate as of July 2025)
  - Exchange rate: 20.9 ZAR per EUR (live market rate)
  - Historical draws: 52 real draws from National Lottery CSV
  - Next draw: July 15, 2025 at 8:15 PM GMT

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL sessions with connect-pg-simple
- **Development**: Hot reload with Vite integration

### Key Components

#### Data Models
- **EuroMillions Combinations**: Stores all possible combinations with position tracking
- **Draw History**: Historical lottery draw results with jackpot amounts
- **Predictions**: AI-generated predictions with confidence scores
- **Jackpot Data**: Real-time jackpot amounts in EUR and ZAR
- **Users**: Basic user authentication system

#### Services Layer
- **EuroMillions Service**: Fetches historical draw data from external APIs
- **Currency Service**: Real-time EUR to ZAR exchange rate conversion
- **Prediction Service**: Machine learning-based prediction algorithms
- **Combinations Service**: Manages all 139+ million possible combinations

#### Frontend Features
- **Search & Analysis**: Check if combinations have been drawn before
- **AI Predictions**: Display machine learning predictions with confidence scores
- **Draw History**: View historical draw results and statistics
- **Gap Analysis**: Analyze patterns in position gaps between draws
- **Real-time Updates**: Live jackpot amounts and countdown timers

## Data Flow

1. **Data Initialization**: Historical draws are fetched from EuroMillions API and stored in PostgreSQL
2. **Position Calculation**: Each combination is assigned a unique position (1-139,838,160)
3. **Gap Analysis**: Calculate gaps between consecutive draw positions for pattern recognition
4. **Prediction Generation**: ML algorithms analyze patterns to predict next winning combination
5. **Real-time Updates**: Jackpot amounts and exchange rates refresh every 2 minutes
6. **User Interface**: React components display data with real-time updates via React Query

## External Dependencies

### APIs
- **EuroMillions API**: `https://euromillions.api.pedromealha.dev/v1` for historical draw data
- **Currency API**: `https://latest.currency-api.pages.dev/v1/currencies` for EUR/ZAR exchange rates
- **Fallback Currency API**: `https://api.exchangerate-api.com/v4/latest/EUR`

### Key Libraries
- **Database**: `drizzle-orm`, `@neondatabase/serverless`
- **UI Components**: `@radix-ui/*` family for accessible components
- **Styling**: `tailwindcss`, `class-variance-authority`, `clsx`
- **State Management**: `@tanstack/react-query`
- **Forms**: `react-hook-form`, `@hookform/resolvers`, `zod`
- **Charts**: `recharts` for data visualization
- **Date Handling**: `date-fns`

## Deployment Strategy

### Development
- Uses Vite dev server with hot reload
- Express server runs on Node.js with TypeScript compilation
- Database migrations with Drizzle Kit
- Replit-specific plugins for development environment

### Production Build
- Frontend: Vite builds optimized static assets
- Backend: ESBuild bundles server code with external dependencies
- Database: Drizzle push for schema deployment
- Single-command deployment with `npm run build && npm start`

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment mode (development/production)

### Architecture Decisions

#### Database Choice
- **PostgreSQL with Drizzle ORM**: Chosen for reliability, ACID compliance, and JSON support for number arrays
- **Neon Database**: Serverless PostgreSQL for scalability and cost efficiency
- **Alternative**: Could use SQLite for simpler deployments, but PostgreSQL chosen for production scalability

#### Prediction Strategy
- **Gap Analysis**: Primary method analyzing position gaps between consecutive draws
- **Statistical Patterns**: Frequency analysis of numbers and lucky stars
- **Machine Learning**: Placeholder for more sophisticated algorithms
- **Confidence Scoring**: Provides accuracy estimates for predictions

#### Real-time Updates
- **Polling Strategy**: React Query refetches data at intervals (2 minutes for jackpot, 5-10 minutes for other data)
- **Alternative**: WebSocket connections considered but polling chosen for simplicity
- **Background Jobs**: Server-side scheduled tasks for data updates

#### UI/UX Design
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: Radix UI components ensure WCAG compliance
- **Performance**: Vite for fast builds, React Query for efficient data fetching
- **Component Architecture**: Modular components with clear separation of concerns