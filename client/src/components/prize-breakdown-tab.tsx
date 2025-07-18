
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface PrizeBreakdown {
  tier: string;
  description: string;
  winners: number;
  prizeEur: number;
  prizeZar: number;
  tenPercentEur: number;
  tenPercentZar: number;
}

interface PrizeData {
  drawDate: string;
  totalPrizePool: number;
  totalPrizePoolZar: number;
  exchangeRate: number;
  breakdown: PrizeBreakdown[];
  lastUpdated: string;
}

export function PrizeBreakdownTab() {
  const { data: prizeData, isLoading, error } = useQuery<PrizeData>({
    queryKey: ['/api/prize-breakdown'],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 0,
    refetchOnMount: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !prizeData) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-6">
          <div className="text-center text-yellow-700">
            <i className="fas fa-exclamation-triangle mb-2 text-xl"></i>
            <p>Prize breakdown data temporarily unavailable</p>
            <p className="text-sm mt-1">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-primary bg-gradient-to-r from-primary/5 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <i className="fas fa-trophy text-primary mr-3"></i>
            Latest Prize Breakdown
          </CardTitle>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>Draw Date: {new Date(prizeData.drawDate).toLocaleDateString()}</span>
            <span>Exchange Rate: R{prizeData.exchangeRate}</span>
            <span>Last Updated: {new Date(prizeData.lastUpdated).toLocaleTimeString()}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-sm text-gray-600 mb-1">Total Prize Pool</div>
              <div className="text-2xl font-bold text-primary">€{prizeData.totalPrizePool.toLocaleString()}</div>
              <div className="text-lg text-gray-700">R{prizeData.totalPrizePoolZar.toLocaleString()}</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-sm text-gray-600 mb-1">10% of Total Pool</div>
              <div className="text-2xl font-bold text-green-600">€{(prizeData.totalPrizePool * 0.1).toLocaleString()}</div>
              <div className="text-lg text-gray-700">R{(prizeData.totalPrizePoolZar * 0.1).toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prize Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-list-ol text-primary mr-2"></i>
            Prize Tiers & Payouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Tier</th>
                  <th className="text-left py-3 px-2">Match</th>
                  <th className="text-center py-3 px-2">Winners</th>
                  <th className="text-right py-3 px-2">Prize (EUR)</th>
                  <th className="text-right py-3 px-2">Prize (ZAR)</th>
                  <th className="text-right py-3 px-2">10% (EUR)</th>
                  <th className="text-right py-3 px-2">10% (ZAR)</th>
                </tr>
              </thead>
              <tbody>
                {prizeData.breakdown.map((tier, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {tier.tier}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-sm">{tier.description}</td>
                    <td className="py-3 px-2 text-center font-mono">
                      {tier.winners.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right font-mono">
                      €{tier.prizeEur.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right font-mono">
                      R{tier.prizeZar.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-green-600">
                      €{tier.tenPercentEur.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-green-600">
                      R{tier.tenPercentZar.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {prizeData.breakdown.reduce((sum, tier) => sum + tier.winners, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Winners</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              €{prizeData.breakdown.reduce((sum, tier) => sum + tier.tenPercentEur, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total 10% (EUR)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              R{prizeData.breakdown.reduce((sum, tier) => sum + tier.tenPercentZar, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total 10% (ZAR)</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
