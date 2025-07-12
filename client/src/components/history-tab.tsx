import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CombinationDisplay } from "@/components/combination-display";

export function HistoryTab() {
  const { data: history, isLoading, refetch } = useQuery({
    queryKey: ['/api/history'],
    queryFn: () => fetch('/api/history?limit=20').then(res => res.json()),
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `€${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `€${(amount / 1000).toFixed(1)}K`;
    } else {
      return `€${amount.toFixed(0)}`;
    }
  };

  const formatGap = (gap: number) => {
    if (gap > 0) {
      return `+${gap.toLocaleString()}`;
    } else if (gap < 0) {
      return gap.toLocaleString();
    }
    return '0';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Recent Draw History</h3>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <i className="fas fa-sync-alt mr-2"></i>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historical Draws</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-12 w-64" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 w-20" />
                </div>
              ))}
            </div>
          ) : history && history.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Date</TableHead>
                    <TableHead className="w-80">Numbers</TableHead>
                    <TableHead className="w-32">Position</TableHead>
                    <TableHead className="w-32">Gap</TableHead>
                    <TableHead className="w-24">Jackpot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((draw: any, index: number) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {new Date(draw.drawDate).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <CombinationDisplay 
                          mainNumbers={draw.mainNumbers}
                          luckyStars={draw.luckyStars}
                          variant="compact"
                        />
                      </TableCell>
                      <TableCell className="font-roboto-mono text-sm">
                        {draw.position.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-roboto-mono text-sm">
                        {formatGap(draw.gapFromPrevious)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(draw.jackpotEur)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="fas fa-history text-gray-400 text-4xl mb-4"></i>
              <p className="text-gray-500">No draw history available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
