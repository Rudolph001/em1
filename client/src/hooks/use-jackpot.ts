import { useQuery } from "@tanstack/react-query";

export function useJackpot() {
  return useQuery({
    queryKey: ['/api/jackpot'],
    refetchInterval: 2 * 60 * 1000, // Update every 2 minutes
    refetchIntervalInBackground: true,
  });
}
