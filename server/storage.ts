import { users, euroMillionsCombinations, drawHistory, predictions, jackpotData, type User, type InsertUser, type EuroMillionsCombination, type InsertEuroMillionsCombination, type DrawHistory, type InsertDrawHistory, type Prediction, type InsertPrediction, type JackpotData, type InsertJackpotData } from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, gte, lte } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getCombinationByPosition(position: number): Promise<EuroMillionsCombination | undefined> {
    const [combination] = await db
      .select()
      .from(euroMillionsCombinations)
      .where(eq(euroMillionsCombinations.position, position));
    return combination || undefined;
  }

  async getCombinationByNumbers(mainNumbers: number[], luckyStars: number[]): Promise<EuroMillionsCombination | undefined> {
    const [combination] = await db
      .select()
      .from(euroMillionsCombinations)
      .where(eq(euroMillionsCombinations.mainNumbers, mainNumbers))
      .where(eq(euroMillionsCombinations.luckyStars, luckyStars));
    return combination || undefined;
  }

  async createCombination(combination: InsertEuroMillionsCombination): Promise<EuroMillionsCombination> {
    const [created] = await db
      .insert(euroMillionsCombinations)
      .values(combination)
      .returning();
    return created;
  }

  async updateCombination(position: number, updates: Partial<EuroMillionsCombination>): Promise<EuroMillionsCombination | undefined> {
    const [updated] = await db
      .update(euroMillionsCombinations)
      .set(updates)
      .where(eq(euroMillionsCombinations.position, position))
      .returning();
    return updated || undefined;
  }

  async getCombinationsRange(fromPosition: number, toPosition: number): Promise<EuroMillionsCombination[]> {
    return await db
      .select()
      .from(euroMillionsCombinations)
      .where(gte(euroMillionsCombinations.position, fromPosition))
      .where(lte(euroMillionsCombinations.position, toPosition))
      .limit(1000);
  }

  async getAllCombinations(): Promise<EuroMillionsCombination[]> {
    return await db.select().from(euroMillionsCombinations);
  }

  async getDrawHistory(limit?: number): Promise<DrawHistory[]> {
    const query = db
      .select()
      .from(drawHistory)
      .orderBy(desc(drawHistory.drawDate));
    
    if (limit) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  async getDrawByDate(date: Date): Promise<DrawHistory | undefined> {
    const [draw] = await db
      .select()
      .from(drawHistory)
      .where(eq(drawHistory.drawDate, date));
    return draw || undefined;
  }

  async createDrawHistory(draw: InsertDrawHistory): Promise<DrawHistory> {
    const [created] = await db
      .insert(drawHistory)
      .values(draw)
      .returning();
    return created;
  }

  async getLatestDraw(): Promise<DrawHistory | undefined> {
    const [draw] = await db
      .select()
      .from(drawHistory)
      .orderBy(desc(drawHistory.drawDate))
      .limit(1);
    return draw || undefined;
  }

  async getPredictions(limit?: number): Promise<Prediction[]> {
    const query = db
      .select()
      .from(predictions)
      .orderBy(desc(predictions.createdAt));
    
    if (limit) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const [created] = await db
      .insert(predictions)
      .values(prediction)
      .returning();
    return created;
  }

  async updatePrediction(id: number, updates: Partial<Prediction>): Promise<Prediction | undefined> {
    const [updated] = await db
      .update(predictions)
      .set(updates)
      .where(eq(predictions.id, id))
      .returning();
    return updated || undefined;
  }

  async getLatestPrediction(): Promise<Prediction | undefined> {
    const [prediction] = await db
      .select()
      .from(predictions)
      .orderBy(desc(predictions.createdAt))
      .limit(1);
    return prediction || undefined;
  }

  async getLatestJackpotData(): Promise<JackpotData | undefined> {
    const [jackpot] = await db
      .select()
      .from(jackpotData)
      .orderBy(desc(jackpotData.updatedAt))
      .limit(1);
    return jackpot || undefined;
  }

  async createJackpotData(jackpot: InsertJackpotData): Promise<JackpotData> {
    const [created] = await db
      .insert(jackpotData)
      .values(jackpot)
      .returning();
    return created;
  }

  async getStats(): Promise<{
    totalCombinations: number;
    drawnCombinations: number;
    neverDrawnCombinations: number;
    predictionAccuracy: number;
  }> {
    const totalCombinations = 139838160;
    const drawnCombinations = (await db.select().from(drawHistory)).length;
    const neverDrawnCombinations = totalCombinations - drawnCombinations;
    
    return {
      totalCombinations,
      drawnCombinations,
      neverDrawnCombinations,
      predictionAccuracy: 0.8 // Placeholder for now
    };
  }
}

export const storage = new DatabaseStorage();