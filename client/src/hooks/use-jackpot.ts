import { useQuery } from "@tanstack/react-query";

export function useJackpot() {
  return useQuery({
    queryKey: ['/api/jackpot'],
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    refetchIntervalInBackground: true,
    staleTime: 0, // Always consider data stale
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}