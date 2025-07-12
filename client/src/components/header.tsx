import { useJackpot } from "@/hooks/use-jackpot";
import { useCountdown } from "@/hooks/use-countdown";
import { useExchangeRate } from "@/hooks/use-exchange-rate";
import { Skeleton } from "@/components/ui/skeleton";

export function Header() {
  const { data: jackpot, isLoading: jackpotLoading } = useJackpot();
  const { data: nextDraw, isLoading: countdownLoading } = useCountdown();
  const { data: exchangeRate, isLoading: rateLoading } = useExchangeRate();

  const formatCurrency = (amount: number, currency: 'EUR' | 'ZAR') => {
    const symbol = currency === 'EUR' ? '€' : 'R';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <i className="fas fa-chart-line text-primary text-2xl mr-3"></i>
            <h1 className="text-xl font-bold text-gray-900">EuroMillions Analysis Hub</h1>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Current Jackpot */}
            <div className="text-center">
              <div className="text-xs text-gray-500">Current Jackpot</div>
              {jackpotLoading ? (
                <Skeleton className="h-6 w-24 mb-1" />
              ) : (
                <div className="font-bold text-lg text-primary">
                  {jackpot ? formatCurrency(jackpot.amountEur, 'EUR') : '€0'}
                </div>
              )}
              {jackpotLoading ? (
                <Skeleton className="h-4 w-28" />
              ) : (
                <div className="text-sm text-gray-600">
                  {jackpot ? formatCurrency(jackpot.amountZar, 'ZAR') : 'R0'}
                </div>
              )}
            </div>
            
            {/* Next Draw Countdown */}
            <div className="text-center">
              <div className="text-xs text-gray-500">Next Draw</div>
              {countdownLoading ? (
                <Skeleton className="h-6 w-20 mb-1" />
              ) : (
                <div className="font-bold text-lg text-secondary">
                  {nextDraw ? `${nextDraw.countdown.days}d ${nextDraw.countdown.hours}h ${nextDraw.countdown.minutes}m` : '0d 0h 0m'}
                </div>
              )}
              <div className="text-sm text-gray-600">
                {nextDraw ? new Date(nextDraw.nextDrawDate).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Loading...'}
              </div>
            </div>
            
            {/* Exchange Rate */}
            <div className="text-center">
              <div className="text-xs text-gray-500">EUR/ZAR Rate</div>
              {rateLoading ? (
                <Skeleton className="h-6 w-16 mb-1" />
              ) : (
                <div className="font-bold text-lg text-success">
                  {exchangeRate ? exchangeRate.rate.toFixed(3) : '0.000'}
                </div>
              )}
              <div className="text-xs text-gray-500">Live</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
