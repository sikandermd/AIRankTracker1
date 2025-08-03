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
  const [selectedDomain, setSelectedDomain] = useState("all");

  // Mock data for demonstration - this would come from Search Console API
  const mockTopPages: TopPage[] = [
    {
      id: "1",
      url: "https://www.notifyvisitors.com/customer-data-platform",
      title: "Customer Data Platform - Unified Customer View | NotifyVisitors",
      clicks: 1250,
      impressions: 12500,
      ctr: 10.0,
      position: 8.5,
      internalLinks: 45,
      externalLinks: 12,
      backlinks: 89,
      lastUpdated: "2025-08-03T18:00:00Z"
    },
    {
      id: "2", 
      url: "https://www.notifyvisitors.com/marketing-automation",
      title: "Marketing Automation Platform - Drive Engagement | NotifyVisitors",
      clicks: 980,
      impressions: 15600,
      ctr: 6.3,
      position: 12.2,
      internalLinks: 38,
      externalLinks: 8,
      backlinks: 67,
      lastUpdated: "2025-08-03T17:30:00Z"
    },
    {
      id: "3",
      url: "https://www.notifyvisitors.com/customer-engagement-platform", 
      title: "Customer Engagement Platform - Personalized Experiences",
      clicks: 756,
      impressions: 9800,
      ctr: 7.7,
      position: 15.8,
      internalLinks: 52,
      externalLinks: 15,
      backlinks: 134,
      lastUpdated: "2025-08-03T16:45:00Z"
    },
    {
      id: "4",
      url: "https://www.notifyvisitors.com/email-marketing",
      title: "Email Marketing Software - Advanced Campaigns | NotifyVisitors", 
      clicks: 645,
      impressions: 11200,
      ctr: 5.8,
      position: 18.3,
      internalLinks: 29,
      externalLinks: 6,
      backlinks: 45,
      lastUpdated: "2025-08-03T15:20:00Z"
    },
    {
      id: "5",
      url: "https://www.notifyvisitors.com/web-push-notifications",
      title: "Web Push Notifications - Instant User Engagement",
      clicks: 523,
      impressions: 8900,
      ctr: 5.9,
      position: 22.1,
      internalLinks: 34,
      externalLinks: 4,
      backlinks: 28,
      lastUpdated: "2025-08-03T14:10:00Z"
    }
  ];

  const { data: topPages, isLoading } = useQuery<TopPage[]>({
    queryKey: ['/api/top-pages', selectedDomain, sortBy],
    queryFn: async () => {
      // Simulate API call - replace with actual Search Console API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockTopPages;
    },
  });

  const filteredPages = topPages?.filter(page =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.url.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const sortedPages = filteredPages.sort((a, b) => {
    switch (sortBy) {
      case "clicks":
        return b.clicks - a.clicks;
      case "impressions":
        return b.impressions - a.impressions;
      case "ctr":
        return b.ctr - a.ctr;
      case "position":
        return a.position - b.position;
      case "backlinks":
        return b.backlinks - a.backlinks;
      default:
        return 0;
    }
  });

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        <div>
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
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topPages?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(topPages?.reduce((sum, page) => sum + page.clicks, 0) || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +8.5% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Position</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topPages?.length 
                ? (topPages.reduce((sum, page) => sum + page.position, 0) / topPages.length).toFixed(1)
                : "0"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              +2.3 improvement
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
          <div className="flex gap-4 items-end">
            <div className="flex-1">
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
            <div className="w-48">
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
            <div className="w-48">
              <label className="text-sm font-medium">Domain</label>
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  <SelectItem value="notifyvisitors.com">NotifyVisitors.com</SelectItem>
                </SelectContent>
              </Select>
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
            {sortedPages.length} pages with search console data, link analysis, and backlink counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading top pages...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Page</TableHead>
                    <TableHead className="text-center">Clicks</TableHead>
                    <TableHead className="text-center">Impressions</TableHead>
                    <TableHead className="text-center">CTR %</TableHead>
                    <TableHead className="text-center">Position</TableHead>
                    <TableHead className="text-center">Internal Links</TableHead>
                    <TableHead className="text-center">External Links</TableHead>
                    <TableHead className="text-center">Backlinks</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm leading-tight">
                            {page.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {page.url}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {formatNumber(page.clicks)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(page.impressions)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium">
                          {page.ctr.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getPositionColor(page.position)}>
                          #{page.position.toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">
                          {page.internalLinks}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">
                          {page.externalLinks}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {page.backlinks}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
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
        </CardContent>
      </Card>
    </div>
  );
};

export default TopPages;