import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Brain, TrendingUp, Target, Lightbulb, CheckCircle, Clock, X, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ActionItem {
  task: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeframe: string;
}

interface ExpectedImpact {
  metric: string;
  currentValue: number;
  projectedValue: number;
  confidence: number;
}

interface SeoRecommendation {
  id: string;
  type: 'keyword' | 'content' | 'technical' | 'competitive';
  priority: 'high' | 'medium' | 'low';
  category: 'ai_visibility' | 'organic_ranking' | 'competitor_gap';
  title: string;
  description: string;
  actionItems: ActionItem[];
  expectedImpact: ExpectedImpact[];
  relatedKeywords: string[];
  confidenceScore: number;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  createdAt: string;
}

interface MlInsight {
  id: string;
  insightType: 'trend' | 'anomaly' | 'opportunity' | 'threat';
  title: string;
  description: string;
  data: {
    metrics: Record<string, number>;
    trends: Array<{
      period: string;
      value: number;
      change: number;
    }>;
    patterns: string[];
  };
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionability: 'immediate' | 'short_term' | 'long_term';
  createdAt: string;
}

export default function SeoRecommendations() {
  const [activeTab, setActiveTab] = useState("recommendations");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recommendations
  const { data: recommendations = [], isLoading: loadingRecommendations } = useQuery({
    queryKey: ['/api/ml/recommendations'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch insights
  const { data: insights = [], isLoading: loadingInsights } = useQuery({
    queryKey: ['/api/ml/insights'],
    refetchInterval: 30000,
  });

  // Generate new recommendations
  const generateRecommendationsMutation = useMutation({
    mutationFn: () => apiRequest('/api/ml/generate-recommendations', {
      method: 'POST',
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New AI-powered recommendations generated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ml/recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ml/insights'] });
      setIsGenerating(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to generate recommendations. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  // Update recommendation status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest(`/api/ml/recommendations/${id}`, {
        method: 'PATCH',
        body: { status },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ml/recommendations'] });
      toast({
        title: "Status Updated",
        description: "Recommendation status updated successfully!",
      });
    },
  });

  const handleGenerateRecommendations = () => {
    setIsGenerating(true);
    generateRecommendationsMutation.mutate();
  };

  const handleStatusUpdate = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'dismissed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'opportunity': return <Target className="w-4 h-4" />;
      case 'threat': return <AlertTriangle className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-orange-500" />
            AI SEO Recommendations
          </h1>
          <p className="text-muted-foreground mt-2">
            Personalized SEO recommendations powered by machine learning analysis
          </p>
        </div>
        <Button 
          onClick={handleGenerateRecommendations}
          disabled={isGenerating}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {isGenerating ? (
            <>
              <Brain className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Generate New Recommendations
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommendations">
            SEO Recommendations ({recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="insights">
            ML Insights ({insights.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {loadingRecommendations ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Generate your first AI-powered SEO recommendations to get started.
                </p>
                <Button 
                  onClick={handleGenerateRecommendations}
                  disabled={isGenerating}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Generate Recommendations
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {recommendations.map((rec: SeoRecommendation) => (
                <Card key={rec.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          {rec.title}
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority.toUpperCase()}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {rec.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(rec.status)}>
                          {rec.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Brain className="w-3 h-3 mr-1" />
                          {rec.confidenceScore}%
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Action Items */}
                    <div>
                      <h4 className="font-semibold mb-2">Action Items</h4>
                      <div className="space-y-2">
                        {rec.actionItems.map((action, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <CheckCircle className="w-4 h-4 mt-0.5 text-gray-400" />
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium">{action.task}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className={`font-medium ${getEffortColor(action.effort)}`}>
                                  Effort: {action.effort.toUpperCase()}
                                </span>
                                <span className={`font-medium ${getEffortColor(action.impact)}`}>
                                  Impact: {action.impact.toUpperCase()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {action.timeframe}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expected Impact */}
                    {rec.expectedImpact && rec.expectedImpact.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Expected Impact</h4>
                        <div className="grid gap-3">
                          {rec.expectedImpact.map((impact, index) => (
                            <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{impact.metric}</span>
                                <span className="text-xs text-muted-foreground">
                                  {impact.confidence}% confidence
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span>Current: {impact.currentValue}</span>
                                <span>→</span>
                                <span className="font-semibold text-green-600">
                                  Projected: {impact.projectedValue}
                                </span>
                              </div>
                              <Progress 
                                value={impact.confidence} 
                                className="mt-2 h-1"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Related Keywords */}
                    {rec.relatedKeywords && rec.relatedKeywords.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Related Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {rec.relatedKeywords.map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {rec.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(rec.id, 'in_progress')}
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            Start Working
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(rec.id, 'dismissed')}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Dismiss
                          </Button>
                        </>
                      )}
                      {rec.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(rec.id, 'completed')}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {loadingInsights ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : insights.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Insights Available</h3>
                <p className="text-muted-foreground">
                  Generate recommendations to unlock ML-powered insights about your SEO performance.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {insights.map((insight: MlInsight) => (
                <Card key={insight.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="flex items-center gap-2">
                          {getInsightIcon(insight.insightType)}
                          {insight.title}
                        </CardTitle>
                        <CardDescription>{insight.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(insight.impact)}>
                          {insight.impact.toUpperCase()} IMPACT
                        </Badge>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Brain className="w-3 h-3 mr-1" />
                          {insight.confidence}%
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Metrics */}
                    {insight.data.metrics && Object.keys(insight.data.metrics).length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Key Metrics</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(insight.data.metrics).map(([key, value]) => (
                            <div key={key} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="text-2xl font-bold text-orange-500">{value}</div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {key.replace(/_/g, ' ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Patterns */}
                    {insight.data.patterns && insight.data.patterns.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Identified Patterns</h4>
                        <div className="space-y-2">
                          {insight.data.patterns.map((pattern, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              {pattern}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trends */}
                    {insight.data.trends && insight.data.trends.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Trends</h4>
                        <div className="space-y-2">
                          {insight.data.trends.map((trend, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <span className="text-sm">{trend.period}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{trend.value}</span>
                                <span className={`text-xs ${trend.change > 0 ? 'text-green-600' : trend.change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {trend.change > 0 ? '+' : ''}{trend.change}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}