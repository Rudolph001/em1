export interface ExchangeRateResponse {
  rate: number;
  timestamp: Date;
}

export class CurrencyService {
  private static readonly API_URL = 'https://api.exchangerate-api.com/v4/latest/EUR';
  private static readonly FALLBACK_API_URL = 'https://api.fxaccess.com/latest/EUR';
  private static cachedRate: { rate: number; timestamp: number } | null = null;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly FALLBACK_RATE = 20.74; // Current EUR to ZAR rate as of July 17, 2025

  /**
   * Get EUR to ZAR exchange rate with caching and fallback
   */
  static async getEurToZarRate(): Promise<{ rate: number; updatedAt: Date } | null> {
    try {
      // Check cache first
      if (this.cachedRate && (Date.now() - this.cachedRate.timestamp) < this.CACHE_DURATION) {
        return {
          rate: this.cachedRate.rate,
          updatedAt: new Date(this.cachedRate.timestamp)
        };
      }

      // Try primary API
      let zarRate = await this.fetchFromPrimaryAPI();

      // If primary fails, try fallback API
      if (!zarRate) {
        zarRate = await this.fetchFromFallbackAPI();
      }

      // If both APIs fail, use cached rate or fallback rate
      if (!zarRate) {
        if (this.cachedRate) {
          console.warn('Using cached exchange rate due to API failures');
          return {
            rate: this.cachedRate.rate,
            updatedAt: new Date(this.cachedRate.timestamp)
          };
        } else {
          console.warn('Using fallback exchange rate due to API failures');
          zarRate = this.FALLBACK_RATE;
        }
      }

      // Cache the result
      this.cachedRate = {
        rate: zarRate,
        timestamp: Date.now()
      };

      return {
        rate: zarRate,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error in getEurToZarRate:', error);

      // Return cached rate if available, otherwise fallback rate
      if (this.cachedRate) {
        return {
          rate: this.cachedRate.rate,
          updatedAt: new Date(this.cachedRate.timestamp)
        };
      }

      return {
        rate: this.FALLBACK_RATE,
        updatedAt: new Date()
      };
    }
  }

  private static async fetchFromPrimaryAPI(): Promise<number | null> {
    try {
      const response = await fetch(this.API_URL, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'EuroMillions-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Primary API error: ${response.status}`);
      }

      const data = await response.json();
      const zarRate = data.rates?.ZAR;

      if (!zarRate || typeof zarRate !== 'number') {
        throw new Error('Invalid ZAR rate in primary API response');
      }

      console.log('Successfully fetched rate from primary API:', zarRate);
      return zarRate;
    } catch (error) {
      console.warn('Primary exchange rate API failed:', error);
      return null;
    }
  }

  private static async fetchFromFallbackAPI(): Promise<number | null> {
    try {
      const response = await fetch(this.FALLBACK_API_URL, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'EuroMillions-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Fallback API error: ${response.status}`);
      }

      const data = await response.json();
      const zarRate = data.rates?.ZAR;

      if (!zarRate || typeof zarRate !== 'number') {
        throw new Error('Invalid ZAR rate in fallback API response');
      }

      console.log('Successfully fetched rate from fallback API:', zarRate);
      return zarRate;
    } catch (error) {
      console.warn('Fallback exchange rate API failed:', error);
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