import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const euroMillionsCombinations = pgTable("euromillions_combinations", {
  id: serial("id").primaryKey(),
  position: integer("position").notNull().unique(),
  mainNumbers: jsonb("main_numbers").$type<number[]>().notNull(),
  luckyStars: jsonb("lucky_stars").$type<number[]>().notNull(),
  hasBeenDrawn: boolean("has_been_drawn").default(false),
  lastDrawnDate: timestamp("last_drawn_date"),
});

export const drawHistory = pgTable("draw_history", {
  id: serial("id").primaryKey(),
  drawDate: timestamp("draw_date").notNull(),
  mainNumbers: jsonb("main_numbers").$type<number[]>().notNull(),
  luckyStars: jsonb("lucky_stars").$type<number[]>().notNull(),
  position: integer("position").notNull(),
  jackpotEur: real("jackpot_eur"),
  jackpotZar: real("jackpot_zar"),
  gapFromPrevious: integer("gap_from_previous"),
});

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  drawDate: timestamp("draw_date").notNull(),
  mainNumbers: jsonb("main_numbers").$type<number[]>().notNull(),
  luckyStars: jsonb("lucky_stars").$type<number[]>().notNull(),
  position: integer("position").notNull(),
  confidence: real("confidence").notNull(),
  modelVersion: text("model_version").notNull(),
  reasoning: text("reasoning"),
  historicalDataPoints: integer("historical_data_points"),
  wasCorrect: boolean("was_correct"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jackpotData = pgTable("jackpot_data", {
  id: serial("id").primaryKey(),
  amountEur: real("amount_eur").notNull(),
  amountZar: real("amount_zar").notNull(),
  exchangeRate: real("exchange_rate").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  mainNumbers: jsonb("main_numbers").$type<number[]>().notNull(),
  luckyStars: jsonb("lucky_stars").$type<number[]>().notNull(),
  predictionMethod: text("prediction_method").notNull(),
  confidence: real("confidence").notNull(),
  drawDate: timestamp("draw_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  // Result tracking
  wasChecked: boolean("was_checked").default(false),
  mainMatches: integer("main_matches"),
  starMatches: integer("star_matches"),
  totalMatches: integer("total_matches"),
  prizeAmount: real("prize_amount"),
  prizeAmountZar: real("prize_amount_zar"),
  prizeTier: text("prize_tier"),
});

export const prizeBreakdown = pgTable("prize_breakdown", {
  id: serial("id").primaryKey(),
  drawDate: timestamp("draw_date").notNull(),
  tier: text("tier").notNull(),
  description: text("description").notNull(),
  winners: integer("winners").notNull(),
  prizeEur: real("prize_eur").notNull(),
  prizeZar: real("prize_zar").notNull(),
  exchangeRate: real("exchange_rate").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCombinationSchema = createInsertSchema(euroMillionsCombinations).omit({
  id: true,
});

export const insertDrawHistorySchema = createInsertSchema(drawHistory).omit({
  id: true,
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({
  id: true,
});

export const insertJackpotDataSchema = z.object({
  amountEur: z.number().positive(),
  amountZar: z.number().positive(),
  exchangeRate: z.number().positive(),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  wasChecked: true,
  mainMatches: true,
  starMatches: true,
  totalMatches: true,
  prizeAmount: true,
  prizeAmountZar: true,
  prizeTier: true,
});

export const insertPrizeBreakdownSchema = createInsertSchema(prizeBreakdown).omit({
  id: true,
});

export type User = typeof users.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type PrizeBreakdown = typeof prizeBreakdown.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type InsertPrizeBreakdown = z.infer<typeof insertPrizeBreakdownSchema>;
export type EuroMillionsCombination = typeof euroMillionsCombinations.$inferSelect;
export type InsertEuroMillionsCombination = z.infer<typeof insertCombinationSchema>;
export type DrawHistory = typeof drawHistory.$inferSelect;
export type InsertDrawHistory = z.infer<typeof insertDrawHistorySchema>;
export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type JackpotData = typeof jackpotData.$inferSelect;
export type InsertJackpotData = z.infer<typeof insertJackpotDataSchema>;