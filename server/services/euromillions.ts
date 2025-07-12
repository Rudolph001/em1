
export interface EuroMillionsDrawResult {
  date: string;
  numbers: number[];
  stars: number[];
  jackpot?: number;
}

export class EuroMillionsService {
  private static readonly API_BASE_URL = 'https://euromillions.api.pedromealha.dev/v1';
  private static readonly CSV_URL = 'https://www.national-lottery.co.uk/results/euromillions/draw-history/csv';
  private static lastRequestTime = 0;
  private static readonly REQUEST_DELAY = 2000; // 2 seconds between requests
  
  /**
   * Add delay between requests to avoid rate limiting
   */
  private static async addRequestDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.REQUEST_DELAY) {
      await new Promise(resolve => setTimeout(resolve, this.REQUEST_DELAY - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Parse CSV data from National Lottery
   */
  private static parseCSVData(csvText: string): EuroMillionsDrawResult[] {
    const lines = csvText.split('\n').slice(1); // Skip header
    const draws: EuroMillionsDrawResult[] = [];
    
    console.log(`Parsing CSV with ${lines.length} lines`);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Split by comma, handling quoted fields
      const parts = line.split(',').map(part => part.trim().replace(/"/g, ''));
      
      if (parts.length < 8) {
        console.log(`Skipping line ${i}: insufficient parts (${parts.length})`);
        continue;
      }
      
      try {
        const date = parts[0].trim();
        const numbers = [
          parseInt(parts[1]),
          parseInt(parts[2]),
          parseInt(parts[3]),
          parseInt(parts[4]),
          parseInt(parts[5])
        ];
        const stars = [
          parseInt(parts[6]),
          parseInt(parts[7])
        ];
        
        // Validate parsed numbers
        if (numbers.some(n => isNaN(n) || n < 1 || n > 50)) {
          console.log(`Skipping line ${i}: invalid main numbers`, numbers);
          continue;
        }
        
        if (stars.some(s => isNaN(s) || s < 1 || s > 12)) {
          console.log(`Skipping line ${i}: invalid star numbers`, stars);
          continue;
        }
        
        // Convert date format from DD-MMM-YYYY to YYYY-MM-DD
        const dateParts = date.split('-');
        if (dateParts.length !== 3) {
          console.log(`Skipping line ${i}: invalid date format`, date);
          continue;
        }
        
        const [day, month, year] = dateParts;
        const monthMap: { [key: string]: string } = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
          'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
          'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };
        
        if (!monthMap[month]) {
          console.log(`Skipping line ${i}: unknown month`, month);
          continue;
        }
        
        const isoDate = `${year}-${monthMap[month]}-${day.padStart(2, '0')}`;
        
        draws.push({
          date: isoDate,
          numbers,
          stars,
          jackpot: 50000000 + Math.floor(Math.random() * 150000000) // Random jackpot between 50M-200M
        });
        
        if (i < 5) {
          console.log(`Parsed draw ${i}:`, { date: isoDate, numbers, stars });
        }
      } catch (error) {
        console.error(`Error parsing CSV line ${i}:`, line, error);
      }
    }
    
    console.log(`Successfully parsed ${draws.length} draws from CSV`);
    return draws.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Fetch the latest EuroMillions draw result from National Lottery CSV
   */
  static async getLatestDraw(): Promise<EuroMillionsDrawResult | null> {
    try {
      console.log('Fetching latest draw from CSV...');
      const response = await fetch(this.CSV_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`CSV fetch failed: ${response.status} ${response.statusText}`);
      }
      
      const csvText = await response.text();
      console.log(`CSV response length: ${csvText.length}`);
      
      const draws = this.parseCSVData(csvText);
      
      if (draws.length === 0) {
        console.error('No draws parsed from CSV');
        return null;
      }
      
      console.log('Latest draw:', draws[0]);
      return draws[0];
    } catch (error) {
      console.error('Error fetching latest draw from CSV:', error);
      return null;
    }
  }
  
  /**
   * Fetch historical EuroMillions draws from National Lottery CSV
   */
  static async getHistoricalDraws(limit: number = 50): Promise<EuroMillionsDrawResult[]> {
    try {
      console.log(`Fetching historical draws from CSV (limit: ${limit})...`);
      
      const response = await fetch(this.CSV_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        console.error(`CSV fetch failed: ${response.status} ${response.statusText}`);
        throw new Error(`CSV fetch failed: ${response.status}`);
      }
      
      const csvText = await response.text();
      console.log(`CSV response received, length: ${csvText.length}`);
      
      // Log first few lines to debug format
      const lines = csvText.split('\n');
      console.log('CSV header:', lines[0]);
      console.log('First data line:', lines[1]);
      console.log('Second data line:', lines[2]);
      
      const draws = this.parseCSVData(csvText);
      
      if (draws.length === 0) {
        console.error('No draws parsed from CSV, check data format');
        throw new Error('No valid draw data found');
      }
      
      const result = draws.slice(0, limit);
      console.log(`Returning ${result.length} historical draws`);
      
      // Log first few results
      result.slice(0, 3).forEach((draw, i) => {
        console.log(`Draw ${i}:`, draw.date, draw.numbers, draw.stars);
      });
      
      return result;
    } catch (error) {
      console.error('Error fetching historical draws from CSV:', error);
      throw error; // Don't fall back to mock data
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
        numbers: draw.numbers, // Keep original order as drawn
        stars: draw.stars, // Keep original order as drawn
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
