import { Eye, Download, RefreshCw, Check, X, Info } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PlatformIcon, getPlatformName, getPlatformColor } from "./PlatformIcons";
import type { EnrichedTrackingResult } from "@/lib/types";

interface ResultsTableProps {
  results: EnrichedTrackingResult[];
  onViewDetails: (keywordId: string) => void;
  searchFilters?: {
    brandId?: string;
    brandIds?: string[];
    platforms?: string[];
    keywords?: string[];
  };
}

export default function ResultsTable({ results, onViewDetails, searchFilters }: ResultsTableProps) {
  // Filter results based on search criteria
  let filteredResults = results;
  
  if (searchFilters) {
    filteredResults = results.filter(result => {
      // Filter by brand if specified (support both single and multiple brands)
      if (searchFilters.brandIds && searchFilters.brandIds.length > 0) {
        if (!searchFilters.brandIds.includes(result.brand?.id || "")) {
          return false;
        }
      } else if (searchFilters.brandId && result.brand?.id !== searchFilters.brandId) {
        return false;
      }
      
      // Filter by platforms if specified
      if (searchFilters.platforms && searchFilters.platforms.length > 0) {
        if (!searchFilters.platforms.includes(result.aiPlatform)) {
          return false;
        }
      }
      
      // Filter by keywords if specified
      if (searchFilters.keywords && searchFilters.keywords.length > 0) {
        const keywordMatch = searchFilters.keywords.some(keyword => 
          result.keyword?.keyword?.toLowerCase().includes(keyword.toLowerCase())
        );
        if (!keywordMatch) {
          return false;
        }
      }
      
      return true;
    });
  }

  // Group results by keyword for better display
  const groupedResults = filteredResults.reduce((acc, result) => {
    const keywordId = result.keywordId;
    if (!acc[keywordId]) {
      acc[keywordId] = {
        keyword: result.keyword,
        brand: result.brand,
        platforms: [],
        totalMentions: 0,
      };
    }
    
    // Check if this platform already exists for this keyword
    const existingPlatform = acc[keywordId].platforms.find(p => p.platform === result.aiPlatform);
    if (!existingPlatform) {
      acc[keywordId].platforms.push({
        platform: result.aiPlatform,
        mentioned: result.mentioned,
        position: result.position,
        mentionCount: result.mentionCount,
      });
      acc[keywordId].totalMentions += result.mentionCount;
    }
    
    return acc;
  }, {} as Record<string, any>);

  const getPositionBadge = (position: string | null) => {
    if (!position) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          <X className="w-3 h-3 mr-1" />
          None
        </Badge>
      );
    }

    const variants = {
      top: "bg-green-100 text-green-800",
      middle: "bg-yellow-100 text-yellow-800",
      bottom: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={variants[position as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {position.charAt(0).toUpperCase() + position.slice(1)}
      </Badge>
    );
  };

  const getPlatformBadge = (platform: any) => {
    return (
      <div className="flex flex-col items-center gap-1 p-2 border rounded-lg bg-white shadow-sm">
        <Badge className={`${getPlatformColor(platform.platform)} flex items-center gap-1`}>
          <PlatformIcon platform={platform.platform} className="w-3 h-3" />
          {platform.mentioned ? (
            <Check className="w-3 h-3" />
          ) : (
            <X className="w-3 h-3" />
          )}
          <span>{getPlatformName(platform.platform)}</span>
        </Badge>
        <div className="text-xs text-center">
          <div className="font-medium text-gray-700">
            Position: {platform.position || 'None'}
          </div>
          <div className="text-gray-500">
            Mentions: {platform.mentionCount || 0}
          </div>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Keyword Tracking Results
            </h3>
            {searchFilters && (
              <p className="text-sm text-gray-500 mt-1">
                Showing results for selected brand and platforms only
              </p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Keyword</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="text-center">AI Platforms & Results</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    Best Position
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <p><strong>Position</strong> shows where your brand appears:</p>
                            <p>• <strong>Top:</strong> First 3 results</p>
                            <p>• <strong>Middle:</strong> 4-7 results</p>
                            <p>• <strong>Bottom:</strong> 8+ results</p>
                            <p>• <strong>None:</strong> Not mentioned</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    Total Mentions
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <p><strong>Mentions</strong> explained:</p>
                            <p>• How many times your brand appeared in AI response</p>
                            <p>• More mentions = better visibility</p>
                            <p>• 0 mentions = brand not mentioned</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedResults).map(([keywordId, data]) => {
                const bestPosition = data.platforms
                  .filter((p: any) => p.mentioned)
                  .reduce((best: string | null, platform: any) => {
                    if (!best) return platform.position;
                    if (platform.position === 'top') return 'top';
                    if (platform.position === 'middle' && best === 'bottom') return 'middle';
                    return best;
                  }, null);

                return (
                  <TableRow key={keywordId} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">
                        {data.keyword?.keyword || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {data.keyword?.category || 'General'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {data.brand?.name?.charAt(0) || 'B'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {data.brand?.name || 'Unknown Brand'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center flex-wrap gap-2">
                        {data.platforms.map((platform: any, idx: number) => (
                          <div key={idx}>
                            {getPlatformBadge(platform)}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getPositionBadge(bestPosition)}
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-900">
                      <span className="font-semibold">{data.totalMentions}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onViewDetails(keywordId)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {Object.keys(groupedResults).length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No tracking results found for the selected criteria.</p>
            <p className="text-xs mt-1">Try adjusting your search filters or start a new tracking session.</p>
          </div>
        )}

        {/* Pagination placeholder */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button variant="outline" size="sm">Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{" "}
                <span className="font-medium">{Object.keys(groupedResults).length}</span> of{" "}
                <span className="font-medium">{Object.keys(groupedResults).length}</span> results
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
