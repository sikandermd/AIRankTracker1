import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  TrendingUp,
  ExternalLink,
  Search,
  Filter,
  BarChart3,
  Link as LinkIcon,
  ArrowUpRight,
  Download,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface TopPage {
  id: string;
  url: string;
  title: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  internalLinks: number;
  externalLinks: number;
  backlinks: number;
  lastUpdated: string;
}

const TopPages = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("clicks");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedDirectory, setSelectedDirectory] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data: directories } = useQuery<Array<{value: string, label: string}>>({
    queryKey: ['/api/notifyvisitors-directories'],
  });

  const { data: topPages, isLoading } = useQuery<TopPage[]>({
    queryKey: ['/api/top-pages', selectedDirectory, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        directory: selectedDirectory,
        dateRange: dateRange
      });
      const response = await fetch(`/api/top-pages?${params}`);
      if (!response.ok) throw new Error('Failed to fetch top pages');
      return response.json();
    },
  });

  const filteredPages = topPages?.filter(page =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.url.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const sortedPages = [...filteredPages].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case "clicks":
        comparison = a.clicks - b.clicks;
        break;
      case "impressions":
        comparison = a.impressions - b.impressions;
        break;
      case "ctr":
        comparison = a.ctr - b.ctr;
        break;
      case "position":
        comparison = a.position - b.position;
        break;
      case "backlinks":
        comparison = a.backlinks - b.backlinks;
        break;
      case "internalLinks":
        comparison = a.internalLinks - b.internalLinks;
        break;
      case "externalLinks":
        comparison = a.externalLinks - b.externalLinks;
        break;
      default:
        return 0;
    }
    
    return sortOrder === "desc" ? -comparison : comparison;
  });

  // Pagination
  const totalPagesForPagination = Math.ceil(sortedPages.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPages = sortedPages.slice(startIndex, startIndex + pageSize);

  const totalPagesCount = sortedPages.length;
  const totalClicks = sortedPages.reduce((sum, page) => sum + page.clicks, 0);
  const avgPosition = sortedPages.length > 0 
    ? sortedPages.reduce((sum, page) => sum + page.position, 0) / sortedPages.length 
    : 0;

  // Handle sort changes
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Export functionality
  const exportToCSV = () => {
    const headers = ['Page', 'Title', 'Clicks', 'Impressions', 'CTR %', 'Position', 'Internal Links', 'External Links', 'Backlinks'];
    const csvData = sortedPages.map(page => [
      page.url,
      page.title,
      page.clicks,
      page.impressions,
      page.ctr,
      page.position,
      page.internalLinks,
      page.externalLinks,
      page.backlinks
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `top-pages-${selectedDirectory}-${dateRange}days.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getPositionColor = (position: number) => {
    if (position <= 3) return "text-green-600 bg-green-50";
    if (position <= 10) return "text-blue-600 bg-blue-50";
    if (position <= 20) return "text-orange-600 bg-orange-50";
    return "text-gray-600 bg-gray-50";
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Top Pages</h1>
          <p className="text-muted-foreground">
            Analyze your highest performing pages with search console data, internal/external links, and backlinks
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedDirectory} onValueChange={setSelectedDirectory}>
                <SelectTrigger className="w-24 h-6 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {directories?.map((dir) => (
                    <SelectItem key={dir.value} value={dir.value}>
                      {dir.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPagesCount}</div>
            <p className="text-xs text-muted-foreground">
              {selectedDirectory === 'all' ? 'All sections' : `${selectedDirectory} section`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last {dateRange} days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Position</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPosition.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Average position
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backlinks</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topPages?.reduce((sum, page) => sum + page.backlinks, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +15% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="w-full">
              <label className="text-sm font-medium">Search Pages</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by page title or URL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Responsive Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Directory</label>
                <Select value={selectedDirectory} onValueChange={setSelectedDirectory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {directories?.map((dir) => (
                      <SelectItem key={dir.value} value={dir.value}>
                        {dir.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="180">Last 6 months</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clicks">Clicks</SelectItem>
                    <SelectItem value="impressions">Impressions</SelectItem>
                    <SelectItem value="ctr">CTR</SelectItem>
                    <SelectItem value="position">Position</SelectItem>
                    <SelectItem value="backlinks">Backlinks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Export</label>
                <Button 
                  onClick={exportToCSV}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Custom Date Range */}
            {dateRange === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              Showing top pages from Search Console data for NotifyVisitors.com
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Top Performing Pages
          </CardTitle>
          <CardDescription>
            Showing {startIndex + 1}-{Math.min(startIndex + pageSize, sortedPages.length)} of {sortedPages.length} pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading top pages...</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[280px] max-w-[300px]">Page</TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort("clicks")}
                        className="font-semibold h-auto p-1 justify-center w-full"
                      >
                        Clicks
                        {sortBy === "clicks" && (
                          sortOrder === "desc" ? <ChevronDown className="ml-1 h-3 w-3" /> : <ChevronUp className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-center min-w-[100px]">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort("impressions")}
                        className="font-semibold h-auto p-1 justify-center w-full"
                      >
                        Impressions
                        {sortBy === "impressions" && (
                          sortOrder === "desc" ? <ChevronDown className="ml-1 h-3 w-3" /> : <ChevronUp className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-center min-w-[70px]">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort("ctr")}
                        className="font-semibold h-auto p-1 justify-center w-full"
                      >
                        CTR %
                        {sortBy === "ctr" && (
                          sortOrder === "desc" ? <ChevronDown className="ml-1 h-3 w-3" /> : <ChevronUp className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort("position")}
                        className="font-semibold h-auto p-1 justify-center w-full"
                      >
                        Position
                        {sortBy === "position" && (
                          sortOrder === "desc" ? <ChevronDown className="ml-1 h-3 w-3" /> : <ChevronUp className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort("internalLinks")}
                        className="font-semibold h-auto p-1 justify-center w-full"
                      >
                        Internal
                        {sortBy === "internalLinks" && (
                          sortOrder === "desc" ? <ChevronDown className="ml-1 h-3 w-3" /> : <ChevronUp className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort("externalLinks")}
                        className="font-semibold h-auto p-1 justify-center w-full"
                      >
                        External
                        {sortBy === "externalLinks" && (
                          sortOrder === "desc" ? <ChevronDown className="ml-1 h-3 w-3" /> : <ChevronUp className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleSort("backlinks")}
                        className="font-semibold h-auto p-1 justify-center w-full"
                      >
                        Backlinks
                        {sortBy === "backlinks" && (
                          sortOrder === "desc" ? <ChevronDown className="ml-1 h-3 w-3" /> : <ChevronUp className="ml-1 h-3 w-3" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-center min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="max-w-[300px]">
                        <div className="space-y-1">
                          <div className="font-medium text-sm leading-tight truncate">
                            {page.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {page.url}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 whitespace-nowrap">
                          {formatNumber(page.clicks)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatNumber(page.impressions)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium whitespace-nowrap">
                          {(page.ctr * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${getPositionColor(page.position)} whitespace-nowrap`}>
                          #{page.position.toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm whitespace-nowrap">
                          {page.internalLinks}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm whitespace-nowrap">
                          {page.externalLinks}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 whitespace-nowrap">
                          {page.backlinks}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="whitespace-nowrap"
                        >
                          <a 
                            href={page.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination */}
          {sortedPages.length > pageSize && (
            <div className="flex items-center justify-between space-x-2 py-4 px-6 border-t">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Rows per page:
                </span>
                <Select value={pageSize.toString()} onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPagesForPagination}
                </span>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPagesForPagination, currentPage + 1))}
                    disabled={currentPage === totalPagesForPagination}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TopPages;