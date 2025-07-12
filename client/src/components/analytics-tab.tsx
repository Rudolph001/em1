import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AnalyticsTab() {
  const { data: gapAnalysis, isLoading: gapLoading } = useQuery({
    queryKey: ['/api/analytics/gaps'],
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  if (gapLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Position Gap Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gap Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const calculateProgressPercentage = (value: number, max: number) => {
    return (value / max) * 100;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Gap Analysis Chart */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Position Gap Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {gapAnalysis && gapAnalysis.chartData ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gapAnalysis.chartData.datasets[0].data.map((value: number, index: number) => ({
                    name: `Draw ${index + 1}`,
                    gap: value
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value: number) => [formatNumber(value), 'Position Gap']} />
                    <Line 
                      type="monotone" 
                      dataKey="gap" 
                      stroke="#1976D2" 
                      strokeWidth={2}
                      fill="rgba(25, 118, 210, 0.1)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No gap analysis data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gap Statistics */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Gap Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {gapAnalysis ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Average Gap</span>
                    <span className="text-lg font-bold text-primary font-roboto-mono">
                      {formatNumber(Math.round(gapAnalysis.averageGap))}
                    </span>
                  </div>
                  <Progress 
                    value={calculateProgressPercentage(gapAnalysis.averageGap, gapAnalysis.largestGap)} 
                    className="h-2"
                  />
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Largest Gap</span>
                    <span className="text-lg font-bold text-secondary font-roboto-mono">
                      {formatNumber(gapAnalysis.largestGap)}
                    </span>
                  </div>
                  <Progress 
                    value={100} 
                    className="h-2"
                  />
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Smallest Gap</span>
                    <span className="text-lg font-bold text-success font-roboto-mono">
                      {formatNumber(gapAnalysis.smallestGap)}
                    </span>
                  </div>
                  <Progress 
                    value={calculateProgressPercentage(gapAnalysis.smallestGap, gapAnalysis.largestGap)} 
                    className="h-2"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-chart-bar text-gray-400 text-4xl mb-4"></i>
                <p className="text-gray-500">No gap statistics available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Pattern Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-trending-up text-white text-sm"></i>
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">Gap Trend</p>
                    <p className="text-sm text-blue-600">
                      {gapAnalysis && gapAnalysis.averageGap > 2000000 ? 'Increasing' : 'Stable'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {gapAnalysis ? `${(gapAnalysis.averageGap / 1000000).toFixed(1)}M` : 'N/A'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-repeat text-white text-sm"></i>
                  </div>
                  <div>
                    <p className="font-medium text-green-900">Variance</p>
                    <p className="text-sm text-green-600">
                      {gapAnalysis ? 'High volatility in gaps' : 'N/A'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  {gapAnalysis ? 
                    `${((gapAnalysis.largestGap - gapAnalysis.smallestGap) / 1000000).toFixed(1)}M` : 
                    'N/A'
                  }
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
