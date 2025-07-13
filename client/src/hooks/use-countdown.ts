import { useQuery } from "@tanstack/react-query";

export function useCountdown() {
  return useQuery({
    queryKey: ['/api/next-draw'],
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    refetchIntervalInBackground: true,
  });
}