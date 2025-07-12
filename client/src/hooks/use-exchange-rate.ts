import { useQuery } from "@tanstack/react-query";

export function useExchangeRate() {
  return useQuery({
    queryKey: ['/api/jackpot'],
    select: (data) => data ? { rate: data.exchangeRate } : null,
    refetchInterval: 2 * 60 * 1000, // Update every 2 minutes
    refetchIntervalInBackground: true,
  });
}
