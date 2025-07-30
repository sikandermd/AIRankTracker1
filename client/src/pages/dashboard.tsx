import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchFilters from "@/components/SearchFilters";
import StatsOverview from "@/components/StatsOverview";
import ResultsTable from "@/components/ResultsTable";
import CompetitorAnalysis from "@/components/CompetitorAnalysis";
import RecentActivity from "@/components/RecentActivity";
import QuickActions from "@/components/QuickActions";
import DetailModal from "@/components/DetailModal";
import { Bell, ChartLine } from "lucide-react";
import type { SearchFilters as SearchFiltersType } from "@/lib/types";

export default function Dashboard() {
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFiltersType>({
    keywords: [],
    brandId: "",
    platforms: [],
    dateRange: "7",
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: trackingResults, refetch: refetchResults } = useQuery({
    queryKey: ["/api/tracking-results/latest"],
  });

  const handleSearch = (filters: SearchFiltersType) => {
    setSearchFilters(filters);
    refetchResults();
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
              <button className="text-gray-400 hover:text-gray-500">
                <Bell className="h-5 w-5" />
              </button>
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
        {/* Search Filters */}
        <SearchFilters onSearch={handleSearch} />

        {/* Stats Overview */}
        <StatsOverview stats={stats as any} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
      </div>

      {/* Detail Modal */}
      {selectedKeywordId && (
        <DetailModal 
          keywordId={selectedKeywordId}
          onClose={() => setSelectedKeywordId(null)}
        />
      )}
    </div>
  );
}
