import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CombinationDisplay } from "@/components/combination-display";

interface SearchResult {
  position: number;
  mainNumbers: number[];
  luckyStars: number[];
  hasBeenDrawn: boolean;
  lastDrawnDate: string | null;
  similarCombinations: any[];
}

export function SearchTab() {
  const [mainNumbers, setMainNumbers] = useState<string[]>(['', '', '', '', '']);
  const [luckyStars, setLuckyStars] = useState<string[]>(['', '']);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [positionSearch, setPositionSearch] = useState('');
  const [fromPosition, setFromPosition] = useState('');
  const [toPosition, setToPosition] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Hot and cold numbers query
  const { data: numberAnalysis, isLoading: numbersLoading } = useQuery({
    queryKey: ['/api/analytics/numbers'],
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  // Search combination mutation
  const searchMutation = useMutation({
    mutationFn: async (data: { mainNumbers: number[], luckyStars: number[] }) => {
      const response = await apiRequest('POST', '/api/search', data);
      return response.json();
    },
    onSuccess: (data) => {
      setSearchResult(data);
      toast({
        title: "Search Complete",
        description: `Found combination at position ${data.position.toLocaleString()}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search combination",
        variant: "destructive",
      });
    },
  });

  // Position search query
  const { data: positionResult, isLoading: positionLoading } = useQuery({
    queryKey: ['/api/combination', positionSearch],
    enabled: !!positionSearch && !isNaN(parseInt(positionSearch)),
    select: (data) => data,
  });

  const handleSearch = () => {
    const nums = mainNumbers.map(n => parseInt(n)).filter(n => !isNaN(n) && n >= 1 && n <= 50);
    const stars = luckyStars.map(s => parseInt(s)).filter(s => !isNaN(s) && s >= 1 && s <= 12);
    
    if (nums.length !== 5) {
      toast({
        title: "Invalid Input",
        description: "Please enter 5 main numbers between 1-50",
        variant: "destructive",
      });
      return;
    }
    
    if (stars.length !== 2) {
      toast({
        title: "Invalid Input",
        description: "Please enter 2 lucky stars between 1-12",
        variant: "destructive",
      });
      return;
    }
    
    // Check for duplicates
    if (new Set(nums).size !== 5) {
      toast({
        title: "Invalid Input",
        description: "Main numbers must be unique",
        variant: "destructive",
      });
      return;
    }
    
    if (new Set(stars).size !== 2) {
      toast({
        title: "Invalid Input",
        description: "Lucky stars must be unique",
        variant: "destructive",
      });
      return;
    }
    
    searchMutation.mutate({ mainNumbers: nums.sort((a, b) => a - b), luckyStars: stars.sort((a, b) => a - b) });
  };

  const handleMainNumberChange = (index: number, value: string) => {
    const newNumbers = [...mainNumbers];
    newNumbers[index] = value;
    setMainNumbers(newNumbers);
  };

  const handleLuckyStarChange = (index: number, value: string) => {
    const newStars = [...luckyStars];
    newStars[index] = value;
    setLuckyStars(newStars);
  };

  const handlePositionSearch = () => {
    if (!positionSearch || isNaN(parseInt(positionSearch))) {
      toast({
        title: "Invalid Position",
        description: "Please enter a valid position number",
        variant: "destructive",
      });
      return;
    }
    
    const pos = parseInt(positionSearch);
    if (pos < 1 || pos > 139838160) {
      toast({
        title: "Invalid Position",
        description: "Position must be between 1 and 139,838,160",
        variant: "destructive",
      });
      return;
    }
    
    // The query will automatically fetch when positionSearch changes
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Combination Search */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Search Combinations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Main Numbers (1-50)</Label>
              <div className="grid grid-cols-5 gap-2">
                {mainNumbers.map((num, index) => (
                  <Input
                    key={index}
                    type="number"
                    min="1"
                    max="50"
                    placeholder={`N${index + 1}`}
                    value={num}
                    onChange={(e) => handleMainNumberChange(index, e.target.value)}
                    className="text-center"
                  />
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Lucky Stars (1-12)</Label>
              <div className="grid grid-cols-2 gap-2">
                {luckyStars.map((star, index) => (
                  <Input
                    key={index}
                    type="number"
                    min="1"
                    max="12"
                    placeholder={`LS${index + 1}`}
                    value={star}
                    onChange={(e) => handleLuckyStarChange(index, e.target.value)}
                    className="text-center"
                  />
                ))}
              </div>
            </div>
            
            <Button 
              onClick={handleSearch} 
              className="w-full"
              disabled={searchMutation.isPending}
            >
              <i className="fas fa-search mr-2"></i>
              {searchMutation.isPending ? 'Searching...' : 'Search Combination'}
            </Button>
          </CardContent>
        </Card>

        {/* Position Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Search by Position</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Position (1-139,838,160)</Label>
              <Input
                type="number"
                min="1"
                max="139838160"
                placeholder="Enter position number"
                value={positionSearch}
                onChange={(e) => setPositionSearch(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handlePositionSearch} 
              className="w-full"
              disabled={positionLoading}
            >
              <i className="fas fa-search mr-2"></i>
              {positionLoading ? 'Searching...' : 'Search Position'}
            </Button>
          </CardContent>
        </Card>

        {/* Search Results */}
        {(searchResult || positionResult) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Search Results</CardTitle>
            </CardHeader>
            <CardContent>
              {searchResult && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          Position: <span className="font-roboto-mono text-primary">{searchResult.position.toLocaleString()}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Status: <span className={`font-medium ${searchResult.hasBeenDrawn ? 'text-secondary' : 'text-success'}`}>
                            {searchResult.hasBeenDrawn ? 'Previously Drawn' : 'Never Drawn'}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <CombinationDisplay 
                        mainNumbers={searchResult.mainNumbers}
                        luckyStars={searchResult.luckyStars}
                      />
                    </div>
                    
                    {searchResult.lastDrawnDate && (
                      <p className="text-sm text-gray-600">
                        Last drawn: {new Date(searchResult.lastDrawnDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {positionResult && !searchResult && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        Position: <span className="font-roboto-mono text-primary">{parseInt(positionSearch).toLocaleString()}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Status: <span className={`font-medium ${positionResult.hasBeenDrawn ? 'text-secondary' : 'text-success'}`}>
                          {positionResult.hasBeenDrawn ? 'Previously Drawn' : 'Never Drawn'}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <CombinationDisplay 
                      mainNumbers={positionResult.mainNumbers}
                      luckyStars={positionResult.luckyStars}
                    />
                  </div>
                  
                  {positionResult.lastDrawnDate && (
                    <p className="text-sm text-gray-600">
                      Last drawn: {new Date(positionResult.lastDrawnDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Hot & Cold Numbers */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Hot & Cold Numbers</CardTitle>
          </CardHeader>
          <CardContent>
            {numbersLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-3">Hot Numbers</h4>
                  <div className="flex flex-wrap gap-2">
                    {numberAnalysis?.hotNumbers.slice(0, 8).map((item: any) => (
                      <span key={item.number} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-roboto-mono">
                        {item.number}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-red-700 mb-1">Hot Stars</h5>
                    <div className="flex flex-wrap gap-1">
                      {numberAnalysis?.hotStars.slice(0, 4).map((item: any) => (
                        <span key={item.number} className="px-2 py-1 bg-red-200 text-red-800 rounded-full text-xs font-roboto-mono">
                          {item.number}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-3">Cold Numbers</h4>
                  <div className="flex flex-wrap gap-2">
                    {numberAnalysis?.coldNumbers.slice(0, 8).map((item: any) => (
                      <span key={item.number} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-roboto-mono">
                        {item.number}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-blue-700 mb-1">Cold Stars</h5>
                    <div className="flex flex-wrap gap-1">
                      {numberAnalysis?.coldStars.slice(0, 4).map((item: any) => (
                        <span key={item.number} className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-roboto-mono">
                          {item.number}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Position Range Explorer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">From Position</Label>
                <Input
                  type="number"
                  min="1"
                  max="139838160"
                  placeholder="1"
                  value={fromPosition}
                  onChange={(e) => setFromPosition(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-1 block">To Position</Label>
                <Input
                  type="number"
                  min="1"
                  max="139838160"
                  placeholder="1000"
                  value={toPosition}
                  onChange={(e) => setToPosition(e.target.value)}
                />
              </div>
            </div>
            
            <Button className="w-full" variant="outline">
              <i className="fas fa-search mr-2"></i>
              Explore Range
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
