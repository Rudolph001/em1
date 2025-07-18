// Re-export from JSON storage implementation
export { storage, type IStorage } from './storage-json';

// Add ticket types to the interface
export interface ITicket {
  id: number;
  mainNumbers: number[];
  luckyStars: number[];
  predictionMethod: string;
  confidence: number;
  drawDate: Date;
  isActive: boolean;
  matches?: {
    mainMatches: number;
    starMatches: number;
    totalMatches: number;
    prizeAmount: number;
    prizeAmountZar: number;
    tier: string;
  };
  createdAt: Date;
}

export interface ITicketResult {
  id: number;
  ticketId: number;
  drawResult: {
    mainNumbers: number[];
    luckyStars: number[];
    drawDate: string;
  };
  matches: {
    mainMatches: number;
    starMatches: number;
    totalMatches: number;
    prizeAmount: number;
    prizeAmountZar: number;
    tier: string;
  };
  createdAt: Date;
}