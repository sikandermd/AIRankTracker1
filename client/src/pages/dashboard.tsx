import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import SearchFilters from "@/components/SearchFilters";
import StatsOverview from "@/components/StatsOverview";
import ResultsTable from "@/components/ResultsTable";
import CompetitorAnalysis from "@/components/CompetitorAnalysis";
import RecentActivity from "@/components/RecentActivity";
import QuickActions from "@/components/QuickActions";
import DetailModal from "@/components/DetailModal";
import BulkUploadModal from "@/components/BulkUploadModal";
import AlertSetupModal from "@/components/AlertSetupModal";
import { Bell, ChartLine } from "lucide-react";
import type { SearchFilters as SearchFiltersType } from "@/lib/types";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [, setLocation] = useLocation();
  const [searchFilters, setSearchFilters] = useState<SearchFiltersType>({
    keywords: [],
    brandId: "",
    platforms: [],
    dateRange: "7",
  });

  // Listen for bulk upload events from SearchFilters
  useEffect(() => {
    const handleBulkUpload = () => setShowBulkModal(true);
    window.addEventListener('openBulkUpload', handleBulkUpload);
    return () => window.removeEventListener('openBulkUpload', handleBulkUpload);
  }, []);

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: trackingResults, refetch: refetchResults } = useQuery({
    queryKey: ["/api/tracking-results/latest"],
  });

  const handleSearch = (filters: SearchFiltersType) => {
    setSearchFilters(filters);
    setIsSearching(true);
    setHasSearched(true);
    
    // Simulate search completion after tracking
    setTimeout(() => {
      setIsSearching(false);
      refetchResults();
    }, 30000); // 30 seconds for all platforms
  };

  const handleViewDetails = (keywordId: string) => {
    setSelectedKeywordId(keywordId);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  <ChartLine className="inline-block w-6 h-6 text-primary mr-2" />
                  AI Ranking Tracker
                </h1>
              </div>
              <nav className="hidden md:ml-10 md:flex md:space-x-8">
                <a href="#" className="text-primary font-medium border-b-2 border-primary pb-4">
                  Dashboard
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-700 pb-4">
                  Keywords
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-700 pb-4">
                  Reports
                </a>
                <a href="#" className="text-gray-500 hover:text-gray-700 pb-4">
                  Settings
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => setShowAlertModal(true)}>
                <Bell className="w-4 h-4 mr-2" />
                Alerts
              </Button>
              <Button variant="outline" size="sm" onClick={() => setLocation("/analytics")}>
                <ChartLine className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">JD</span>
                </div>
                <span className="text-sm font-medium text-gray-700">John Doe</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Filters - Always visible */}
        <SearchFilters onSearch={handleSearch} />

        {/* Progress Bar - Show when searching */}
        {isSearching && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Tracking Keywords...</h3>
                  <p className="text-sm text-gray-500">Analyzing across AI platforms (ChatGPT, Claude, Gemini, Perplexity)</p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard Content - Only show after search is complete or when not searching */}
        {!isSearching && hasSearched && (
          <>
            {/* Stats Overview */}
            <div className="mt-8">
              <StatsOverview stats={stats as any} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              {/* Main Results Table */}
              <div className="lg:col-span-2">
                <ResultsTable 
                  results={(trackingResults as any) || []} 
                  onViewDetails={handleViewDetails}
                />
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <CompetitorAnalysis />
                <RecentActivity />
                <QuickActions />
              </div>
            </div>
          </>
        )}

        {/* Quick Actions - Show when no search has been performed */}
        {!hasSearched && !isSearching && (
          <div className="mt-8 flex justify-center">
            <div className="max-w-md">
              <QuickActions />
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedKeywordId && (
        <DetailModal 
          keywordId={selectedKeywordId}
          onClose={() => setSelectedKeywordId(null)}
        />
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal 
        isOpen={showBulkModal} 
        onClose={() => setShowBulkModal(false)} 
      />

      <AlertSetupModal 
        isOpen={showAlertModal} 
        onClose={() => setShowAlertModal(false)} 
      />
    </div>
  );
}
