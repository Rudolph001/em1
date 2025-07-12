import { 
  users, 
  euroMillionsCombinations, 
  drawHistory, 
  predictions, 
  jackpotData,
  type User, 
  type InsertUser,
  type EuroMillionsCombination,
  type InsertEuroMillionsCombination,
  type DrawHistory,
  type InsertDrawHistory,
  type Prediction,
  type InsertPrediction,
  type JackpotData,
  type InsertJackpotData
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private combinations: Map<number, EuroMillionsCombination>;
  private drawHistoryMap: Map<number, DrawHistory>;
  private predictionsMap: Map<number, Prediction>;
  private jackpotDataMap: Map<number, JackpotData>;
  private currentUserId: number;
  private currentCombinationId: number;
  private currentDrawId: number;
  private currentPredictionId: number;
  private currentJackpotId: number;

  constructor() {
    this.users = new Map();
    this.combinations = new Map();
    this.drawHistoryMap = new Map();
    this.predictionsMap = new Map();
    this.jackpotDataMap = new Map();
    this.currentUserId = 1;
    this.currentCombinationId = 1;
    this.currentDrawId = 1;
    this.currentPredictionId = 1;
    this.currentJackpotId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCombinationByPosition(position: number): Promise<EuroMillionsCombination | undefined> {
    return Array.from(this.combinations.values()).find(combo => combo.position === position);
  }

  async getCombinationByNumbers(mainNumbers: number[], luckyStars: number[]): Promise<EuroMillionsCombination | undefined> {
    return Array.from(this.combinations.values()).find(combo => 
      JSON.stringify(combo.mainNumbers) === JSON.stringify(mainNumbers) &&
      JSON.stringify(combo.luckyStars) === JSON.stringify(luckyStars)
    );
  }

  async createCombination(insertCombination: InsertEuroMillionsCombination): Promise<EuroMillionsCombination> {
    const id = this.currentCombinationId++;
    const combination: EuroMillionsCombination = { 
      ...insertCombination, 
      id,
      mainNumbers: [...insertCombination.mainNumbers],
      luckyStars: [...insertCombination.luckyStars],
      hasBeenDrawn: insertCombination.hasBeenDrawn || false,
      lastDrawnDate: insertCombination.lastDrawnDate || null
    };
    this.combinations.set(id, combination);
    return combination;
  }

  async updateCombination(position: number, updates: Partial<EuroMillionsCombination>): Promise<EuroMillionsCombination | undefined> {
    const combination = await this.getCombinationByPosition(position);
    if (!combination) return undefined;

    const updated = { ...combination, ...updates };
    this.combinations.set(combination.id, updated);
    return updated;
  }

  async getCombinationsRange(fromPosition: number, toPosition: number): Promise<EuroMillionsCombination[]> {
    return Array.from(this.combinations.values())
      .filter(combo => combo.position >= fromPosition && combo.position <= toPosition)
      .sort((a, b) => a.position - b.position);
  }

  async getAllCombinations(): Promise<EuroMillionsCombination[]> {
    return Array.from(this.combinations.values()).sort((a, b) => a.position - b.position);
  }

  async getDrawHistory(limit?: number): Promise<DrawHistory[]> {
    const draws = Array.from(this.drawHistoryMap.values())
      .sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime());

    return limit ? draws.slice(0, limit) : draws;
  }

  async getDrawByDate(date: Date): Promise<DrawHistory | undefined> {
    return Array.from(this.drawHistoryMap.values())
      .find(draw => new Date(draw.drawDate).toDateString() === date.toDateString());
  }

  async createDrawHistory(insertDraw: InsertDrawHistory): Promise<DrawHistory> {
    const id = this.currentDrawId++;
    const draw: DrawHistory = { 
      ...insertDraw, 
      id,
      mainNumbers: [...insertDraw.mainNumbers],
      luckyStars: [...insertDraw.luckyStars],
      jackpotEur: insertDraw.jackpotEur || null,
      jackpotZar: insertDraw.jackpotZar || null,
      gapFromPrevious: insertDraw.gapFromPrevious || null
    };
    this.drawHistoryMap.set(id, draw);
    return draw;
  }

  async getLatestDraw(): Promise<DrawHistory | undefined> {
    const draws = await this.getDrawHistory(1);
    return draws[0];
  }

  async getPredictions(limit?: number): Promise<Prediction[]> {
    const predictions = Array.from(this.predictionsMap.values())
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return limit ? predictions.slice(0, limit) : predictions;
  }

  async createPrediction(insertPrediction: InsertPrediction): Promise<Prediction> {
    const id = this.currentPredictionId++;
    const prediction: Prediction = { 
      ...insertPrediction, 
      id,
      mainNumbers: [...insertPrediction.mainNumbers],
      luckyStars: [...insertPrediction.luckyStars],
      wasCorrect: null,
      createdAt: new Date()
    };
    this.predictionsMap.set(id, prediction);
    return prediction;
  }

  async updatePrediction(id: number, updates: Partial<Prediction>): Promise<Prediction | undefined> {
    const prediction = this.predictionsMap.get(id);
    if (!prediction) return undefined;

    const updated = { ...prediction, ...updates };
    this.predictionsMap.set(id, updated);
    return updated;
  }

  async getLatestPrediction(): Promise<Prediction | undefined> {
    const predictions = await this.getPredictions(1);
    return predictions[0];
  }

  async getLatestJackpotData(): Promise<JackpotData | undefined> {
    const jackpots = Array.from(this.jackpotDataMap.values())
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

    return jackpots[0];
  }

  async createJackpotData(insertJackpot: InsertJackpotData): Promise<JackpotData> {
    const id = this.currentJackpotId++;
    const jackpot: JackpotData = { 
      ...insertJackpot, 
      id,
      updatedAt: new Date()
    };
    this.jackpotDataMap.set(id, jackpot);
    return jackpot;
  }

  async getStats(): Promise<{
    totalCombinations: number;
    drawnCombinations: number;
    neverDrawnCombinations: number;
    predictionAccuracy: number;
  }> {
    const totalCombinations = this.combinations.size;
    const drawnCombinations = Array.from(this.combinations.values())
      .filter(combo => combo.hasBeenDrawn).length;
    const neverDrawnCombinations = totalCombinations - drawnCombinations;

    const predictions = Array.from(this.predictionsMap.values())
      .filter(pred => pred.wasCorrect !== null);
    const correctPredictions = predictions.filter(pred => pred.wasCorrect).length;
    const predictionAccuracy = predictions.length > 0 ? (correctPredictions / predictions.length) * 100 : 0;

    return {
      totalCombinations,
      drawnCombinations,
      neverDrawnCombinations,
      predictionAccuracy
    };
  }
}

export const storage = new MemStorage();