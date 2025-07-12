import { useQuery } from "@tanstack/react-query";

export function useExchangeRate() {
  return useQuery({
    queryKey: ['/api/jackpot'],
    select: (data) => data ? { rate: data.exchangeRate } : null,
    refetchInterval: 30 * 1000, // Update every 30 seconds for real-time feel
    refetchIntervalInBackground: true,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
  });
}
