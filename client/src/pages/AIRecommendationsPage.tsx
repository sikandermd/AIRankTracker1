import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Brain, TrendingUp, FileText, Lightbulb, Search, BarChart3, Zap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AIRecommendation {
  pageUrl: string;
  pageType: 'blog' | 'landing' | 'product' | 'category';
  overallScore: number;
  aiRankingFactors?: {
    factor: string;
    score: number;
    currentState: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    expectedImpact: string;
  }[];
  topStrengths?: string[];
  criticalIssues?: string[];
  quickWins?: string[];
  recommendations: {
    category: string;
    priority: 'high' | 'medium' | 'low';
    issue: string;
    suggestion: string;
    expectedImpact: string;
    aiRankingFactor: string;
  }[];
  aiOptimizationSuggestions?: {
    contentStructure: string[];
    semanticOptimization: string[];
    userIntent: string[];
    competitiveAdvantage: string[];
  };
}

interface AnalysisResult {
  totalPages: number;
  recommendations: AIRecommendation[];
  topPriorities: any[];
  summary: {
    performance: {
      totalClicks: number;
      totalImpressions: number;
      avgCtr: number;
      avgPosition: number;
    };
    opportunities: {
      highPriorityIssues: number;
      pagesAnalyzed: number;
      pageTypeBreakdown: Record<string, number>;
    };
    topIssues: { category: string; count: number }[];
  };
}

