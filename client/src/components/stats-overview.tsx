import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 0, // Always consider data stale
    refetchOnMount: true, // Always refetch when component mounts
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Combinations</p>
              <p className="text-2xl font-bold text-gray-900 font-roboto-mono">
                {formatNumber(139838160)}
              </p>
            </div>
            <div className="bg-primary bg-opacity-10 rounded-full p-3">
              <i className="fas fa-calculator text-primary text-xl"></i>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Drawn Combinations</p>
              <p className="text-2xl font-bold text-secondary font-roboto-mono">
                {stats ? formatNumber(stats.drawnCombinations) : '0'}
              </p>
            </div>
            <div className="bg-secondary bg-opacity-10 rounded-full p-3">
              <i className="fas fa-check-circle text-secondary text-xl"></i>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Never Drawn</p>
              <p className="text-2xl font-bold text-success font-roboto-mono">
                {stats ? formatNumber(stats.neverDrawnCombinations) : '139,838,160'}
              </p>
            </div>
            <div className="bg-success bg-opacity-10 rounded-full p-3">
              <i className="fas fa-star text-success text-xl"></i>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Prediction Accuracy</p>
              <p className="text-2xl font-bold text-warning font-roboto-mono">
                {stats ? `${stats.predictionAccuracy.toFixed(1)}%` : '0.0%'}
              </p>
            </div>
            <div className="bg-warning bg-opacity-10 rounded-full p-3">
              <i className="fas fa-bullseye text-warning text-xl"></i>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
