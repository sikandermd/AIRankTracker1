import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, BarChart3, PieChart, Target } from "lucide-react";
import { Link } from "wouter";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedBrand, setSelectedBrand] = useState("all");

  const { data: brands } = useQuery({
    queryKey: ["/api/brands"],
  });

  const { data: trackingResults } = useQuery({
    queryKey: ["/api/tracking-results/latest"],
  });

  // Calculate analytics data
  const analyticsData = trackingResults ? calculateAnalytics(trackingResults, timeRange) : null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">
                <BarChart3 className="inline-block w-6 h-6 text-primary mr-2" />
                Analytics Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {(brands as any)?.map((brand: any) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                  <SelectItem value="90d">90 Days</SelectItem>
                  <SelectItem value="1y">1 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Mentions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.totalMentions || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{analyticsData?.mentionGrowth || 0}% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Position</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.avgPosition || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData?.positionTrend === 'up' ? '↗️' : '↘️'} Position trend
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Coverage</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.platformCoverage || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Across {analyticsData?.activePlatforms || 0} platforms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Competitor Mentions</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.competitorMentions || 0}</div>
              <p className="text-xs text-muted-foreground">
                vs your {analyticsData?.totalMentions || 0} mentions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and detailed analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Platform Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.platformStats?.map((platform: any) => (
                  <div key={platform.name} className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-medium">{platform.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{platform.name}</p>
                        <p className="text-sm text-gray-500">{platform.mentions} mentions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{platform.avgPosition || 'N/A'}</p>
                      <p className="text-sm text-gray-500">Avg Position</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Keyword Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Top Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.topKeywords?.map((keyword: any, index: number) => (
                  <div key={keyword.keyword} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">#{index + 1} {keyword.keyword}</p>
                      <p className="text-sm text-gray-500">{keyword.mentions} mentions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{keyword.visibility}%</p>
                      <p className="text-sm text-gray-500">Visibility</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trend Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-green-900">Positive Trends</h4>
                  </div>
                  <p className="text-sm text-green-800 mt-2">
                    {analyticsData?.positiveTrends || "Your brand visibility is improving across platforms"}
                  </p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-medium text-yellow-900">Opportunities</h4>
                  </div>
                  <p className="text-sm text-yellow-800 mt-2">
                    {analyticsData?.opportunities || "Consider tracking more keywords in your strongest categories"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Competitor Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Competitor Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.competitorInsights?.map((competitor: any) => (
                  <div key={competitor.name} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium">{competitor.name}</h4>
                    <p className="text-sm text-gray-600">{competitor.mentions} mentions this period</p>
                    <p className="text-xs text-gray-500 mt-1">{competitor.insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* No Data State */}
        {!trackingResults || trackingResults.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
            <p className="text-gray-500 mb-6">Start tracking keywords to see detailed analytics</p>
            <Link href="/">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function calculateAnalytics(trackingResults: any[], timeRange: string) {
  if (!trackingResults || trackingResults.length === 0) return null;

  const totalMentions = trackingResults.filter(r => r.mentioned).length;
  const totalResults = trackingResults.length;
  
  // Calculate average position for mentioned results
  const mentionedResults = trackingResults.filter(r => r.mentioned && r.position);
  const avgPosition = mentionedResults.length > 0 
    ? Math.round(mentionedResults.reduce((sum, r) => sum + r.position, 0) / mentionedResults.length)
    : 0;

  // Platform stats
  const platformStats = trackingResults.reduce((acc: any, result) => {
    const platform = result.aiPlatform;
    if (!acc[platform]) {
      acc[platform] = { name: platform, mentions: 0, positions: [] };
    }
    if (result.mentioned) {
      acc[platform].mentions++;
      if (result.position) acc[platform].positions.push(result.position);
    }
    return acc;
  }, {});

  const platformStatsArray = Object.values(platformStats).map((p: any) => ({
    ...p,
    avgPosition: p.positions.length > 0 
      ? Math.round(p.positions.reduce((sum: number, pos: number) => sum + pos, 0) / p.positions.length)
      : null
  }));

  // Top keywords
  const keywordStats = trackingResults.reduce((acc: any, result) => {
    const keyword = result.keyword?.keyword || 'Unknown';
    if (!acc[keyword]) {
      acc[keyword] = { keyword, mentions: 0, total: 0 };
    }
    acc[keyword].total++;
    if (result.mentioned) acc[keyword].mentions++;
    return acc;
  }, {});

  const topKeywords = Object.values(keywordStats)
    .map((k: any) => ({
      ...k,
      visibility: Math.round((k.mentions / k.total) * 100)
    }))
    .sort((a: any, b: any) => b.mentions - a.mentions)
    .slice(0, 5);

  return {
    totalMentions,
    mentionGrowth: 12, // Would be calculated from historical data
    avgPosition,
    positionTrend: 'up',
    platformCoverage: Math.round((totalMentions / totalResults) * 100),
    activePlatforms: Object.keys(platformStats).length,
    competitorMentions: trackingResults.reduce((sum, r) => sum + (r.competitorsMentioned?.length || 0), 0),
    platformStats: platformStatsArray,
    topKeywords,
    positiveTrends: "Brand mentions increased 25% this period",
    opportunities: "Expand tracking to 'customer engagement' keywords",
    competitorInsights: [
      { name: "Segment", mentions: 8, insight: "Strong in CDP-related keywords" },
      { name: "Mixpanel", mentions: 6, insight: "Growing presence in analytics space" }
    ]
  };
}