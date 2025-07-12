import { useState } from "react";
import { Header } from "@/components/header";
import { LatestDraw } from "@/components/latest-draw";
import { StatsOverview } from "@/components/stats-overview";
import { SearchTab } from "@/components/search-tab";
import { PredictionsTab } from "@/components/predictions-tab";
import { HistoryTab } from "@/components/history-tab";
import { AnalyticsTab } from "@/components/analytics-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [activeTab, setActiveTab] = useState("search");

  return (
    <div className="min-h-screen bg-gray-50 font-roboto">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LatestDraw />
        <StatsOverview />
        
        <div className="bg-white rounded-lg shadow-lg mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-transparent border-b border-gray-200 rounded-none">
              <TabsTrigger 
                value="search" 
                className="flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none py-4"
              >
                <i className="fas fa-search" />
                Search & Analyze
              </TabsTrigger>
              <TabsTrigger 
                value="predictions" 
                className="flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none py-4"
              >
                <i className="fas fa-crystal-ball" />
                AI Predictions
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none py-4"
              >
                <i className="fas fa-history" />
                Draw History
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none py-4"
              >
                <i className="fas fa-chart-bar" />
                Gap Analysis
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="search" className="p-6">
              <SearchTab />
            </TabsContent>
            
            <TabsContent value="predictions" className="p-6">
              <PredictionsTab />
            </TabsContent>
            
            <TabsContent value="history" className="p-6">
              <HistoryTab />
            </TabsContent>
            
            <TabsContent value="analytics" className="p-6">
              <AnalyticsTab />
            </TabsContent>
          </Tabs>
        </div>
        
        <footer className="mt-12 bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Data Sources</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Pedro Mealha's EuroMillions API</li>
                <li>• Real-time exchange rates</li>
                <li>• Updated every 15 minutes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Model Information</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Random Forest + LSTM</li>
                <li>• Trained on historical draws</li>
                <li>• Gap analysis based predictions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Disclaimer</h4>
              <p className="text-sm text-gray-600">
                This tool is for educational purposes only. 
                Lottery games are games of chance with no guaranteed winning strategy.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
