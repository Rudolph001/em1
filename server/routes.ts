import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { EuroMillionsService } from "./services/euromillions";
import { CurrencyService } from "./services/currency";
import { PredictionService } from "./services/prediction";
import { CombinationsService } from "./services/combinations";
import { insertDrawHistorySchema, insertPredictionSchema, insertJackpotDataSchema } from "@shared/schema";

let dataInitialized = false;

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize data on first request
  async function initializeData() {
    if (dataInitialized) return;
    
    try {
      console.log('Initializing EuroMillions data...');
      
      // Fetch historical draws
      const historicalDraws = await EuroMillionsService.getHistoricalDraws(100);
      
      let previousPosition = 0;
      for (const draw of historicalDraws) {
        // Store draw history with original order as drawn
        const sortedNumbers = [...draw.numbers].sort((a, b) => a - b);
        const sortedStars = [...draw.stars].sort((a, b) => a - b);
        const position = CombinationsService.calculatePosition(sortedNumbers, sortedStars);
        const gapFromPrevious = previousPosition > 0 ? position - previousPosition : 0;
        
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
      }
      
      // Generate initial prediction
      const positions = historicalDraws.map(draw => 
        CombinationsService.calculatePosition(draw.numbers, draw.stars)
      );
      
      const prediction = await PredictionService.generatePrediction(positions);
      await storage.createPrediction({
        drawDate: EuroMillionsService.getNextDrawDate(),
        mainNumbers: prediction.mainNumbers,
        luckyStars: prediction.luckyStars,
        position: prediction.position,
        confidence: prediction.confidence,
        modelVersion: prediction.modelVersion
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
      const jackpotData = await storage.getLatestJackpotData();
      
      if (!jackpotData) {
        return res.status(404).json({ error: "No jackpot data available" });
      }
      
      res.json(jackpotData);
    } catch (error) {
      console.error('Error fetching jackpot:', error);
      res.status(500).json({ error: "Failed to fetch jackpot data" });
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
  
  // Get current prediction
  app.get("/api/prediction", async (req, res) => {
    try {
      await initializeData();
      const prediction = await storage.getLatestPrediction();
      
      if (!prediction) {
        return res.status(404).json({ error: "No prediction available" });
      }
      
      res.json(prediction);
    } catch (error) {
      console.error('Error fetching prediction:', error);
      res.status(500).json({ error: "Failed to fetch prediction" });
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
      
      const numberFrequency = new Map<number, number>();
      const starFrequency = new Map<number, number>();
      
      history.forEach(draw => {
        draw.mainNumbers.forEach(num => {
          numberFrequency.set(num, (numberFrequency.get(num) || 0) + 1);
        });
        draw.luckyStars.forEach(star => {
          starFrequency.set(star, (starFrequency.get(star) || 0) + 1);
        });
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
  
  return httpServer;
}
