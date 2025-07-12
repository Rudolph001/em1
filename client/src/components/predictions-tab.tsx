import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CombinationDisplay } from "@/components/combination-display";

export function PredictionsTab() {
  const { data: prediction, isLoading: predictionLoading } = useQuery({
    queryKey: ['/api/prediction'],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const { data: alternatives, isLoading: alternativesLoading } = useQuery({
    queryKey: ['/api/predictions/alternatives'],
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  if (predictionLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Prediction</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alternative Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* AI Prediction */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Next Draw Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            {prediction ? (
              <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm opacity-90">
                      AI Prediction for {new Date(prediction.drawDate).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs opacity-75">
                      Model Confidence: {(prediction.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full p-3">
                    <i className="fas fa-brain text-xl"></i>
                  </div>
                </div>
                
                <div className="mb-4">
                  <CombinationDisplay 
                    mainNumbers={prediction.mainNumbers}
                    luckyStars={prediction.luckyStars}
                    variant="prediction"
                  />
                </div>
                
                <div className="text-center text-sm">
                  <p className="opacity-90">
                    Position: <span className="font-roboto-mono">{prediction.position.toLocaleString()}</span>
                  </p>
                  <p className="opacity-75">
                    Model: {prediction.modelVersion}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-exclamation-triangle text-gray-400 text-4xl mb-4"></i>
                <p className="text-gray-500">No prediction available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Model Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Model Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Model Version</span>
                <span className="text-sm font-medium text-gray-900">
                  {prediction?.modelVersion || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Prediction Method</span>
                <span className="text-sm font-medium text-gray-900">Gap Analysis</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Confidence Level</span>
                <Badge variant="secondary">
                  {prediction ? `${(prediction.confidence * 100).toFixed(1)}%` : 'N/A'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alternative Predictions */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Alternative Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            {alternativesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : alternatives && alternatives.length > 0 ? (
              <div className="space-y-4">
                {alternatives.map((alt: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">{alt.method}</span>
                        <Badge variant="outline">
                          {(alt.confidence * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <i className="fas fa-chart-line text-gray-400"></i>
                    </div>
                    
                    <div className="mb-3">
                      <CombinationDisplay 
                        mainNumbers={alt.mainNumbers}
                        luckyStars={alt.luckyStars}
                        variant="alternative"
                      />
                    </div>
                    
                    <p className="text-xs text-gray-500 text-center">
                      Position: {alt.position.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-exclamation-triangle text-gray-400 text-4xl mb-4"></i>
                <p className="text-gray-500">No alternative predictions available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
