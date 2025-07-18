import { useJackpot } from "@/hooks/use-jackpot";
import { useCountdown } from "@/hooks/use-countdown";
import { useExchangeRate } from "@/hooks/use-exchange-rate";
import { Skeleton } from "@/components/ui/skeleton";
import { CountdownTimer } from "@/components/countdown-timer";

export function Header() {
  const { data: jackpot, isLoading: jackpotLoading } = useJackpot();
  const { data: nextDraw, isLoading: countdownLoading } = useCountdown();
  const { data: exchangeRate, isLoading: rateLoading } = useExchangeRate();

  const formatCurrency = (amount: number, currency: 'EUR' | 'ZAR') => {
    const symbol = currency === 'EUR' ? '€' : 'R';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-2xl border-b border-purple-800/30 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <i className="fas fa-chart-line text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">EuroMillions Analysis Hub</h1>
              <p className="text-sm text-purple-200">Professional Lottery Analytics</p>
            </div>
          </div>

          <div className="flex items-center space-x-8">
            {/* Current Jackpot */}
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
              <div className="text-xs text-purple-200 uppercase tracking-wide font-medium">Current Jackpot</div>
              {jackpotLoading ? (
                <Skeleton className="h-6 w-24 mb-1 bg-white/20" />
              ) : (
                <div className="font-bold text-lg text-yellow-400">
                  {jackpot ? formatCurrency(jackpot.amountEur, 'EUR') : '€0'}
                </div>
              )}
              {jackpotLoading ? (
                <Skeleton className="h-4 w-28 bg-white/20" />
              ) : (
                <div className="text-sm text-purple-200">
                  {jackpot ? formatCurrency(jackpot.amountZar, 'ZAR') : 'R0'}
                </div>
              )}
              {jackpot && !jackpotLoading && (
                <div className="text-xs text-purple-300 mt-1">
                  10%: {formatCurrency(jackpot.amountZar * 0.1, 'ZAR')}
                </div>
              )}
            </div>

            {/* Next Draw Countdown */}
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
              <div className="text-xs text-purple-200 uppercase tracking-wide font-medium mb-1">Next Draw</div>
              {countdownLoading ? (
                <Skeleton className="h-8 w-32 mb-1 bg-white/20" />
              ) : nextDraw ? (
                <div className="text-orange-400">
                  <CountdownTimer 
                    targetDate={new Date(nextDraw.nextDrawDate)}
                  />
                </div>
              ) : (
                <div className="font-bold text-lg text-orange-400">Loading...</div>
              )}
              <div className="text-xs text-purple-200 mt-1">
                {nextDraw ? new Date(nextDraw.nextDrawDate).toLocaleDateString('en-ZA', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Africa/Johannesburg'
                }) + ' SAST' : 'Loading...'}
              </div>
            </div>

            {/* Exchange Rate */}
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
              <div className="text-xs text-purple-200 uppercase tracking-wide font-medium">EUR/ZAR Rate</div>
              {rateLoading ? (
                <Skeleton className="h-6 w-16 mb-1 bg-white/20" />
              ) : (
                <div className="font-bold text-lg text-green-400">
                  {exchangeRate && typeof exchangeRate === 'number' && !isNaN(exchangeRate) ? exchangeRate.toFixed(3) : '0.000'}
                </div>
              )}
              <div className="text-xs text-green-300 flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Live
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}