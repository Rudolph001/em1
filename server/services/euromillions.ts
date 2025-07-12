export interface EuroMillionsDrawResult {
  date: string;
  numbers: number[];
  stars: number[];
  jackpot?: number;
}

export class EuroMillionsService {
  private static readonly API_BASE_URL = 'https://euromillions.api.pedromealha.dev/v1';
  
  /**
   * Fetch the latest EuroMillions draw result
   */
  static async getLatestDraw(): Promise<EuroMillionsDrawResult | null> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/draws/latest`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        date: data.date,
        numbers: data.numbers.sort((a: number, b: number) => a - b),
        stars: data.stars.sort((a: number, b: number) => a - b),
        jackpot: data.jackpot
      };
    } catch (error) {
      console.error('Error fetching latest draw:', error);
      return null;
    }
  }
  
  /**
   * Fetch historical EuroMillions draws
   */
  static async getHistoricalDraws(limit: number = 100): Promise<EuroMillionsDrawResult[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/draws?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.map((draw: any) => ({
        date: draw.date,
        numbers: draw.numbers.sort((a: number, b: number) => a - b),
        stars: draw.stars.sort((a: number, b: number) => a - b),
        jackpot: draw.jackpot
      }));
    } catch (error) {
      console.error('Error fetching historical draws:', error);
      return [];
    }
  }
  
  /**
   * Fetch draws by date range
   */
  static async getDrawsByDateRange(fromDate: string, toDate: string): Promise<EuroMillionsDrawResult[]> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/draws?from=${fromDate}&to=${toDate}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.map((draw: any) => ({
        date: draw.date,
        numbers: draw.numbers.sort((a: number, b: number) => a - b),
        stars: draw.stars.sort((a: number, b: number) => a - b),
        jackpot: draw.jackpot
      }));
    } catch (error) {
      console.error('Error fetching draws by date range:', error);
      return [];
    }
  }
  
  /**
   * Get next draw date and time
   */
  static getNextDrawDate(): Date {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // EuroMillions draws are on Tuesday (2) and Friday (5) at 8:15 PM GMT
    let nextDrawDate = new Date(now);
    
    if (currentDay === 0 || currentDay === 1) {
      // Sunday or Monday - next draw is Tuesday
      nextDrawDate.setDate(now.getDate() + (2 - currentDay));
    } else if (currentDay === 2) {
      // Tuesday - check if it's before 8:15 PM
      nextDrawDate.setHours(20, 15, 0, 0);
      if (now > nextDrawDate) {
        // After 8:15 PM Tuesday, next draw is Friday
        nextDrawDate.setDate(now.getDate() + 3);
      }
    } else if (currentDay === 3 || currentDay === 4) {
      // Wednesday or Thursday - next draw is Friday
      nextDrawDate.setDate(now.getDate() + (5 - currentDay));
    } else if (currentDay === 5) {
      // Friday - check if it's before 8:15 PM
      nextDrawDate.setHours(20, 15, 0, 0);
      if (now > nextDrawDate) {
        // After 8:15 PM Friday, next draw is Tuesday
        nextDrawDate.setDate(now.getDate() + 4);
      }
    } else {
      // Saturday - next draw is Tuesday
      nextDrawDate.setDate(now.getDate() + 3);
    }
    
    nextDrawDate.setHours(20, 15, 0, 0); // 8:15 PM GMT
    return nextDrawDate;
  }
  
  /**
   * Get current estimated jackpot (this would need a real API endpoint)
   */
  static async getCurrentJackpot(): Promise<number | null> {
    try {
      // This is a placeholder - you'd need to find an API that provides current jackpot
      // For now, we'll return a mock value
      return 97000000; // €97M
    } catch (error) {
      console.error('Error fetching current jackpot:', error);
      return null;
    }
  }
}
