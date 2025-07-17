import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { User, InsertUser, EuroMillionsCombination, InsertEuroMillionsCombination, DrawHistory, InsertDrawHistory, Prediction, InsertPrediction, JackpotData, InsertJackpotData } from "@shared/schema";

const DATA_DIR = join(process.cwd(), 'data');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

interface JsonData {
  users: User[];
  combinations: EuroMillionsCombination[];
  drawHistory: DrawHistory[];
  predictions: Prediction[];
  jackpotData: JackpotData[];
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Combination methods
  getCombinationByPosition(position: number): Promise<EuroMillionsCombination | undefined>;
  getCombinationByNumbers(mainNumbers: number[], luckyStars: number[]): Promise<EuroMillionsCombination | undefined>;
  createCombination(combination: InsertEuroMillionsCombination): Promise<EuroMillionsCombination>;
  updateCombination(position: number, updates: Partial<EuroMillionsCombination>): Promise<EuroMillionsCombination | undefined>;
  getCombinationsRange(fromPosition: number, toPosition: number): Promise<EuroMillionsCombination[]>;
  getAllCombinations(): Promise<EuroMillionsCombination[]>;

  // Draw history methods
  getDrawHistory(limit?: number): Promise<DrawHistory[]>;
  getDrawByDate(date: Date): Promise<DrawHistory | undefined>;
  createDrawHistory(draw: InsertDrawHistory): Promise<DrawHistory>;
  getLatestDraw(): Promise<DrawHistory | undefined>;

  // Prediction methods
  getPredictions(limit?: number): Promise<Prediction[]>;
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  updatePrediction(id: number, updates: Partial<Prediction>): Promise<Prediction | undefined>;
  getLatestPrediction(): Promise<Prediction | undefined>;

  // Jackpot data methods
  getLatestJackpotData(): Promise<JackpotData | undefined>;
  createJackpotData(jackpot: InsertJackpotData): Promise<JackpotData>;

  // Statistics methods
  getStats(): Promise<{
    totalCombinations: number;
    drawnCombinations: number;
    neverDrawnCombinations: number;
    predictionAccuracy: number;
  }>;
}

export class JsonStorage implements IStorage {
  private dataFile = join(DATA_DIR, 'storage.json');
  private nextUserId = 1;
  private nextPredictionId = 1;

  private loadData(): JsonData {
    if (!existsSync(this.dataFile)) {
      const emptyData: JsonData = {
        users: [],
        combinations: [],
        drawHistory: [],
        predictions: [],
        jackpotData: []
      };
      this.saveData(emptyData);
      return emptyData;
    }

    try {
      const rawData = readFileSync(this.dataFile, 'utf-8');
      const data = JSON.parse(rawData);
      
      // Convert date strings back to Date objects
      data.drawHistory = data.drawHistory.map((draw: any) => ({
        ...draw,
        drawDate: new Date(draw.drawDate)
      }));
      
      data.predictions = data.predictions.map((pred: any) => ({
        ...pred,
        createdAt: new Date(pred.createdAt)
      }));
      
      data.jackpotData = data.jackpotData.map((jackpot: any) => ({
        ...jackpot,
        updatedAt: new Date(jackpot.updatedAt)
      }));

      // Update next IDs
      if (data.users.length > 0) {
        this.nextUserId = Math.max(...data.users.map((u: User) => u.id)) + 1;
      }
      if (data.predictions.length > 0) {
        this.nextPredictionId = Math.max(...data.predictions.map((p: Prediction) => p.id)) + 1;
      }

      return data;
    } catch (error) {
      console.error('Error loading JSON data:', error);
      const emptyData: JsonData = {
        users: [],
        combinations: [],
        drawHistory: [],
        predictions: [],
        jackpotData: []
      };
      return emptyData;
    }
  }

