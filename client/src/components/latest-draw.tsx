import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CombinationDisplay } from "@/components/combination-display";

export function LatestDraw() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['/api/history'],
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  const latestDraw = history && history.length > 0 ? history[0] : null;

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Latest Draw</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-8 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latestDraw) {
    return (
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="text-center text-yellow-700">
            <i className="fas fa-exclamation-triangle mb-2 text-xl"></i>
            <p>No recent draw data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-primary">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <i className="fas fa-trophy text-primary mr-2"></i>
          Latest Draw - {new Date(latestDraw.drawDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <CombinationDisplay 
              mainNumbers={latestDraw.mainNumbers}
              luckyStars={latestDraw.luckyStars}
            />
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Position</div>
            <div className="font-bold text-lg text-primary font-roboto-mono">
              {latestDraw.position.toLocaleString()}
            </div>
            {latestDraw.jackpotEur && (
              <div className="text-sm text-gray-600 mt-1">
                Jackpot: €{latestDraw.jackpotEur.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}