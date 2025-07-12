export interface ExchangeRateResponse {
  rate: number;
  timestamp: Date;
}

export class CurrencyService {
  private static readonly API_BASE_URL = 'https://latest.currency-api.pages.dev/v1/currencies';
  
  /**
   * Get EUR to ZAR exchange rate
   */
  static async getEurToZarRate(): Promise<ExchangeRateResponse | null> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/eur.json`);
      
      if (!response.ok) {
        throw new Error(`Currency API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        rate: data.eur.zar,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching EUR to ZAR rate:', error);
      
      // Fallback to a backup API
      try {
        const fallbackResponse = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          return {
            rate: fallbackData.rates.ZAR,
            timestamp: new Date()
          };
        }
      } catch (fallbackError) {
        console.error('Fallback currency API also failed:', fallbackError);
      }
      
      return null;
    }
  }
  
  /**
   * Convert EUR to ZAR
   */
  static async convertEurToZar(eurAmount: number): Promise<number | null> {
    const rateData = await this.getEurToZarRate();
    if (!rateData) return null;
    
    return eurAmount * rateData.rate;
  }
  
  /**
   * Get formatted currency string
   */
  static formatCurrency(amount: number, currency: 'EUR' | 'ZAR'): string {
    const symbol = currency === 'EUR' ? '€' : 'R';
    
    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(1)}K`;
    } else {
      return `${symbol}${amount.toFixed(2)}`;
    }
  }
}
