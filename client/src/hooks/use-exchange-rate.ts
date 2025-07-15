import { useQuery } from "@tanstack/react-query";

export function useExchangeRate() {
  return useQuery({
    queryKey: ['/api/jackpot'],
    select: (data: any) => data?.exchangeRate,
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    refetchIntervalInBackground: true,
    staleTime: 0, // Always consider data stale
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}