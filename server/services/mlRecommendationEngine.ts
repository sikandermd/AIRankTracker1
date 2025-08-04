import { IStorage } from '../storage';
import OpenAI from 'openai';
import { 
  SelectUserProfile, 
  SelectSeoRecommendation, 
  SelectMlInsight,
  SelectPerformanceMetric,
  InsertSeoRecommendation,
  InsertMlInsight,
  InsertPerformanceMetric
} from '@shared/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export class MLRecommendationEngine {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  // Generate personalized SEO recommendations using ML analysis
  async generateRecommendations(userId: string): Promise<SelectSeoRecommendation[]> {
    try {
      console.log(`🤖 Generating ML-powered SEO recommendations for user: ${userId}`);

      // Get user profile and historical data
      const userProfile = await this.storage.getUserProfile(userId);
      const userBrands = await this.storage.getBrands();
      const trackingResults = await this.storage.getTrackingResults();
      const competitorData = await this.storage.getCompetitorAnalysis();
      
      // Analyze performance patterns
      const performanceInsights = await this.analyzePerformancePatterns(userId);
      
      // Generate AI-powered recommendations
      const recommendations = await this.generateAIRecommendations(
        userProfile,
        userBrands,
        trackingResults,
        competitorData,
        performanceInsights
      );

      // Store recommendations in database
      const savedRecommendations = [];
      for (const rec of recommendations) {
        const saved = await this.storage.createSeoRecommendation({
          userId,
          brandId: rec.brandId,
          type: rec.type,
          priority: rec.priority,
          category: rec.category,
          title: rec.title,
          description: rec.description,
          actionItems: rec.actionItems,
          expectedImpact: rec.expectedImpact,
          relatedKeywords: rec.relatedKeywords,
          confidenceScore: rec.confidenceScore,
          status: 'pending'
        });
        savedRecommendations.push(saved);
      }

      console.log(`✅ Generated ${savedRecommendations.length} personalized recommendations`);
      return savedRecommendations;

    } catch (error) {
      console.error('❌ Error generating ML recommendations:', error);
      throw error;
    }
  }

  // Generate AI-powered recommendations using OpenAI
  private async generateAIRecommendations(
    userProfile: SelectUserProfile | null,
    brands: any[],
    trackingResults: any[],
    competitorData: any[],
    performanceInsights: SelectMlInsight[]
  ): Promise<Partial<InsertSeoRecommendation>[]> {
    
    const prompt = `
You are an expert SEO strategist with deep knowledge of AI platform visibility, organic search rankings, and competitor analysis. Analyze the following data and generate personalized SEO recommendations:

USER PROFILE:
${userProfile ? `
- Industry: ${userProfile.industry || 'Not specified'}
- Business Size: ${userProfile.businessSize || 'Not specified'}
- Primary Goals: ${userProfile.primaryGoals ? userProfile.primaryGoals.join(', ') : 'Not specified'}
- Monthly Budget: ${userProfile.monthlyBudget ? '$' + userProfile.monthlyBudget : 'Not specified'}
- Preferred Channels: ${userProfile.preferredChannels ? userProfile.preferredChannels.join(', ') : 'Not specified'}
- Target Audience: ${JSON.stringify(userProfile.targetAudience)}
- Competitor Brands: ${userProfile.competitorBrands ? userProfile.competitorBrands.join(', ') : 'None'}
` : 'No user profile available'}

BRAND PERFORMANCE DATA:
${brands.map(brand => `
- Brand: ${brand.name}
  Recent AI Platform Mentions: ${trackingResults.filter(r => r.brandId === brand.id && r.mentioned).length}
  Total Tracking Results: ${trackingResults.filter(r => r.brandId === brand.id).length}
`).join('')}

COMPETITOR INSIGHTS:
${competitorData.slice(0, 10).map(comp => `
- Competitor: ${comp.competitorBrand}
- Mentions: ${comp.mentionCount}
- Visibility Score: ${comp.visibilityScore}/100
- Platform: ${comp.aiPlatform}
`).join('')}

PERFORMANCE INSIGHTS:
${performanceInsights.map(insight => `
- Type: ${insight.insightType}
- Title: ${insight.title}
- Impact: ${insight.impact}
- Confidence: ${insight.confidence}%
`).join('')}

Generate 5-8 personalized SEO recommendations. For each recommendation, provide:

1. **Type**: keyword/content/technical/competitive
2. **Priority**: high/medium/low  
3. **Category**: ai_visibility/organic_ranking/competitor_gap
4. **Title**: Clear, actionable title
5. **Description**: Detailed explanation (2-3 sentences)
6. **Action Items**: Array of specific tasks with effort/impact/timeframe
7. **Expected Impact**: Metrics with current/projected values and confidence
8. **Related Keywords**: Relevant keywords array
9. **Confidence Score**: 0-100 based on data quality and potential

Focus on AI platform visibility improvements, organic ranking opportunities, and competitive gaps. Ensure recommendations are specific, actionable, and data-driven.

Return the response as a JSON array of recommendation objects.
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert SEO strategist specializing in AI platform visibility and personalized recommendations. Always return valid JSON arrays."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse AI response and structure recommendations
      const aiRecommendations = JSON.parse(content);
      
      return aiRecommendations.map((rec: any, index: number) => ({
        brandId: brands[index % brands.length]?.id || brands[0]?.id,
        type: rec.type || 'keyword',
        priority: rec.priority || 'medium',
        category: rec.category || 'ai_visibility',
        title: rec.title || 'SEO Recommendation',
        description: rec.description || 'Improve your SEO performance',
        actionItems: rec.actionItems || [
          {
            task: 'Implement recommendation',
            effort: 'medium',
            impact: 'medium',
            timeframe: '1-2 weeks'
          }
        ],
        expectedImpact: rec.expectedImpact || [
          {
            metric: 'AI Visibility',
            currentValue: 0,
            projectedValue: 25,
            confidence: 70
          }
        ],
        relatedKeywords: rec.relatedKeywords || [],
        confidenceScore: rec.confidenceScore || 75
      }));

    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      
      // Fallback recommendations based on data patterns
      return this.generateFallbackRecommendations(brands, trackingResults, competitorData);
    }
  }

  // Analyze performance patterns to generate insights
  private async analyzePerformancePatterns(userId: string): Promise<SelectMlInsight[]> {
    try {
      const insights: Partial<InsertMlInsight>[] = [];
      
      // Get recent tracking data
      const recentResults = await this.storage.getTrackingResults();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentData = recentResults.filter(r => 
        new Date(r.trackedAt) >= thirtyDaysAgo
      );

      // Pattern 1: AI Platform Performance Trends
      const platformPerformance = this.analyzePlatformTrends(recentData);
      if (platformPerformance.insight) {
        insights.push({
          userId,
          brandId: null,
          insightType: 'trend',
          title: 'AI Platform Performance Trend',
          description: platformPerformance.insight,
          data: {
            metrics: platformPerformance.metrics,
            trends: platformPerformance.trends,
            patterns: platformPerformance.patterns
          },
          confidence: platformPerformance.confidence,
          impact: platformPerformance.impact,
          actionability: 'short_term'
        });
      }

      // Pattern 2: Competitor Activity Anomalies
      const competitorInsights = await this.analyzeCompetitorAnomalies(userId);
      insights.push(...competitorInsights);

      // Pattern 3: Keyword Performance Opportunities
      const keywordOpportunities = this.identifyKeywordOpportunities(recentData);
      if (keywordOpportunities.length > 0) {
        insights.push(...keywordOpportunities.map(opp => ({
          userId,
          brandId: opp.brandId,
          insightType: 'opportunity' as const,
          title: `Keyword Opportunity: ${opp.keyword}`,
          description: opp.description,
          data: {
            metrics: opp.metrics,
            trends: opp.trends,
            patterns: opp.patterns
          },
          confidence: opp.confidence,
          impact: opp.impact,
          actionability: 'immediate' as const
        })));
      }

      // Save insights to database
      const savedInsights = [];
      for (const insight of insights) {
        const saved = await this.storage.createMlInsight(insight);
        savedInsights.push(saved);
      }

      return savedInsights;

    } catch (error) {
      console.error('Error analyzing performance patterns:', error);
      return [];
    }
  }

  // Analyze AI platform performance trends
  private analyzePlatformTrends(recentData: any[]) {
    const platforms = ['gpt', 'claude', 'gemini', 'perplexity'];
    const metrics: Record<string, number> = {};
    const trends = [];
    const patterns = [];

    for (const platform of platforms) {
      const platformData = recentData.filter(r => r.aiPlatform === platform);
      const mentionRate = platformData.filter(r => r.mentioned).length / Math.max(platformData.length, 1);
      metrics[`${platform}_mention_rate`] = Math.round(mentionRate * 100);
      
      if (mentionRate > 0.3) {
        patterns.push(`Strong performance on ${platform.toUpperCase()}`);
      } else if (mentionRate < 0.1) {
        patterns.push(`Low visibility on ${platform.toUpperCase()}`);
      }
    }

    // Calculate weekly trends
    const weeklyData = this.groupDataByWeek(recentData);
    weeklyData.forEach((week, index) => {
      const mentionRate = week.mentioned / Math.max(week.total, 1);
      trends.push({
        period: `Week ${index + 1}`,
        value: Math.round(mentionRate * 100),
        change: index > 0 ? Math.round(mentionRate * 100) - trends[index - 1].value : 0
      });
    });

    const avgMentionRate = Object.values(metrics).reduce((a, b) => a + b, 0) / platforms.length;
    
    return {
      insight: avgMentionRate > 25 
        ? `Strong AI platform visibility with ${avgMentionRate.toFixed(1)}% average mention rate`
        : `AI platform visibility needs improvement - currently at ${avgMentionRate.toFixed(1)}% average mention rate`,
      metrics,
      trends,
      patterns,
      confidence: recentData.length > 20 ? 85 : 60,
      impact: avgMentionRate > 25 ? 'medium' : 'high'
    };
  }

  // Group tracking data by week for trend analysis
  private groupDataByWeek(data: any[]) {
    const weeks: Array<{mentioned: number, total: number}> = [];
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const now = new Date();
    
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now.getTime() - (i + 1) * oneWeek);
      const weekEnd = new Date(now.getTime() - i * oneWeek);
      
      const weekData = data.filter(r => {
        const date = new Date(r.trackedAt);
        return date >= weekStart && date < weekEnd;
      });
      
      weeks.unshift({
        mentioned: weekData.filter(r => r.mentioned).length,
        total: weekData.length
      });
    }
    
    return weeks;
  }

  // Analyze competitor anomalies
  private async analyzeCompetitorAnomalies(userId: string): Promise<Partial<InsertMlInsight>[]> {
    const insights: Partial<InsertMlInsight>[] = [];
    
    try {
      const competitorData = await this.storage.getCompetitorAnalysis();
      const recentCompetitors = competitorData.filter(c => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(c.analysisDate) >= thirtyDaysAgo;
      });

      // Find competitors with sudden increase in mentions
      const competitorTrends = new Map<string, number[]>();
      recentCompetitors.forEach(comp => {
        if (!competitorTrends.has(comp.competitorBrand)) {
          competitorTrends.set(comp.competitorBrand, []);
        }
        competitorTrends.get(comp.competitorBrand)!.push(comp.mentionCount);
      });

      competitorTrends.forEach((mentions, competitor) => {
        const avgMentions = mentions.reduce((a, b) => a + b, 0) / mentions.length;
        const recentMentions = mentions.slice(-5).reduce((a, b) => a + b, 0) / Math.min(mentions.length, 5);
        
        if (recentMentions > avgMentions * 1.5 && avgMentions > 2) {
          insights.push({
            userId,
            brandId: null,
            insightType: 'threat',
            title: `Competitor Activity Spike: ${competitor}`,
            description: `${competitor} has shown a ${Math.round((recentMentions / avgMentions - 1) * 100)}% increase in AI platform mentions recently.`,
            data: {
              metrics: {
                previous_avg: Math.round(avgMentions),
                recent_avg: Math.round(recentMentions),
                increase_percent: Math.round((recentMentions / avgMentions - 1) * 100)
              },
              trends: [],
              patterns: [`Increased activity from ${competitor}`, 'Potential competitive threat']
            },
            confidence: 80,
            impact: 'high',
            actionability: 'immediate'
          });
        }
      });

    } catch (error) {
      console.error('Error analyzing competitor anomalies:', error);
    }
    
    return insights;
  }

  // Identify keyword opportunities
  private identifyKeywordOpportunities(recentData: any[]) {
    const keywordMap = new Map<string, any[]>();
    
    // Group data by keyword
    recentData.forEach(result => {
      const key = `${result.keywordId}_${result.brandId}`;
      if (!keywordMap.has(key)) {
        keywordMap.set(key, []);
      }
      keywordMap.get(key)!.push(result);
    });

    const opportunities = [];
    
    keywordMap.forEach((results, key) => {
      const mentioned = results.filter(r => r.mentioned).length;
      const total = results.length;
      const mentionRate = mentioned / total;
      
      // Look for keywords with low mention rates but high potential
      if (mentionRate < 0.2 && total >= 5) {
        const platforms = [...new Set(results.map(r => r.aiPlatform))];
        
        opportunities.push({
          keyword: key,
          brandId: results[0].brandId,
          description: `Low visibility keyword with potential across ${platforms.length} AI platforms`,
          metrics: {
            mention_rate: Math.round(mentionRate * 100),
            total_attempts: total,
            successful_mentions: mentioned,
            platforms_tested: platforms.length
          },
          trends: [],
          patterns: [
            `Low ${Math.round(mentionRate * 100)}% mention rate`,
            `Tested across ${platforms.length} platforms`,
            'Optimization opportunity'
          ],
          confidence: total >= 10 ? 75 : 60,
          impact: platforms.length >= 3 ? 'high' : 'medium'
        });
      }
    });

    return opportunities.slice(0, 3); // Limit to top 3 opportunities
  }

  // Generate fallback recommendations when AI fails
  private generateFallbackRecommendations(
    brands: any[],
    trackingResults: any[],
    competitorData: any[]
  ): Partial<InsertSeoRecommendation>[] {
    const recommendations: Partial<InsertSeoRecommendation>[] = [];

    // Recommendation 1: Improve AI Platform Visibility
    recommendations.push({
      brandId: brands[0]?.id,
      type: 'content',
      priority: 'high',
      category: 'ai_visibility',
      title: 'Enhance AI Platform Content Strategy',
      description: 'Optimize content to improve visibility across AI platforms by focusing on comprehensive, authority-building content that AI models prefer to cite.',
      actionItems: [
        {
          task: 'Create comprehensive guides and resources',
          effort: 'high',
          impact: 'high',
          timeframe: '2-4 weeks'
        },
        {
          task: 'Optimize existing content for AI readability',
          effort: 'medium',
          impact: 'medium',
          timeframe: '1-2 weeks'
        }
      ],
      expectedImpact: [
        {
          metric: 'AI Platform Mentions',
          currentValue: trackingResults.filter(r => r.mentioned).length,
          projectedValue: Math.round(trackingResults.filter(r => r.mentioned).length * 1.5),
          confidence: 75
        }
      ],
      relatedKeywords: [],
      confidenceScore: 80
    });

    // Recommendation 2: Competitor Gap Analysis
    if (competitorData.length > 0) {
      const topCompetitor = competitorData.reduce((prev, current) => 
        prev.visibilityScore > current.visibilityScore ? prev : current
      );

      recommendations.push({
        brandId: brands[0]?.id,
        type: 'competitive',
        priority: 'high',
        category: 'competitor_gap',
        title: `Close Gap with ${topCompetitor.competitorBrand}`,
        description: `${topCompetitor.competitorBrand} has ${topCompetitor.visibilityScore}% visibility score. Focus on keywords and content strategies where they excel.`,
        actionItems: [
          {
            task: 'Analyze competitor content strategy',
            effort: 'medium',
            impact: 'high',
            timeframe: '1 week'
          },
          {
            task: 'Implement competitive keyword targeting',
            effort: 'high',
            impact: 'high',
            timeframe: '2-3 weeks'
          }
        ],
        expectedImpact: [
          {
            metric: 'Competitive Visibility Score',
            currentValue: 0,
            projectedValue: Math.round(topCompetitor.visibilityScore * 0.7),
            confidence: 70
          }
        ],
        relatedKeywords: [],
        confidenceScore: 75
      });
    }

    return recommendations;
  }

  // Get recommendations for a user
  async getRecommendations(userId: string, filters?: {
    type?: string;
    priority?: string;
    status?: string;
  }): Promise<SelectSeoRecommendation[]> {
    return await this.storage.getSeoRecommendations(userId, filters);
  }

  // Update recommendation status
  async updateRecommendationStatus(
    recommendationId: string, 
    status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
  ): Promise<SelectSeoRecommendation> {
    return await this.storage.updateSeoRecommendation(recommendationId, { 
      status,
      implementedAt: status === 'completed' ? new Date() : undefined
    });
  }

  // Get ML insights for a user
  async getInsights(userId: string): Promise<SelectMlInsight[]> {
    return await this.storage.getMlInsights(userId);
  }

  // Track performance metrics
  async trackPerformanceMetric(metric: Partial<InsertPerformanceMetric>): Promise<SelectPerformanceMetric> {
    return await this.storage.createPerformanceMetric(metric);
  }
}