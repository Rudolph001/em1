import { useQuery } from "@tanstack/react-query";

export function useExchangeRate() {
  return useQuery({
    queryKey: ['/api/jackpot'],
    select: (data: any) => data?.exchangeRate?.rate,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}