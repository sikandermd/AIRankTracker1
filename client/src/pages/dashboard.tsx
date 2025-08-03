import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import SearchFilters from "@/components/SearchFilters";
import StatsOverview from "@/components/StatsOverview";
import ResultsTable from "@/components/ResultsTable";
import CompetitorAnalysis from "@/components/CompetitorAnalysis";
import RecentActivity from "@/components/RecentActivity";
import DetailModal from "@/components/DetailModal";
import BulkUploadModal from "@/components/BulkUploadModal";
import AlertSetupModal from "@/components/AlertSetupModal";
import InitialSetup from "@/components/InitialSetup";
import { Bell, ChartLine } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
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

  const { data: brands } = useQuery({
    queryKey: ["/api/brands"],
  });

  const { data: keywords } = useQuery({
    queryKey: ["/api/keywords"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: trackingResults, refetch: refetchResults } = useQuery({
    queryKey: ["/api/tracking-results/latest"],
  });

  // Show initial setup if no brands exist
  if (brands && brands.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <InitialSetup />
      </div>
    );
  }

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
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  <ChartLine className="inline-block w-6 h-6 text-primary mr-2" />
                  AI Ranking Tracker
                </h1>
              </div>

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
        <SearchFilters onSearch={handleSearch} isSearching={isSearching} />

        {/* Progress Bar - Show when searching */}
        {isSearching && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Tracking Keywords...</h3>
                  <p className="text-sm text-gray-500">Analyzing across AI platforms</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>Estimated time: 30-45 seconds</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all duration-1000 animate-pulse" style={{width: '60%'}}></div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      Querying AI platforms
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
                      Analyzing responses
                    </div>
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
                  searchFilters={searchFilters}
                />
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <CompetitorAnalysis />
                <RecentActivity />
              </div>
            </div>
          </>
        )}

        {/* Welcome Message - Show when no search has been performed */}
        {!hasSearched && !isSearching && (
          <div className="mt-8 flex justify-center">
            <div className="max-w-lg text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to AI Ranking Tracker</h2>
              <p className="text-gray-600 mb-6">Start tracking your brand visibility across AI search engines by entering keywords above.</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">💡 Tip: Use the "Quick Actions" menu in the top navigation to add keywords, import data, or generate reports.</p>
              </div>
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