  private saveData(data: JsonData): void {
    try {
      writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving JSON data:', error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const data = this.loadData();
    return data.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const data = this.loadData();
    return data.users.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const data = this.loadData();
    const user: User = {
      id: this.nextUserId++,
      ...insertUser
    };
    data.users.push(user);
    this.saveData(data);
    return user;
  }

  async getCombinationByPosition(position: number): Promise<EuroMillionsCombination | undefined> {
    const data = this.loadData();
    return data.combinations.find(combo => combo.position === position);
  }

  async getCombinationByNumbers(mainNumbers: number[], luckyStars: number[]): Promise<EuroMillionsCombination | undefined> {
    const data = this.loadData();
    return data.combinations.find(combo => 
      JSON.stringify(combo.mainNumbers.sort()) === JSON.stringify(mainNumbers.sort()) &&
      JSON.stringify(combo.luckyStars.sort()) === JSON.stringify(luckyStars.sort())
    );
  }

  async createCombination(combination: InsertEuroMillionsCombination): Promise<EuroMillionsCombination> {
    const data = this.loadData();
    const newCombination: EuroMillionsCombination = {
      ...combination
    };
    data.combinations.push(newCombination);
    this.saveData(data);
    return newCombination;
  }

  async updateCombination(position: number, updates: Partial<EuroMillionsCombination>): Promise<EuroMillionsCombination | undefined> {
    const data = this.loadData();
    const index = data.combinations.findIndex(combo => combo.position === position);
    if (index === -1) return undefined;
    
    data.combinations[index] = { ...data.combinations[index], ...updates };
    this.saveData(data);
    return data.combinations[index];
  }

  async getCombinationsRange(fromPosition: number, toPosition: number): Promise<EuroMillionsCombination[]> {
    const data = this.loadData();
    return data.combinations
      .filter(combo => combo.position >= fromPosition && combo.position <= toPosition)
      .slice(0, 1000);
  }

  async getAllCombinations(): Promise<EuroMillionsCombination[]> {
    const data = this.loadData();
    return data.combinations;
  }

  async getDrawHistory(limit?: number): Promise<DrawHistory[]> {
    const data = this.loadData();
    const sorted = data.drawHistory.sort((a, b) => b.drawDate.getTime() - a.drawDate.getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }

  async getDrawByDate(date: Date): Promise<DrawHistory | undefined> {
    const data = this.loadData();
    return data.drawHistory.find(draw => 
      draw.drawDate.toISOString().split('T')[0] === date.toISOString().split('T')[0]
    );
  }

  async createDrawHistory(draw: InsertDrawHistory): Promise<DrawHistory> {
    const data = this.loadData();
    
    // Check if draw already exists for this date
    const existingDraw = await this.getDrawByDate(draw.drawDate);
    if (existingDraw) {
      return existingDraw;
    }
    
    const newDraw: DrawHistory = {
      id: data.drawHistory.length + 1,
      ...draw
    };
    data.drawHistory.push(newDraw);
    this.saveData(data);
    return newDraw;
  }

  async getLatestDraw(): Promise<DrawHistory | undefined> {
    const data = this.loadData();
    if (data.drawHistory.length === 0) return undefined;
    return data.drawHistory.sort((a, b) => b.drawDate.getTime() - a.drawDate.getTime())[0];
  }

  async getPredictions(limit?: number): Promise<Prediction[]> {
    const data = this.loadData();
    const sorted = data.predictions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }

  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const data = this.loadData();
    const newPrediction: Prediction = {
      id: this.nextPredictionId++,
      ...prediction,
      createdAt: new Date()
    };
    data.predictions.push(newPrediction);
    this.saveData(data);
    return newPrediction;
  }

  async updatePrediction(id: number, updates: Partial<Prediction>): Promise<Prediction | undefined> {
    const data = this.loadData();
    const index = data.predictions.findIndex(pred => pred.id === id);
    if (index === -1) return undefined;
    
    data.predictions[index] = { ...data.predictions[index], ...updates };
    this.saveData(data);
    return data.predictions[index];
  }

  async getLatestPrediction(): Promise<Prediction | undefined> {
    const data = this.loadData();
    if (data.predictions.length === 0) return undefined;
    return data.predictions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  async getLatestJackpotData(): Promise<JackpotData | undefined> {
    const data = this.loadData();
    if (data.jackpotData.length === 0) return undefined;
    return data.jackpotData.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
  }

  async createJackpotData(jackpot: InsertJackpotData): Promise<JackpotData> {
    const data = this.loadData();
    const newJackpot: JackpotData = {
      id: data.jackpotData.length + 1,
      ...jackpot,
      updatedAt: new Date()
    };
    data.jackpotData.push(newJackpot);
    this.saveData(data);
    return newJackpot;
  }

  async getStats(): Promise<{
    totalCombinations: number;
    drawnCombinations: number;
    neverDrawnCombinations: number;
    predictionAccuracy: number;
  }> {
    const data = this.loadData();
    const totalCombinations = 139838160; // Total possible EuroMillions combinations
    const drawnCombinations = data.combinations.filter(combo => combo.hasBeenDrawn).length;
    const neverDrawnCombinations = totalCombinations - drawnCombinations;
    
    // Calculate prediction accuracy based on predictions that have been verified
    const verifiedPredictions = data.predictions.filter(pred => pred.isVerified);
    const correctPredictions = verifiedPredictions.filter(pred => pred.isCorrect);
    const predictionAccuracy = verifiedPredictions.length > 0 
      ? correctPredictions.length / verifiedPredictions.length 
      : 0;

    return {
      totalCombinations,
      drawnCombinations,
      neverDrawnCombinations,
      predictionAccuracy
    };
  }
}

export const storage = new JsonStorage();