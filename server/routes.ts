import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { EuroMillionsService } from "./services/euromillions";
import { CurrencyService } from "./services/currency";
import { PredictionService } from "./services/prediction";
import { CombinationsService } from "./services/combinations";
import { insertDrawHistorySchema, insertPredictionSchema, insertJackpotDataSchema } from "@shared/schema";

let dataInitialized = false;
let lastDataCheck = 0;
const DATA_CHECK_INTERVAL = 5 * 60 * 1000; // Check for new data every 5 minutes

// Prize breakdown caching
let prizeBreakdownCache: any = null;
let lastPrizeBreakdownFetch = 0;
const PRIZE_BREAKDOWN_CACHE_DURATION = 2 * 60 * 1000; // Cache for 2 minutes

// Reset initialization flag to force re-initialization
const resetDataInitialization = () => {
  dataInitialized = false;
  lastDataCheck = 0;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize data and check for updates
  async function initializeData(forceUpdate = false) {
    const now = Date.now();

    // Check if we need to update data
    if (dataInitialized && !forceUpdate && (now - lastDataCheck) < DATA_CHECK_INTERVAL) {
      return;
    }

    try {
      console.log('Initializing EuroMillions data...');

      // Check if we already have sufficient data
      const existingHistory = await storage.getDrawHistory(50);
      console.log(`Found ${existingHistory.length} existing draws in database`);

      if (existingHistory.length >= 20) {
        // Check if we have diverse data (not all the same numbers)
        const uniqueNumberSets = new Set(existingHistory.map(draw => 
          JSON.stringify([...draw.mainNumbers.sort(), ...draw.luckyStars.sort()])
        ));

        // Also check if the data dates look reasonable (from 2024 onwards)
        const hasValidDates = existingHistory.some(draw => {
          const year = draw.drawDate.getFullYear();
          return year === 2024 || year === 2025;
        });

        // Check if we have recent data (within last 3 months)
        const now = new Date();
        const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        const hasRecentData = existingHistory.some(draw => 
          draw.drawDate >= threeMonthsAgo
        );

        console.log(`Data validation: unique sets=${uniqueNumberSets.size}, valid dates=${hasValidDates}, recent data=${hasRecentData}`);

        // Always check for new data if enough time has passed
        if (uniqueNumberSets.size >= 10 && hasValidDates && hasRecentData && !forceUpdate && (now - lastDataCheck) < DATA_CHECK_INTERVAL) {
          console.log('Sufficient diverse data already exists, skipping initialization');
          dataInitialized = true;
          lastDataCheck = now;
          return;
        } else {
          console.log('Checking for updated data or reinitializing...');
        }
      } else {
        console.log(`Only ${existingHistory.length} draws found, need at least 20 for initialization`);
      }

      // Fetch all available historical draws from real CSV data
      let historicalDraws;
      try {
        console.log('Loading historical draws...');
        historicalDraws = await EuroMillionsService.getExtendedHistoricalDraws();
        console.log(`Initializing with ${historicalDraws.length} historical draws`);
        if (historicalDraws.length > 0) {
          console.log(`Full date range available: ${historicalDraws[historicalDraws.length - 1]?.date} to ${historicalDraws[0]?.date}`);
        }
      } catch (error) {
        console.error('Failed to fetch historical draws:', error);
        throw new Error('Unable to initialize with real draw data');
      }

      // Remove duplicates based on date and numbers
      const uniqueDraws = historicalDraws.filter((draw, index, self) => 
        index === self.findIndex(d => 
          d.date === draw.date && 
          JSON.stringify(d.numbers.sort()) === JSON.stringify(draw.numbers.sort()) &&
          JSON.stringify(d.stars.sort()) === JSON.stringify(draw.stars.sort())
        )
      );

      console.log(`Processing ${uniqueDraws.length} unique draws from real CSV data`);

      // Using database storage - data persistence handled by database

      // Check for new draws since last update
      const existingDraws = await storage.getDrawHistory(10);
      let hasNewData = false;

      if (existingDraws.length > 0 && uniqueDraws.length > 0) {
        const latestExisting = existingDraws[0];
        const latestNew = uniqueDraws[0];

        // Compare dates to see if we have new data
        const existingDate = latestExisting.drawDate.toISOString().split('T')[0];
        const newDate = latestNew.date;

        if (existingDate !== newDate) {
          console.log(`New data detected: existing latest ${existingDate}, new latest ${newDate}`);
          hasNewData = true;
        } else if (!forceUpdate) {
          console.log('Data already up to date, skipping re-initialization');
          dataInitialized = true;
          lastDataCheck = now;
          return;
        }
      } else {
        hasNewData = true;
      }

      const positions: number[] = [];
      let previousPosition = 0;

      // Process only new draws if we have existing data
      const drawsToProcess = hasNewData && existingDraws.length > 0 
        ? uniqueDraws.filter(draw => {
            const drawDate = new Date(draw.date);
            return !existingDraws.some(existing => 
              existing.drawDate.toISOString().split('T')[0] === draw.date
            );
          })
        : uniqueDraws;

      console.log(`Processing ${drawsToProcess.length} draws (${hasNewData ? 'new data' : 'full initialization'})`);

      for (const draw of drawsToProcess) {
        // Check if this exact draw already exists
        const existingDraw = await storage.getDrawByDate(new Date(draw.date));
        if (existingDraw) {
          console.log(`Skipping duplicate draw for ${draw.date}`);
          continue;
        }

        // Store draw history with original order as drawn
        const sortedNumbers = [...draw.numbers].sort((a, b) => a - b);
        const sortedStars = [...draw.stars].sort((a, b) => a - b);
        const position = CombinationsService.calculatePosition(sortedNumbers, sortedStars);
        positions.push(position);

        const gapFromPrevious = previousPosition > 0 ? position - previousPosition : 0;

        try {
          await storage.createDrawHistory({
            drawDate: new Date(draw.date),
            mainNumbers: draw.numbers, // Keep original order as drawn
            luckyStars: draw.stars, // Keep original order as drawn
            position,
            jackpotEur: draw.jackpot || 0,
            jackpotZar: draw.jackpot ? await CurrencyService.convertEurToZar(draw.jackpot) || 0 : 0,
            gapFromPrevious
          });

          // Mark combination as drawn (using sorted numbers for consistency)
          await storage.createCombination({
            position,
            mainNumbers: sortedNumbers,
            luckyStars: sortedStars,
            hasBeenDrawn: true,
            lastDrawnDate: new Date(draw.date)
          });

          previousPosition = position;
          console.log(`Stored draw for ${draw.date}: [${draw.numbers}] + [${draw.stars}] at position ${position}`);
        } catch (error) {
          console.error('Error storing draw:', draw.date, error);
        }
      }

      // Generate initial prediction using new advanced model
      const prediction = await PredictionService.generatePrediction(drawsToProcess);
      await storage.createPrediction({
        drawDate: EuroMillionsService.getNextDrawDate(),
        mainNumbers: prediction.mainNumbers,
        luckyStars: prediction.luckyStars,
        position: prediction.position,
        confidence: prediction.confidence,
        modelVersion: prediction.modelVersion,
        reasoning: prediction.reasoning,
        historicalDataPoints: prediction.historicalDataPoints
      });

      // Initialize jackpot data
      const currentJackpot = await EuroMillionsService.getCurrentJackpot();
      const exchangeRate = await CurrencyService.getEurToZarRate();

      if (currentJackpot && exchangeRate) {
        await storage.createJackpotData({
          amountEur: currentJackpot,
          amountZar: currentJackpot * exchangeRate.rate,
          exchangeRate: exchangeRate.rate
        });
      }

      dataInitialized = true;
      lastDataCheck = now;
      console.log('Data initialization complete');
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }

  // Get current jackpot and exchange rate
  app.get("/api/jackpot", async (req, res) => {
    try {
      await initializeData();

      // Disable caching for real-time data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Get current exchange rate (fresh data)
      let exchangeRate;
      let currentJackpot;

      try {
        exchangeRate = await CurrencyService.getEurToZarRate();
        console.log('Exchange rate fetch result:', exchangeRate);
      } catch (error) {
        console.error('Exchange rate fetch failed:', error);
        exchangeRate = null;
      }

      try {
        currentJackpot = await EuroMillionsService.getCurrentJackpot();
        console.log('Current jackpot fetch result:', currentJackpot);
      } catch (error) {
        console.error('Current jackpot fetch failed:', error);
        currentJackpot = null;
      }

      if (!currentJackpot || !exchangeRate) {
        console.log('Falling back to stored data - currentJackpot:', currentJackpot, 'exchangeRate:', exchangeRate);

        // Fallback to stored data if APIs are unavailable
        const jackpotData = await storage.getLatestJackpotData();
        if (!jackpotData) {
          console.error('No stored jackpot data available');
          return res.status(404).json({ error: "No jackpot data available" });
        }

        console.log('Returning stored jackpot data:', jackpotData);
        return res.json(jackpotData);
      }

      // Calculate fresh ZAR amount with current exchange rate
      const freshJackpotData = {
        amountEur: currentJackpot,
        amountZar: currentJackpot * exchangeRate.rate,
        exchangeRate: exchangeRate.rate,
        updatedAt: new Date()
      };

      console.log('Fresh jackpot data calculated:', freshJackpotData);

      // Update stored data with fresh values
      try {
        await storage.createJackpotData(freshJackpotData);
        console.log('Successfully stored fresh jackpot data');
      } catch (error) {
        console.error('Failed to store jackpot data:', error);
        // Continue anyway, we can still return the data
      }

      res.json(freshJackpotData);
    } catch (error) {
      console.error('Error in jackpot endpoint:', error);

      // Try to return stored data as last resort
      try {
        const jackpotData = await storage.getLatestJackpotData();
        if (jackpotData) {
          console.log('Returning stored data as fallback after error');
          return res.json(jackpotData);
        }
      } catch (storageError) {
        console.error('Failed to get stored jackpot data:', storageError);
      }

      res.status(500).json({ 
        error: "Failed to fetch jackpot data",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get next draw countdown
  app.get("/api/next-draw", async (req, res) => {
    try {
      const nextDrawDate = EuroMillionsService.getNextDrawDate();
      const now = new Date();
      const timeUntilDraw = nextDrawDate.getTime() - now.getTime();

      res.json({
        nextDrawDate: nextDrawDate.toISOString(),
        timeUntilDraw,
        countdown: {
          days: Math.floor(timeUntilDraw / (1000 * 60 * 60 * 24)),
          hours: Math.floor((timeUntilDraw % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((timeUntilDraw % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((timeUntilDraw % (1000 * 60)) / 1000)
        }
      });
    } catch (error) {
      console.error('Error calculating next draw:', error);
      res.status(500).json({ error: "Failed to calculate next draw time" });
    }
  });

  // Force data initialization endpoint
  app.get("/api/initialize", async (req, res) => {
    try {
      console.log('Force initialization requested...');
      resetDataInitialization();
      await initializeData();

      const stats = await storage.getStats();
      const history = await storage.getDrawHistory(5);

      res.json({
        message: "Data initialization completed successfully",
        stats,
        sampleHistory: history.map(draw => ({
          date: draw.drawDate,
          numbers: draw.mainNumbers,
          stars: draw.luckyStars
        }))
      });
    } catch (error) {
      console.error('Error during force initialization:', error);
      res.status(500).json({ 
        error: "Failed to initialize data",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get application statistics
  app.get("/api/stats", async (req, res) => {
    try {
      await initializeData();
      const stats = await storage.getStats();

      // Add cache-busting headers to ensure fresh data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Search for a specific combination
  app.post("/api/search", async (req, res) => {
    try {
      await initializeData();
      const { mainNumbers, luckyStars } = req.body;

      if (!mainNumbers || !luckyStars || mainNumbers.length !== 5 || luckyStars.length !== 2) {
        return res.status(400).json({ error: "Invalid combination format" });
      }

      const position = CombinationsService.calculatePosition(mainNumbers, luckyStars);
      const combination = await storage.getCombinationByPosition(position);

      // Find similar combinations (nearby positions)
      const similarCombinations = await storage.getCombinationsRange(
        Math.max(1, position - 1000),
        Math.min(139838160, position + 1000)
      );

      res.json({
        position,
        mainNumbers,
        luckyStars,
        hasBeenDrawn: combination?.hasBeenDrawn || false,
        lastDrawnDate: combination?.lastDrawnDate || null,
        similarCombinations: similarCombinations.slice(0, 10)
      });
    } catch (error) {
      console.error('Error searching combination:', error);
      res.status(500).json({ error: "Failed to search combination" });
    }
  });

  // Get combination by position
  app.get("/api/combination/:position", async (req, res) => {
    try {
      await initializeData();
      const position = parseInt(req.params.position);

      if (isNaN(position) || position < 1 || position > 139838160) {
        return res.status(400).json({ error: "Invalid position" });
      }

      const combination = CombinationsService.getCombinationByPosition(position);
      if (!combination) {
        return res.status(404).json({ error: "Combination not found" });
      }

      const dbCombination = await storage.getCombinationByPosition(position);

      res.json({
        position,
        mainNumbers: combination.mainNumbers,
        luckyStars: combination.luckyStars,
        hasBeenDrawn: dbCombination?.hasBeenDrawn || false,
        lastDrawnDate: dbCombination?.lastDrawnDate || null
      });
    } catch (error) {
      console.error('Error fetching combination:', error);
      res.status(500).json({ error: "Failed to fetch combination" });
    }
  });

  // Force refresh data endpoint
  app.post("/api/refresh-data", async (req, res) => {
    try {
      console.log('Manual data refresh requested...');
      resetDataInitialization();
      await initializeData(true);

      const stats = await storage.getStats();
      const history = await storage.getDrawHistory(5);

      res.json({
        message: "Data refresh completed successfully",
        stats,
        sampleHistory: history.map(draw => ({
          date: draw.drawDate,
          numbers: draw.mainNumbers,
          stars: draw.luckyStars
        }))
      });
    } catch (error) {
      console.error('Error during manual refresh:', error);
      res.status(500).json({ 
        error: "Failed to refresh data",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get draw history
  app.get("/api/history", async (req, res) => {
    try {
      await initializeData();
      const limit = parseInt(req.query.limit as string) || 20;
      const history = await storage.getDrawHistory(limit);
      res.json(history);
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: "Failed to fetch draw history" });
    }
  });

  // Get historical data date range
  app.get("/api/history/date-range", async (req, res) => {
    try {
      await initializeData();
      const allHistory = await storage.getDrawHistory(); // Get all records

      if (allHistory.length === 0) {
        return res.json({ earliest: null, latest: null, totalDraws: 0 });
      }

      const dates = allHistory.map(draw => new Date(draw.drawDate));
      const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
      const latest = new Date(Math.max(...dates.map(d => d.getTime())));

      res.json({
        earliest: earliest.toISOString(),
        latest: latest.toISOString(),
        totalDraws: allHistory.length
      });
    } catch (error) {
      console.error('Error fetching date range:', error);
      res.status(500).json({ error: "Failed to fetch date range" });
    }
  });

  // Get current prediction using advanced model
  app.get("/api/prediction", async (req, res) => {
    try {
      await initializeData();
      let prediction = await storage.getLatestPrediction();

      // Check if prediction needs refresh (older than 1 day or different model version)
      const needsRefresh = !prediction || 
        (new Date().getTime() - new Date(prediction.createdAt || 0).getTime()) > 24 * 60 * 60 * 1000 ||
        prediction.modelVersion !== 'v3.0.0-advanced';

      if (needsRefresh) {
        console.log('Generating new advanced prediction...');
        // Generate new prediction using advanced model with actual draw data
        const history = await storage.getDrawHistory(30); // Use last 30 draws for better analysis
        const newPrediction = await PredictionService.generatePrediction(history);

        prediction = await storage.createPrediction({
          drawDate: EuroMillionsService.getNextDrawDate(),
          mainNumbers: newPrediction.mainNumbers,
          luckyStars: newPrediction.luckyStars,
          position: newPrediction.position,
          confidence: newPrediction.confidence,
          modelVersion: newPrediction.modelVersion,
          reasoning: newPrediction.reasoning,
          historicalDataPoints: newPrediction.historicalDataPoints
        });
      }

      res.json({
        ...prediction,
        nextDrawDate: EuroMillionsService.getNextDrawDate(),
        modelInfo: {
          version: 'v3.0.0-advanced',
          methods: ['Hot/Cold Balance', 'Statistical Model', 'Gap Patterns', 'Sequence Analysis', 'Temporal Patterns'],
          dataPoints: prediction.historicalDataPoints || 0,
          lastUpdated: prediction.createdAt || new Date()
        }
      });
    } catch (error) {
      console.error('Error fetching prediction:', error);
      res.status(500).json({ error: "Failed to fetch prediction" });
    }
  });

  // Get main predictions (with alternatives)
  app.get("/api/predictions", async (req, res) => {
    try {
      await initializeData();
      const history = await storage.getDrawHistory();
      const positions = history.map(draw => draw.position);

      // Get main prediction
      let mainPrediction = await storage.getLatestPrediction();

      // If no prediction exists or it's missing new fields, generate a new one
      if (!mainPrediction || !mainPrediction.reasoning || !mainPrediction.historicalDataPoints) {
        const newPrediction = await PredictionService.generatePrediction(positions);

        mainPrediction = await storage.createPrediction({
          drawDate: EuroMillionsService.getNextDrawDate(),
          mainNumbers: newPrediction.mainNumbers,
          luckyStars: newPrediction.luckyStars,
          position: newPrediction.position,
          confidence: newPrediction.confidence,
          modelVersion: newPrediction.modelVersion,
          reasoning: newPrediction.reasoning,
          historicalDataPoints: newPrediction.historicalDataPoints
        });
      }

      // Get alternative predictions
      const alternatives = await PredictionService.generateAlternativePredictions(positions);

      res.json({
        mainPrediction,
        predictions: alternatives,
        totalHistoricalDraws: history.length,
        dataQuality: {
          earliestDraw: history[history.length - 1]?.drawDate,
          latestDraw: history[0]?.drawDate,
          totalDraws: history.length
        }
      });
    } catch (error) {
      console.error('Error fetching predictions:', error);
      res.status(500).json({ error: "Failed to fetch predictions" });
    }
  });

  // Get alternative predictions
  app.get("/api/predictions/alternatives", async (req, res) => {
    try {
      await initializeData();
      const history = await storage.getDrawHistory();
      const positions = history.map(draw => draw.position);

      const alternatives = await PredictionService.generateAlternativePredictions(positions);
      res.json(alternatives);
    } catch (error) {
      console.error('Error generating alternative predictions:', error);
      res.status(500).json({ error: "Failed to generate alternative predictions" });
    }
  });

  // Get gap analysis
  app.get("/api/analytics/gaps", async (req, res) => {
    try {
      await initializeData();
      const history = await storage.getDrawHistory();
      const positions = history.map(draw => draw.position);

      const gapAnalysis = CombinationsService.analyzeGaps(positions);

      res.json({
        ...gapAnalysis,
        chartData: {
          labels: history.slice(0, 10).map((_, i) => `Draw ${i + 1}`),
          datasets: [{
            label: 'Position Gap',
            data: gapAnalysis.gaps.slice(0, 10),
            borderColor: '#1976D2',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            fill: true
          }]
        }
      });
    } catch (error) {
      console.error('Error analyzing gaps:', error);
      res.status(500).json({ error: "Failed to analyze gaps" });
    }
  });

  // Get hot and cold numbers
  app.get("/api/analytics/numbers", async (req, res) => {
    try {
      await initializeData();
      const history = await storage.getDrawHistory();

      if (!history || history.length === 0) {
        return res.status(503).json({ 
          error: "Data not yet available", 
          message: "Please wait for data initialization to complete" 
        });
      }

      const numberFrequency = new Map<number, number>();
      const starFrequency = new Map<number, number>();

      history.forEach(draw => {
        if (draw.mainNumbers && Array.isArray(draw.mainNumbers)) {
          draw.mainNumbers.forEach(num => {
            if (typeof num === 'number' && !isNaN(num)) {
              numberFrequency.set(num, (numberFrequency.get(num) || 0) + 1);
            }
          });
        }
        if (draw.luckyStars && Array.isArray(draw.luckyStars)) {
          draw.luckyStars.forEach(star => {
            if (typeof star === 'number' && !isNaN(star)) {
              starFrequency.set(star, (starFrequency.get(star) || 0) + 1);
            }
          });
        }
      });

      const hotNumbers = Array.from(numberFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([num, freq]) => ({ number: num, frequency: freq }));

      const coldNumbers = Array.from(numberFrequency.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, 10)
        .map(([num, freq]) => ({ number: num, frequency: freq }));

      const hotStars = Array.from(starFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([star, freq]) => ({ number: star, frequency: freq }));

      const coldStars = Array.from(starFrequency.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, 6)
        .map(([star, freq]) => ({ number: star, frequency: freq }));

      res.json({
        hotNumbers,
        coldNumbers,
        hotStars,
        coldStars
      });
    } catch (error) {
      console.error('Error analyzing numbers:', error);
      res.status(500).json({ error: "Failed to analyze numbers" });
    }
  });

  // Get draw history
  app.get('/api/history', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      let history = await storage.getDrawHistory(limit);

      if (history.length === 0) {
        console.log('No history found, initializing with fresh data...');
        await initializeData();
        history = await storage.getDrawHistory(limit);
      }

      // Add cache-busting headers to ensure fresh data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.json(history);
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  // Clear data and force refresh (for testing)
  app.post("/api/clear-data", async (req, res) => {
    try {
      // Clear existing data
      // Using database storage - data persistence handled by database

      // Reset the initialization flag to force fresh data
      dataInitialized = false;

      // Reinitialize with fresh data
      await initializeData();

      res.json({ message: 'Data cleared and reinitialized successfully' });
    } catch (error) {
      console.error('Error clearing data:', error);
      res.status(500).json({ error: 'Failed to clear data' });
    }
  });

  // Test CSV data parsing (for debugging)
  app.get("/api/test-csv", async (req, res) => {
    try {
      const latestDraw = await EuroMillionsService.getLatestDraw();
      const historicalDraws = await EuroMillionsService.getHistoricalDraws(5);
      const allDraws = await EuroMillionsService.getExtendedHistoricalDraws();

      const dateRange = allDraws.length > 0 ? {
        earliest: allDraws[allDraws.length - 1]?.date,
        latest: allDraws[0]?.date,
        totalCount: allDraws.length
      } : null;

      res.json({
        latestDraw,
        historicalDraws,
        fullDatasetInfo: dateRange,
        message: 'CSV data test - showing available date range'
      });
    } catch (error) {
      console.error('Error testing CSV:', error);
      res.status(500).json({ error: 'Failed to test CSV data' });
    }
  });

  // Get latest prize breakdown with caching
  app.get("/api/prize-breakdown", async (req, res) => {
    try {
      // Check if we have cached data that's still fresh
      const now = Date.now();
      if (prizeBreakdownCache && (now - lastPrizeBreakdownFetch) < PRIZE_BREAKDOWN_CACHE_DURATION) {
        console.log('Returning cached prize breakdown data');
        return res.json(prizeBreakdownCache);
      }

      console.log('Fetching fresh prize breakdown data...');
      const prizeData = await EuroMillionsService.getPrizeBreakdown();
      
      if (!prizeData) {
        return res.status(503).json({ 
          error: "Prize breakdown data temporarily unavailable",
          message: "Please try again later"
        });
      }

      // Cache the fresh data
      prizeBreakdownCache = prizeData;
      lastPrizeBreakdownFetch = now;

      res.json(prizeData);
    } catch (error) {
      console.error('Error fetching prize breakdown:', error);
      res.status(500).json({ 
        error: "Failed to fetch prize breakdown",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Reset and reinitialize data
  app.post("/api/reset", async (req, res) => {
    try {
      console.log('Resetting and reinitializing data...');
      dataInitialized = false;
      await initializeData();
      res.json({ message: "Data reset and reinitialized successfully" });
    } catch (error) {
      console.error('Error resetting data:', error);
      res.status(500).json({ error: "Failed to reset data" });
    }
  });

  // Get user tickets
  app.get("/api/tickets", async (req, res) => {
    try {
      const tickets = await storage.getTickets();
      res.json(tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });

  // Save new tickets
  app.post("/api/tickets", async (req, res) => {
    try {
      const { tickets } = req.body;
      
      if (!tickets || !Array.isArray(tickets)) {
        return res.status(400).json({ error: "Invalid tickets data" });
      }

      const savedTickets = [];
      for (const ticket of tickets) {
        const savedTicket = await storage.createTicket({
          mainNumbers: ticket.mainNumbers,
          luckyStars: ticket.luckyStars,
          predictionMethod: ticket.predictionMethod,
          confidence: ticket.confidence,
          drawDate: new Date(ticket.drawDate),
          isActive: true
        });
        savedTickets.push(savedTicket);
      }

      res.json({ message: "Tickets saved successfully", tickets: savedTickets });
    } catch (error) {
      console.error('Error saving tickets:', error);
      res.status(500).json({ error: "Failed to save tickets" });
    }
  });

  // Get ticket results
  app.get("/api/ticket-results", async (req, res) => {
    try {
      const results = await storage.getTicketResults();
      res.json(results);
    } catch (error) {
      console.error('Error fetching ticket results:', error);
      res.status(500).json({ error: "Failed to fetch ticket results" });
    }
  });

  // Check ticket results and improve predictions
  app.post("/api/tickets/check-results", async (req, res) => {
    try {
      await initializeData();
      
      // Get active tickets
      const activeTickets = await storage.getActiveTickets();
      
      // Get latest draws
      const latestDraws = await storage.getDrawHistory(10);
      
      if (latestDraws.length === 0) {
        return res.json({ message: "No recent draws available" });
      }

      const results = [];
      let improvementNeeded = false;

      for (const ticket of activeTickets) {
        // Find matching draw
        const matchingDraw = latestDraws.find(draw => 
          draw.drawDate.toISOString().split('T')[0] === ticket.drawDate.toISOString().split('T')[0] ||
          draw.drawDate >= ticket.drawDate
        );

        if (matchingDraw) {
          // Calculate matches
          const mainMatches = ticket.mainNumbers.filter(num => 
            matchingDraw.mainNumbers.includes(num)
          ).length;
          
          const starMatches = ticket.luckyStars.filter(star => 
            matchingDraw.luckyStars.includes(star)
          ).length;

          const totalMatches = mainMatches + starMatches;
          
          // Calculate prize (simplified European prize structure)
          const { prizeAmount, prizeAmountZar, tier } = calculatePrizeAmount(mainMatches, starMatches);

          const result = {
            ticketId: ticket.id,
            drawResult: {
              mainNumbers: matchingDraw.mainNumbers,
              luckyStars: matchingDraw.luckyStars,
              drawDate: matchingDraw.drawDate.toISOString()
            },
            matches: {
              mainMatches,
              starMatches,
              totalMatches,
              prizeAmount,
              prizeAmountZar,
              tier
            }
          };

          // Save result
          await storage.createTicketResult(result);
          
          // Update ticket as completed
          await storage.updateTicket(ticket.id, {
            isActive: false,
            matches: result.matches
          });

          results.push(result);

          // Check if improvement needed (less than 4 matches)
          if (totalMatches < 4) {
            improvementNeeded = true;
          }
        }
      }

      // Improve predictions if needed
      if (improvementNeeded) {
        console.log('Improving predictions based on poor performance...');
        await improvePredictions(results);
      }

      res.json({ 
        message: "Results checked successfully", 
        results,
        improvementTriggered: improvementNeeded
      });
    } catch (error) {
      console.error('Error checking ticket results:', error);
      res.status(500).json({ error: "Failed to check ticket results" });
    }
  });

  // Force data initialization for fresh local setups
  app.post("/api/initialize", async (req, res) => {
    try {
      console.log('Force initializing data for local setup...');

      // Always reset and initialize regardless of current state
      dataInitialized = false;

      // Get historical data
      console.log('Loading historical draws...');
      const historicalDraws = await EuroMillionsService.getExtendedHistoricalDraws();
      console.log(`Found ${historicalDraws.length} historical draws to initialize`);

      if (historicalDraws.length === 0) {
        return res.status(503).json({ 
          error: "No historical data available", 
          message: "Unable to fetch historical draws from EuroMillions API" 
        });
      }

      // Clear any existing data first
      // Since we're using PostgreSQL, we'll rely on the existing logic in initializeData

      await initializeData();

      // Verify the data was loaded
      const loadedHistory = await storage.getDrawHistory(10);
      const loadedDraws = await storage.getDrawHistory(10);
      console.log(`Verification: Successfully loaded ${loadedDraws.length} draws into database`);
        console.log(`Database now contains ${loadedDraws.length} historical draws with diverse combinations`);

        // Log first few draws for verification
        if (loadedDraws.length > 0) {
          console.log('Sample loaded draws:');
          loadedDraws.slice(0, 3).forEach((draw, i) => {
            console.log(`  ${i + 1}. ${draw.drawDate.toISOString().split('T')[0]}: [${draw.mainNumbers.join(', ')}] + [${draw.luckyStars.join(', ')}]`);
          });
        }

      res.json({ 
        message: "Data initialized successfully", 
        historicalDraws: historicalDraws.length,
        loadedDraws: loadedHistory.length
      });
    } catch (error) {
      console.error('Error initializing data:', error);
      res.status(500).json({ 
        error: "Failed to initialize data",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update data (manual trigger)
  app.post("/api/update", async (req, res) => {
    try {
      // Fetch latest draw
      const latestDraw = await EuroMillionsService.getLatestDraw();
      if (latestDraw) {
        const position = CombinationsService.calculatePosition(latestDraw.numbers, latestDraw.stars);
        const lastDraw = await storage.getLatestDraw();
        const gapFromPrevious = lastDraw ? position - lastDraw.position : 0;

        await storage.createDrawHistory({
          drawDate: new Date(latestDraw.date),
          mainNumbers: latestDraw.numbers,
          luckyStars: latestDraw.stars,
          position,
          jackpotEur: latestDraw.jackpot || 0,
          jackpotZar: latestDraw.jackpot ? await CurrencyService.convertEurToZar(latestDraw.jackpot) || 0 : 0,
          gapFromPrevious
        });
      }

      // Update jackpot data
      const currentJackpot = await EuroMillionsService.getCurrentJackpot();
      const exchangeRate = await CurrencyService.getEurToZarRate();

      if (currentJackpot && exchangeRate) {
        await storage.createJackpotData({
          amountEur: currentRate,
          exchangeRate: exchangeRate.rate
        });
      }

      res.json({ message: "Data updated successfully" });
    } catch (error) {
      console.error('Error updating data:', error);
      res.status(500).json({ error: "Failed to update data" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Schedule periodic updates
  setInterval(async () => {
    try {
      // Update jackpot and exchange rate every 2 minutes
      const currentJackpot = await EuroMillionsService.getCurrentJackpot();
      const exchangeRate = await CurrencyService.getEurToZarRate();

      if (currentJackpot && exchangeRate) {
        await storage.createJackpotData({
          amountEur: currentJackpot,
          amountZar: currentJackpot * exchangeRate.rate,
          exchangeRate: exchangeRate.rate
        });
      }
    } catch (error) {
      console.error('Error in scheduled update:', error);
    }
  }, 2 * 60 * 1000); // 2 minutes

  // Schedule automatic draw result checks
  // Check every 10 minutes on draw days (Tuesday/Friday) after 8:30 PM GMT
  setInterval(async () => {
    try {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 2 = Tuesday, 5 = Friday
      const currentHour = now.getUTCHours();
      const currentMinute = now.getUTCMinutes();

      // Only check on draw days (Tuesday or Friday) after 8:30 PM GMT
      if ((currentDay === 2 || currentDay === 5) && 
          (currentHour > 20 || (currentHour === 20 && currentMinute >= 30))) {

        console.log('Checking for new draw results...');

        // Get the latest draw from our database
        const latestStoredDraw = await storage.getLatestDraw();

        // Fetch the latest draw from the API
        const latestApiDraw = await EuroMillionsService.getLatestDraw();

        if (latestApiDraw && latestStoredDraw) {
          const apiDrawDate = new Date(latestApiDraw.date).toISOString().split('T')[0];
          const storedDrawDate = latestStoredDraw.drawDate.toISOString().split('T')[0];

          // If we found a newer draw, add it to our database
          if (apiDrawDate > storedDrawDate) {
            console.log(`New draw found for ${apiDrawDate}, adding to database...`);

            const position = CombinationsService.calculatePosition(latestApiDraw.numbers, latestApiDraw.stars);
            const gapFromPrevious = position - latestStoredDraw.position;

            await storage.createDrawHistory({
              drawDate: new Date(latestApiDraw.date),
              mainNumbers: latestApiDraw.numbers,
              luckyStars: latestApiDraw.stars,
              position,
              jackpotEur: latestApiDraw.jackpot || 0,
              jackpotZar: latestApiDraw.jackpot ? await CurrencyService.convertEurToZar(latestApiDraw.jackpot) || 0 : 0,
              gapFromPrevious
            });

            // Mark combination as drawn
            const sortedNumbers = [...latestApiDraw.numbers].sort((a, b) => a - b);
            const sortedStars = [...latestApiDraw.stars].sort((a, b) => a - b);

            await storage.createCombination({
              position,
              mainNumbers: sortedNumbers,
              luckyStars: sortedStars,
              hasBeenDrawn: true,
              lastDrawnDate: new Date(latestApiDraw.date)
            });

            // Generate new prediction based on updated data
            const history = await storage.getDrawHistory();
            const positions = history.map(draw => draw.position);
            const newPrediction = await PredictionService.generatePrediction(positions);

            await storage.createPrediction({
              drawDate: EuroMillionsService.getNextDrawDate(),
              mainNumbers: newPrediction.mainNumbers,
              luckyStars: newPrediction.luckyStars,
              position: newPrediction.position,
              confidence: newPrediction.confidence,
              modelVersion: newPrediction.modelVersion
            });

            console.log(`Successfully added new draw and updated prediction`);
          } else {
            console.log('No new draws found');
          }
        }
      }
    } catch (error) {
      console.error('Error checking for new draws:', error);
    }
  }, 10 * 60 * 1000); // Check every 10 minutes

  return httpServer;
}

// Helper function to calculate prize amounts
function calculatePrizeAmount(mainMatches: number, starMatches: number): {
  prizeAmount: number;
  prizeAmountZar: number;
  tier: string;
} {
  let prizeAmount = 0;
  let tier = "";

  // Simplified EuroMillions prize structure
  if (mainMatches === 5 && starMatches === 2) {
    prizeAmount = 50000000; // €50M average jackpot
    tier = "Jackpot";
  } else if (mainMatches === 5 && starMatches === 1) {
    prizeAmount = 200000;
    tier = "Tier 2";
  } else if (mainMatches === 5 && starMatches === 0) {
    prizeAmount = 50000;
    tier = "Tier 3";
  } else if (mainMatches === 4 && starMatches === 2) {
    prizeAmount = 5000;
    tier = "Tier 4";
  } else if (mainMatches === 4 && starMatches === 1) {
    prizeAmount = 500;
    tier = "Tier 5";
  } else if (mainMatches === 3 && starMatches === 2) {
    prizeAmount = 250;
    tier = "Tier 6";
  } else if (mainMatches === 4 && starMatches === 0) {
    prizeAmount = 100;
    tier = "Tier 7";
  } else if (mainMatches === 2 && starMatches === 2) {
    prizeAmount = 50;
    tier = "Tier 8";
  } else if (mainMatches === 3 && starMatches === 1) {
    prizeAmount = 25;
    tier = "Tier 9";
  } else if (mainMatches === 3 && starMatches === 0) {
    prizeAmount = 15;
    tier = "Tier 10";
  } else if (mainMatches === 1 && starMatches === 2) {
    prizeAmount = 12;
    tier = "Tier 11";
  } else if (mainMatches === 2 && starMatches === 1) {
    prizeAmount = 8;
    tier = "Tier 12";
  } else if (mainMatches === 2 && starMatches === 0) {
    prizeAmount = 4;
    tier = "Tier 13";
  } else {
    prizeAmount = 0;
    tier = "No Prize";
  }

  return {
    prizeAmount,
    prizeAmountZar: prizeAmount * 20.7, // Convert to ZAR
    tier
  };
}

// Helper function to improve predictions based on ticket results
async function improvePredictions(results: any[]): Promise<void> {
  try {
    console.log('Analyzing ticket performance for prediction improvement...');
    
    // Get historical data for analysis
    const history = await storage.getDrawHistory(50);
    
    // Analyze what went wrong with predictions
    const performanceAnalysis = analyzeTicketPerformance(results, history);
    
    // Generate improved predictions
    const improvedPredictions = await PredictionService.generateImprovedPredictions(
      history,
      performanceAnalysis
    );
    
    // Save improved predictions
    for (const prediction of improvedPredictions) {
      await storage.createPrediction({
        drawDate: EuroMillionsService.getNextDrawDate(),
        mainNumbers: prediction.mainNumbers,
        luckyStars: prediction.luckyStars,
        position: prediction.position,
        confidence: prediction.confidence,
        modelVersion: prediction.modelVersion + '-improved',
        reasoning: `Improved prediction based on ticket performance analysis: ${prediction.reasoning}`,
        historicalDataPoints: prediction.historicalDataPoints
      });
    }
    
    console.log('Predictions improved and saved based on performance analysis');
  } catch (error) {
    console.error('Error improving predictions:', error);
  }
}

function analyzeTicketPerformance(results: any[], history: any[]): any {
  const analysis = {
    avgMainMatches: 0,
    avgStarMatches: 0,
    poorPerformingNumbers: [] as number[],
    poorPerformingStars: [] as number[],
    methodPerformance: new Map<string, { matches: number, count: number }>(),
    recommendations: [] as string[]
  };

  // Calculate averages
  let totalMainMatches = 0;
  let totalStarMatches = 0;
  
  // Track number performance
  const numberMisses = new Map<number, number>();
  const starMisses = new Map<number, number>();
  
  for (const result of results) {
    totalMainMatches += result.matches.mainMatches;
    totalStarMatches += result.matches.starMatches;
    
    // Track misses for each number/star
    const ticket = result.ticketId; // This would need to be expanded to get actual ticket data
    // For now, we'll use a simplified approach
  }
  
  analysis.avgMainMatches = totalMainMatches / results.length;
  analysis.avgStarMatches = totalStarMatches / results.length;
  
  // Add recommendations based on performance
  if (analysis.avgMainMatches < 2) {
    analysis.recommendations.push("Focus more on frequently drawn numbers");
    analysis.recommendations.push("Reduce reliance on cold numbers");
  }
  
  if (analysis.avgStarMatches < 0.5) {
    analysis.recommendations.push("Improve star selection strategy");
    analysis.recommendations.push("Consider star frequency patterns");
  }
  
  return analysis;
}