import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { EuroMillionsService } from "./services/euromillions";
import { CurrencyService } from "./services/currency";
import { PredictionService } from "./services/prediction";
import { CombinationsService } from "./services/combinations";
import { insertDrawHistorySchema, insertPredictionSchema, insertJackpotDataSchema } from "@shared/schema";

let dataInitialized = false;

// Reset initialization flag to force re-initialization
const resetDataInitialization = () => {
  dataInitialized = false;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize data on first request
  async function initializeData() {
    if (dataInitialized) return;
    
    try {
      console.log('Initializing EuroMillions data...');
      
      // Check if we already have sufficient data
      const existingHistory = await storage.getDrawHistory(50);
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
        
        if (uniqueNumberSets.size >= 10 && hasValidDates && hasRecentData) {
          console.log('Sufficient diverse data already exists, skipping initialization');
          dataInitialized = true;
          return;
        } else {
          console.log(`Existing data check: unique sets=${uniqueNumberSets.size}, valid dates=${hasValidDates}, recent data=${hasRecentData}`);
          console.log('Data appears insufficient or outdated, reinitializing...');
        }
      } else {
        console.log(`Only ${existingHistory.length} draws found, need at least 20 for initialization`);
      }
      
      // Fetch all available historical draws from real CSV data
      let historicalDraws;
      try {
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
      
      // Check if we already have this data to prevent re-initialization
      const existingDraws = await storage.getDrawHistory(uniqueDraws.length);
      if (existingDraws.length > 0) {
        // Check if the latest draw matches to avoid duplicate initialization
        const latestExisting = existingDraws[0];
        const latestNew = uniqueDraws[0];
        if (latestExisting.drawDate.toISOString().split('T')[0] === latestNew.date) {
          console.log('Data already up to date, skipping re-initialization');
          dataInitialized = true;
          return;
        }
      }
      
      const positions: number[] = [];
      let previousPosition = 0;
      
      for (const draw of uniqueDraws) {
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
      
      // Generate initial prediction
      const predictionPositions = historicalDraws.map(draw => 
        CombinationsService.calculatePosition(draw.numbers, draw.stars)
      );
      
      const prediction = await PredictionService.generatePrediction(predictionPositions);
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
  
  // Get application statistics
  app.get("/api/stats", async (req, res) => {
    try {
      await initializeData();
      const stats = await storage.getStats();
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
  
  // Get current prediction
  app.get("/api/prediction", async (req, res) => {
    try {
      await initializeData();
      let prediction = await storage.getLatestPrediction();
      
      // If no prediction exists or it's missing new fields, generate a new one
      if (!prediction || !prediction.reasoning || !prediction.historicalDataPoints) {
        const history = await storage.getDrawHistory();
        const positions = history.map(draw => draw.position);
        const newPrediction = await PredictionService.generatePrediction(positions);
        
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
      
      res.json(prediction);
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

  // Force data initialization for fresh local setups
  app.post("/api/initialize", async (req, res) => {
    try {
      console.log('Force initializing data for local setup...');
      
      // Always reset and initialize regardless of current state
      dataInitialized = false;
      
      // Get historical data
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
      console.log(`Verification: Loaded ${loadedHistory.length} draws into database`);
      
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
          amountEur: currentJackpot,
          amountZar: currentJackpot * exchangeRate.rate,
          exchangeRate: exchangeRate.rate
        });
      }
      
      res.json({ message: "Data updated successfully" });
    } catch (error) {
      console.error('Error updating data:', error);
      res.status(500).json({ error: "Failed to update data" });
    }
  });
  
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
