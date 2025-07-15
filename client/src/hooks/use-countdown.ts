import { useQuery } from "@tanstack/react-query";

export function useCountdown() {
  return useQuery({
    queryKey: ['/api/next-draw'],
    refetchInterval: 15 * 1000, // Refresh every 15 seconds
    refetchIntervalInBackground: true,
    staleTime: 0, // Always consider data stale
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}