export default function AIRecommendationsPage() {
  const [siteUrl, setSiteUrl] = useState("https://www.notifyvisitors.com");
  const [days, setDays] = useState(30);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const { toast } = useToast();

  // Bulk analysis mutation
  const analyzePagesMutation = useMutation({
    mutationFn: async (data: { siteUrl: string; days: number }) => {
      const response = await apiRequest("POST", "/api/analyze-pages", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data.data);
      toast({
        title: "Analysis Complete!",
        description: "AI recommendations have been generated for your pages.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-recommendations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze pages",
        variant: "destructive",
      });
    },
  });

  // Single page analysis mutation
  const analyzeSinglePageMutation = useMutation({
    mutationFn: async (data: { siteUrl: string; pageUrl: string }) => {
      const response = await apiRequest("POST", "/api/analyze-single-page", data);
      return await response.json();
    },
    onSuccess: (data) => {
      // Create mock result structure for single page
      const singlePageResult: AnalysisResult = {
        totalPages: 1,
        recommendations: [data.data],
        topPriorities: data.data.recommendations.filter((r: any) => r.priority === 'high'),
        summary: {
          performance: { totalClicks: 0, totalImpressions: 0, avgCtr: 0, avgPosition: 0 },
          opportunities: { highPriorityIssues: data.data.recommendations.filter((r: any) => r.priority === 'high').length, pagesAnalyzed: 1, pageTypeBreakdown: { [data.data.pageType]: 1 } },
          topIssues: []
        }
      };
      setAnalysisResult(singlePageResult);
      toast({
        title: "Page Analysis Complete!",
        description: "AI recommendations generated for the selected page.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze page",
        variant: "destructive",
      });
    },
  });

  const handleBulkAnalysis = () => {
    if (!siteUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid website URL",
        variant: "destructive",
      });
      return;
    }

    analyzePagesMutation.mutate({ siteUrl: siteUrl.trim(), days });
  };

  const handleSinglePageAnalysis = () => {
    if (!siteUrl.trim() || !selectedPage?.trim()) {
      toast({
        title: "URLs Required", 
        description: "Please enter both site URL and page URL",
        variant: "destructive",
      });
      return;
    }

    analyzeSinglePageMutation.mutate({ 
      siteUrl: siteUrl.trim(), 
      pageUrl: selectedPage.trim() 
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getPageTypeIcon = (type: string) => {
    switch (type) {
      case 'blog': return <FileText className="h-4 w-4" />;
      case 'landing': return <TrendingUp className="h-4 w-4" />;
      case 'product': return <BarChart3 className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  // Get analysis result from mutation response
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI SEO Recommendations
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Search Console data से blog और landing pages के लिए AI-powered recommendations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analysis Controls */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Analysis Setup
            </CardTitle>
            <CardDescription>
              Configure AI analysis parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="siteUrl">Website URL</Label>
              <Input
                id="siteUrl"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="days">Analysis Period (Days)</Label>
              <Input
                id="days"
                type="number"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 30)}
                min="7"
                max="365"
              />
            </div>

            <Button 
              onClick={handleBulkAnalysis}
              disabled={analyzePagesMutation.isPending}
              className="w-full"
            >
              {analyzePagesMutation.isPending ? "Analyzing..." : "🧠 Analyze All Pages"}
            </Button>

            <div className="border-t pt-4">
              <Label htmlFor="pageUrl">Single Page Analysis</Label>
              <Input
                id="pageUrl"
                value={selectedPage || ""}
                onChange={(e) => setSelectedPage(e.target.value)}
                placeholder="/blog/example-post"
                className="mb-2"
              />
              <Button 
                onClick={handleSinglePageAnalysis}
                disabled={analyzeSinglePageMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {analyzeSinglePageMutation.isPending ? "Analyzing..." : "Analyze Single Page"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              AI-powered recommendations based on Search Console data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!analysisResult ? (
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Analysis Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Start your first AI analysis to get personalized SEO recommendations
                </p>
                {analyzePagesMutation.error && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-left">
                        <h4 className="font-medium text-yellow-800 mb-1">Search Console Setup Required</h4>
                        <p className="text-sm text-yellow-700 mb-2">
                          For real Search Console data, add your Google Service Account key to Secrets.
                        </p>
                        <p className="text-xs text-yellow-600">
                          Demo mode will show AI analysis with sample data for testing.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <Button onClick={handleBulkAnalysis} disabled={analyzePagesMutation.isPending}>
                  {analyzePagesMutation.isPending ? "Analyzing..." : "🧠 Start AI Analysis (Demo Mode)"}
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  <TabsTrigger value="priorities">Top Priorities</TabsTrigger>
                  <TabsTrigger value="pages">Page Details</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold">{analysisResult.totalPages}</div>
                        <p className="text-sm text-gray-600">Pages Analyzed</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-red-600">
                          {analysisResult.summary.opportunities.highPriorityIssues}
                        </div>
                        <p className="text-sm text-gray-600">High Priority Issues</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">
                          {analysisResult.summary.performance.avgPosition.toFixed(1)}
                        </div>
                        <p className="text-sm text-gray-600">Avg Position</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                          {analysisResult.summary.performance.avgCtr.toFixed(1)}%
                        </div>
                        <p className="text-sm text-gray-600">Avg CTR</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Issue Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analysisResult.summary.topIssues.map((issue, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="font-medium">{issue.category}</span>
                            <Badge variant="outline">{issue.count} pages</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                  <div className="space-y-4">
                    {analysisResult.recommendations.slice(0, 5).map((rec, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-sm">
                              {getPageTypeIcon(rec.pageType)}
                              {rec.pageUrl}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Progress value={rec.overallScore} className="w-20" />
                              <span className="text-sm font-medium">{rec.overallScore}%</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {rec.recommendations.slice(0, 2).map((recommendation, idx) => (
                              <div key={idx} className="border-l-4 border-blue-500 pl-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant={getPriorityColor(recommendation.priority)}>
                                    {recommendation.priority}
                                  </Badge>
                                  <span className="font-medium text-sm">{recommendation.category}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{recommendation.issue}</p>
                                <p className="text-sm text-green-600">{recommendation.suggestion}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Expected: {recommendation.expectedImpact}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="priorities" className="space-y-4">
                  <div className="space-y-3">
                    {analysisResult.topPriorities.slice(0, 10).map((priority, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="destructive">High Priority</Badge>
                                <span className="text-sm font-medium">{priority.category}</span>
                              </div>
                              <p className="text-sm text-gray-900 dark:text-white mb-1">
                                {priority.suggestion}
                              </p>
                              <p className="text-xs text-gray-500">
                                Page: {priority.pageUrl} • Impact: {priority.expectedImpact}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="pages" className="space-y-4">
                  <div className="grid gap-4">
                    {analysisResult.recommendations.map((page, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              {getPageTypeIcon(page.pageType)}
                              <span className="text-sm">{page.pageUrl}</span>
                            </CardTitle>
                            <Badge variant={page.pageType === 'blog' ? 'default' : 'secondary'}>
                              {page.pageType}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Content Structure</h4>
                              <ul className="text-sm space-y-1">
                                {page.aiOptimizationSuggestions.contentStructure.slice(0, 3).map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span className="text-blue-500">•</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">User Intent</h4>
                              <ul className="text-sm space-y-1">
                                {page.aiOptimizationSuggestions.userIntent.slice(0, 3).map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-1">
                                    <span className="text-green-500">•</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}