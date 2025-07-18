
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CombinationDisplay } from "@/components/combination-display";
import { AlertCircle, TrendingUp, Trophy, Coins } from "lucide-react";

interface Ticket {
  id: number;
  mainNumbers: number[];
  luckyStars: number[];
  predictionMethod: string;
  confidence: number;
  drawDate: string;
  isActive: boolean;
  matches?: {
    mainMatches: number;
    starMatches: number;
    totalMatches: number;
    prizeAmount: number;
    prizeAmountZar: number;
    tier: string;
  };
  createdAt: string;
}

interface TicketResult {
  ticketId: number;
  drawResult: {
    mainNumbers: number[];
    luckyStars: number[];
    drawDate: string;
  };
  matches: {
    mainMatches: number;
    starMatches: number;
    totalMatches: number;
    prizeAmount: number;
    prizeAmountZar: number;
    tier: string;
  };
}

export function TicketsTab() {
  const queryClient = useQueryClient();
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);

  // Fetch user tickets
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/tickets'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch ticket results
  const { data: results = [], isLoading: resultsLoading } = useQuery({
    queryKey: ['/api/ticket-results'],
    refetchInterval: 30000,
  });

  // Fetch current predictions to save as tickets
  const { data: predictions } = useQuery({
    queryKey: ['/api/predictions'],
  });

  // Save tickets mutation
  const saveTicketsMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });
      if (!response.ok) throw new Error('Failed to save tickets');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
    },
  });

  // Check results mutation
  const checkResultsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/tickets/check-results', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to check results');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ticket-results'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
    },
  });

  const handleSaveCurrentPredictions = () => {
    if (!predictions?.predictions) return;
    
    const ticketsToSave = predictions.predictions.map((pred: any) => ({
      mainNumbers: pred.mainNumbers,
      luckyStars: pred.luckyStars,
      predictionMethod: pred.method,
      confidence: pred.confidence,
      drawDate: predictions.mainPrediction?.drawDate || new Date().toISOString(),
    }));

    saveTicketsMutation.mutate({ tickets: ticketsToSave });
  };

  const handleCheckResults = () => {
    checkResultsMutation.mutate();
  };

  const calculateTotalWinnings = () => {
    return results.reduce((total: number, result: TicketResult) => {
      return total + (result.matches?.prizeAmountZar || 0);
    }, 0);
  };

  const getPerformanceStats = () => {
    const totalTickets = tickets.length;
    const winningTickets = results.filter((r: TicketResult) => r.matches?.totalMatches >= 2).length;
    const bigWins = results.filter((r: TicketResult) => r.matches?.totalMatches >= 4).length;
    
    return {
      totalTickets,
      winningTickets,
      bigWins,
      winRate: totalTickets > 0 ? (winningTickets / totalTickets * 100).toFixed(1) : '0.0',
      bigWinRate: totalTickets > 0 ? (bigWins / totalTickets * 100).toFixed(1) : '0.0',
    };
  };

  if (ticketsLoading || resultsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = getPerformanceStats();
  const totalWinnings = calculateTotalWinnings();

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button 
          onClick={handleSaveCurrentPredictions}
          disabled={!predictions?.predictions || saveTicketsMutation.isPending}
          className="flex items-center gap-2"
        >
          <Trophy className="h-4 w-4" />
          Save Current Predictions as Tickets
        </Button>
        
        <Button 
          onClick={handleCheckResults}
          disabled={checkResultsMutation.isPending}
          variant="outline"
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Check Results & Update Predictions
        </Button>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalTickets}</div>
              <div className="text-sm text-muted-foreground">Total Tickets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.winningTickets}</div>
              <div className="text-sm text-muted-foreground">Winning Tickets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.bigWins}</div>
              <div className="text-sm text-muted-foreground">4+ Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">R{totalWinnings.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Winnings</div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm font-medium">Win Rate</div>
              <div className="text-xl font-bold text-green-600">{stats.winRate}%</div>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm font-medium">Big Win Rate (4+ matches)</div>
              <div className="text-xl font-bold text-orange-600">{stats.bigWinRate}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets and Results */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Tickets</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {tickets.filter((ticket: Ticket) => ticket.isActive).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active tickets. Save some predictions to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.filter((ticket: Ticket) => ticket.isActive).map((ticket: Ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Ticket #{ticket.id}</Badge>
                          <Badge variant="outline">{ticket.predictionMethod}</Badge>
                          <Badge variant="outline">{(ticket.confidence * 100).toFixed(1)}%</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(ticket.drawDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <CombinationDisplay 
                        mainNumbers={ticket.mainNumbers}
                        luckyStars={ticket.luckyStars}
                        variant="ticket"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Results</CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No results yet. Check results after the next draw!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result: TicketResult) => (
                    <div key={result.ticketId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Ticket #{result.ticketId}</Badge>
                          <Badge 
                            variant={result.matches.totalMatches >= 4 ? "default" : 
                                   result.matches.totalMatches >= 2 ? "secondary" : "outline"}
                          >
                            {result.matches.totalMatches} matches
                          </Badge>
                          {result.matches.prizeAmount > 0 && (
                            <Badge variant="outline" className="text-green-600">
                              R{result.matches.prizeAmountZar.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(result.drawResult.drawDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium mb-2">Your Ticket</div>
                          <CombinationDisplay 
                            mainNumbers={tickets.find((t: Ticket) => t.id === result.ticketId)?.mainNumbers || []}
                            luckyStars={tickets.find((t: Ticket) => t.id === result.ticketId)?.luckyStars || []}
                            variant="ticket"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-2">Draw Result</div>
                          <CombinationDisplay 
                            mainNumbers={result.drawResult.mainNumbers}
                            luckyStars={result.drawResult.luckyStars}
                            variant="result"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-sm text-muted-foreground">Main Numbers</div>
                            <div className="font-semibold">{result.matches.mainMatches}/5</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Lucky Stars</div>
                            <div className="font-semibold">{result.matches.starMatches}/2</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Prize Tier</div>
                            <div className="font-semibold">{result.matches.tier}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Tickets History</CardTitle>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tickets saved yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket: Ticket) => (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Ticket #{ticket.id}</Badge>
                          <Badge variant="outline">{ticket.predictionMethod}</Badge>
                          <Badge variant="outline">{(ticket.confidence * 100).toFixed(1)}%</Badge>
                          <Badge variant={ticket.isActive ? "default" : "secondary"}>
                            {ticket.isActive ? "Active" : "Completed"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <CombinationDisplay 
                        mainNumbers={ticket.mainNumbers}
                        luckyStars={ticket.luckyStars}
                        variant="ticket"
                      />
                      
                      {ticket.matches && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Result: {ticket.matches.totalMatches} matches
                            </span>
                            {ticket.matches.prizeAmount > 0 && (
                              <span className="text-sm font-medium text-green-600">
                                Won: R{ticket.matches.prizeAmountZar.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
