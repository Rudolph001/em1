import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function formatCurrency(amount: number, currency: 'EUR' | 'ZAR'): string {
  const symbol = currency === 'EUR' ? '€' : 'R';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function calculateTimeDifference(targetDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const difference = target - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

export function generateCombinationId(mainNumbers: number[], luckyStars: number[]): string {
  return `${mainNumbers.join('-')}_${luckyStars.join('-')}`;
}

export function parseCombinationId(id: string): { mainNumbers: number[]; luckyStars: number[] } | null {
  try {
    const [mainPart, starPart] = id.split('_');
    const mainNumbers = mainPart.split('-').map(Number);
    const luckyStars = starPart.split('-').map(Number);
    
    if (mainNumbers.length !== 5 || luckyStars.length !== 2) {
      return null;
    }
    
    return { mainNumbers, luckyStars };
  } catch {
    return null;
  }
}
