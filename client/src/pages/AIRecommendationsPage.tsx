import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertCircle, 
  Brain, 
  Search, 
  Globe, 
  CheckCircle,
  XCircle,
  TrendingUp,
  FileText,
  Eye,
  Shield,
  Clock,
  Zap,
  Target,
  Users,
  Award,
  Link,
  Database,
  Sparkles,
  BarChart3,
  Lightbulb
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AIVisibilityFactor {
  id: number;
  name: string;
  score: number;
  analysis: string;
  actionableAdvice: string;
  icon: React.ReactNode;
}

interface AIVisibilityReport {
  url?: string;
  brandName?: string;
  overallScore: number;
  factors: AIVisibilityFactor[];
  topQuickWins: string[];
  llmCitabilityRating: 'Low' | 'Medium' | 'High';
  sentimentInsights: {
    brandMentionSentiment: string;
    negativeSignals: string[];
    neutralCues: string[];
  };
  extractedFAQs: { question: string; answer: string }[];
  citationsList: string[];
}

export default function AIRecommendationsPage() {
  const [analysisType, setAnalysisType] = useState<'url' | 'brand'>('url');
  const [url, setUrl] = useState("");
  const [brandName, setBrandName] = useState("");
  const [domain, setDomain] = useState("");
  const [queries, setQueries] = useState("");
  const [report, setReport] = useState<AIVisibilityReport | null>(null);
  const { toast } = useToast();

  const aiVisibilityFactors = [
    { id: 1, name: "Schema Markup (FAQPage, HowTo, Article)", icon: <Database className="h-4 w-4" /> },
    { id: 2, name: "E-E-A-T (Expertise, Experience, Author Credibility)", icon: <Award className="h-4 w-4" /> },
    { id: 3, name: "Conversational / Question-Answer Tone", icon: <Users className="h-4 w-4" /> },
    { id: 4, name: "Technical Performance (page speed, crawlability)", icon: <Zap className="h-4 w-4" /> },
    { id: 5, name: "Accuracy & Query Intent Relevance", icon: <Target className="h-4 w-4" /> },
    { id: 6, name: "Clarity & Readability (bullets, headings, short paragraphs)", icon: <FileText className="h-4 w-4" /> },
    { id: 7, name: "Freshness / Content Recency", icon: <Clock className="h-4 w-4" /> },
    { id: 8, name: "Semantic Relevance / Intent Recognition (LSI keywords)", icon: <Brain className="h-4 w-4" /> },
    { id: 9, name: "User Engagement Signals (if available)", icon: <Eye className="h-4 w-4" /> },
    { id: 10, name: "Citation Depth & Source Authority", icon: <Shield className="h-4 w-4" /> },
    { id: 11, name: "Internal Linking & Topical Hub Structure", icon: <Link className="h-4 w-4" /> },
    { id: 12, name: "Content Depth & Original Use Cases", icon: <Sparkles className="h-4 w-4" /> },
    { id: 13, name: "Keyword Stuffing / Spammy Signal Avoidance", icon: <XCircle className="h-4 w-4" /> },
    { id: 14, name: "Topical Focus vs Generic Content", icon: <Target className="h-4 w-4" /> },
    { id: 15, name: "Brand Mentions on reliable domains", icon: <Globe className="h-4 w-4" /> },
    { id: 16, name: "Entity Signals / Knowledge Graph Metadata", icon: <Database className="h-4 w-4" /> },
    { id: 17, name: "Retrieval-Augmented Generation compatibility (RAG format)", icon: <Brain className="h-4 w-4" /> },
    { id: 18, name: "Multi-format layout (tables, quick facts, visuals)", icon: <BarChart3 className="h-4 w-4" /> },
    { id: 19, name: "Proper HTML Tag Hierarchy (h1/h2/h3)", icon: <FileText className="h-4 w-4" /> },
    { id: 20, name: "Human Feedback / Upvotes or Community Ratings", icon: <Users className="h-4 w-4" /> }
  ];

  const analyzeVisibilityMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/ai-visibility-audit", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setReport(data);
      toast({
        title: "Analysis Complete!",
        description: "AI visibility audit has been generated with detailed recommendations.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze visibility",
        variant: "destructive",
      });
    },
  });

  const handleAnalysis = () => {
    if (analysisType === 'url') {
      if (!url.trim()) {
        toast({
          title: "URL Required",
          description: "Please enter a valid URL to analyze",
          variant: "destructive",
        });
        return;
      }
      analyzeVisibilityMutation.mutate({ type: 'url', url: url.trim() });
    } else {
      if (!brandName.trim() || !domain.trim() || !queries.trim()) {
        toast({
          title: "Brand Details Required", 
          description: "Please fill in brand name, domain, and search queries",
          variant: "destructive",
        });
        return;
      }
      analyzeVisibilityMutation.mutate({ 
        type: 'brand', 
        brandName: brandName.trim(), 
        domain: domain.trim(), 
        queries: queries.split('\n').filter(q => q.trim())
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreProgress = (score: number) => {
    return (score / 10) * 100;
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'High': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI Visibility Auditor Agent
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Professional 20-Factor Analysis for LLM Citation Optimization (ChatGPT, Perplexity, Claude, Gemini, AI Overviews)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analysis Controls */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Analysis Setup
            </CardTitle>
            <CardDescription>
              Analyze webpage or brand presence for AI visibility across 20 ranking factors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="analysisType">Analysis Type</Label>
              <Select value={analysisType} onValueChange={(value: 'url' | 'brand') => setAnalysisType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">URL Analysis</SelectItem>
                  <SelectItem value="brand">Brand + Query Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {analysisType === 'url' ? (
              <div>
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/page"
                />
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="brandName">Brand Name</Label>
                  <Input
                    id="brandName"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Your Brand Name"
                  />
                </div>
                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="yourdomain.com"
                  />
                </div>
                <div>
                  <Label htmlFor="queries">AI Search Queries (one per line)</Label>
                  <Textarea
                    id="queries"
                    value={queries}
                    onChange={(e) => setQueries(e.target.value)}
                    placeholder="best marketing automation tools&#10;customer engagement platforms&#10;email marketing software"
                    rows={4}
                  />
                </div>
              </>
            )}

            <Button 
              onClick={handleAnalysis}
              disabled={analyzeVisibilityMutation.isPending}
              className="w-full"
            >
              {analyzeVisibilityMutation.isPending ? "Analyzing..." : "🔍 Start AI Visibility Audit"}
            </Button>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>AI Visibility Analysis Report</CardTitle>
            <CardDescription>
              Comprehensive analysis of 20 AI ranking factors with actionable recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!report ? (
              <div className="text-center py-12">
                <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Analysis Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Start your first AI visibility audit to understand how your content performs in LLM-driven search environments
                </p>
                <Button onClick={handleAnalysis} disabled={analyzeVisibilityMutation.isPending}>
                  {analyzeVisibilityMutation.isPending ? "Analyzing..." : "🔍 Start Analysis"}
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="factors">20 Factors</TabsTrigger>
                  <TabsTrigger value="recommendations">Quick Wins</TabsTrigger>
                  <TabsTrigger value="citations">Citations</TabsTrigger>
                  <TabsTrigger value="faqs">FAQs</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-3xl font-bold">{report.overallScore}</div>
                        <p className="text-sm text-gray-600">Overall Visibility Score</p>
                        <Progress value={(report.overallScore / 10) * 100} className="mt-2" />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className={`text-2xl font-bold ${getRatingColor(report.llmCitabilityRating)} px-2 py-1 rounded`}>
                          {report.llmCitabilityRating}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">LLM Citability Rating</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">
                          {report.topQuickWins.length}
                        </div>
                        <p className="text-sm text-gray-600">Quick Wins Available</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Sentiment & Brand Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-2">Brand Mention Sentiment</h4>
                          <p className="text-sm text-gray-700">{report.sentimentInsights.brandMentionSentiment}</p>
                        </div>
                        {report.sentimentInsights.negativeSignals.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2 text-red-600">Negative Signals</h4>
                            <ul className="text-sm space-y-1">
                              {report.sentimentInsights.negativeSignals.map((signal, index) => (
                                <li key={index} className="flex items-start gap-1">
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                  {signal}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="factors" className="space-y-4">
                  <div className="space-y-3">
                    {report.factors.map((factor) => (
                      <Card key={factor.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">{factor.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm">{factor.name}</h4>
                                <div className="flex items-center gap-2">
                                  <Progress value={getScoreProgress(factor.score)} className="w-16" />
                                  <span className={`text-sm font-bold ${getScoreColor(factor.score)}`}>
                                    {factor.score}/10
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{factor.analysis}</p>
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                  <strong>Actionable Advice:</strong> {factor.actionableAdvice}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top 3 Quick Wins</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {report.topQuickWins.map((win, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            <p className="text-sm text-green-800 dark:text-green-200">{win}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="citations" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Citations Analysis</CardTitle>
                      <CardDescription>Domains that AI cites in context of your brand</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {report.citationsList.map((citation, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded">
                            <Globe className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{citation}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="faqs" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Extracted FAQs</CardTitle>
                      <CardDescription>Structured Q&A content found on the page</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {report.extractedFAQs.map((faq, index) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-4">
                            <h4 className="font-medium text-sm mb-1">{faq.question}</h4>
                            <p className="text-sm text-gray-600">{faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}