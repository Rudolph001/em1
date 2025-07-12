import { useQuery } from "@tanstack/react-query";

export function useCountdown() {
  return useQuery({
    queryKey: ['/api/next-draw'],
    refetchInterval: 1000, // Update every second
    refetchIntervalInBackground: true,
  });
}
