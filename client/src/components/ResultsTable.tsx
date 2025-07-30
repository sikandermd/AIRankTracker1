import { Eye, Download, RefreshCw, Check, X } from "lucide-react";
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
import type { EnrichedTrackingResult } from "@/lib/types";

interface ResultsTableProps {
  results: EnrichedTrackingResult[];
  onViewDetails: (keywordId: string) => void;
}

export default function ResultsTable({ results, onViewDetails }: ResultsTableProps) {
  // Group results by keyword for better display
  const groupedResults = results.reduce((acc, result) => {
    const keywordId = result.keywordId;
    if (!acc[keywordId]) {
      acc[keywordId] = {
        keyword: result.keyword,
        brand: result.brand,
        platforms: [],
        totalMentions: 0,
      };
    }
    
    acc[keywordId].platforms.push({
      platform: result.aiPlatform,
      mentioned: result.mentioned,
      position: result.position,
      mentionCount: result.mentionCount,
    });
    
    acc[keywordId].totalMentions += result.mentionCount;
    
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
    const colors = {
      gpt: "bg-blue-100 text-blue-800",
      claude: "bg-purple-100 text-purple-800", 
      gemini: "bg-green-100 text-green-800",
      perplexity: "bg-orange-100 text-orange-800",
    };

    return (
      <Badge className={`${colors[platform.platform as keyof typeof colors]} mr-1 mb-1`}>
        {platform.mentioned ? (
          <Check className="w-3 h-3 mr-1" />
        ) : (
          <X className="w-3 h-3 mr-1" />
        )}
        {platform.platform.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Keyword Tracking Results
          </h3>
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
                <TableHead className="text-center">AI Platforms</TableHead>
                <TableHead className="text-center">Position</TableHead>
                <TableHead className="text-center">Mentions</TableHead>
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
                      <div className="flex justify-center flex-wrap gap-1">
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
            No tracking results found. Start by searching for keywords above.
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
  );
}
