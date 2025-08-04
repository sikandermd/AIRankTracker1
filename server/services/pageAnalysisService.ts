import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PageAnalysisData {
  url: string;
  title?: string;
  metaDescription?: string;
  content?: string;
  keywords: string[];
  currentPosition: number;
  clicks: number;
  impressions: number;
  ctr: number;
  country: string;
}

interface AIRecommendation {
  pageUrl: string;
  pageType: 'blog' | 'landing' | 'product' | 'category';
  overallScore: number;
  recommendations: {
    category: string;
    priority: 'high' | 'medium' | 'low';
    issue: string;
    suggestion: string;
    expectedImpact: string;
    aiRankingFactor: string;
  }[];
  aiOptimizationSuggestions: {
    contentStructure: string[];
    semanticOptimization: string[];
    userIntent: string[];
    competitiveAdvantage: string[];
  };
}

export class PageAnalysisService {
  async analyzePageForAI(pageData: PageAnalysisData): Promise<AIRecommendation> {
    try {
      const analysisPrompt = `
        Analyze this webpage for AI search engine optimization (ChatGPT, Claude, Gemini, Perplexity).
        
        Page Data:
        - URL: ${pageData.url}
        - Title: ${pageData.title || 'Not provided'}
        - Meta Description: ${pageData.metaDescription || 'Not provided'}
        - Keywords: ${pageData.keywords.join(', ')}
        - Current Position: ${pageData.currentPosition}
        - CTR: ${pageData.ctr}%
        - Country: ${pageData.country}
        - Clicks: ${pageData.clicks}
        - Impressions: ${pageData.impressions}
        
        Provide comprehensive AI SEO recommendations focusing on:
        1. How AI models understand and rank this content
        2. Semantic search optimization
        3. Entity-based SEO
        4. User intent alignment
        5. Content depth and expertise signals
        6. Featured snippet optimization
        7. Voice search optimization
        8. Content freshness and authority signals
        
        Return analysis in JSON format with specific, actionable recommendations.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert AI SEO analyst specializing in optimizing content for AI search engines (ChatGPT, Claude, Gemini, Perplexity). 
            
            Focus on these AI ranking factors:
            - Semantic relevance and entity recognition
            - Content depth and expertise (E-A-T signals)
            - User intent matching
            - Featured snippet potential
            - Conversational query optimization
            - Topic authority and entity relationships
            - Content freshness and update signals
            - Structured data and schema markup
            - Answer-focused content structure
            
            Provide specific, actionable recommendations with expected impact estimates.`
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const aiAnalysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return this.formatRecommendations(pageData, aiAnalysis);
      
    } catch (error) {
      console.error('AI analysis error:', error);
      return this.getFallbackRecommendations(pageData);
    }
  }

  private formatRecommendations(pageData: PageAnalysisData, aiAnalysis: any): AIRecommendation {
    const pageType = this.detectPageType(pageData.url);
    
    return {
      pageUrl: pageData.url,
      pageType,
      overallScore: aiAnalysis.overallScore || this.calculateScore(pageData),
      recommendations: aiAnalysis.recommendations || this.getDefaultRecommendations(pageData),
      aiOptimizationSuggestions: aiAnalysis.aiOptimizationSuggestions || this.getDefaultAIOptimizations(pageData)
    };
  }

  private detectPageType(url: string): 'blog' | 'landing' | 'product' | 'category' {
    if (url.includes('/blog/') || url.includes('/article/') || url.includes('/post/')) return 'blog';
    if (url.includes('/product/') || url.includes('/item/')) return 'product';
    if (url.includes('/category/') || url.includes('/collection/')) return 'category';
    return 'landing';
  }

  private calculateScore(pageData: PageAnalysisData): number {
    let score = 50; // Base score
    
    // CTR impact
    if (pageData.ctr > 10) score += 20;
    else if (pageData.ctr > 5) score += 10;
    else if (pageData.ctr < 2) score -= 15;
    
    // Position impact
    if (pageData.currentPosition <= 3) score += 25;
    else if (pageData.currentPosition <= 10) score += 15;
    else if (pageData.currentPosition > 20) score -= 20;
    
    // Keyword relevance
    if (pageData.keywords.length > 5) score += 10;
    if (pageData.keywords.length < 2) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private getDefaultRecommendations(pageData: PageAnalysisData) {
    const recommendations = [];
    
    if (pageData.ctr < 5) {
      recommendations.push({
        category: "Title & Meta Optimization",
        priority: "high" as const,
        issue: "Low click-through rate indicates poor title/meta appeal",
        suggestion: "Rewrite title to include primary keyword naturally and add emotional triggers or numbers",
        expectedImpact: "15-25% CTR improvement",
        aiRankingFactor: "User engagement signals"
      });
    }

    if (pageData.currentPosition > 10) {
      recommendations.push({
        category: "Content Authority",
        priority: "high" as const,
        issue: "Low ranking suggests insufficient content depth or authority",
        suggestion: "Add comprehensive sections covering user questions, include expert quotes, and update with latest information",
        expectedImpact: "5-10 position improvement",
        aiRankingFactor: "E-A-T signals and content comprehensiveness"
      });
    }

    if (pageData.impressions > 1000 && pageData.clicks < 50) {
      recommendations.push({
        category: "Featured Snippet Optimization",
        priority: "medium" as const,
        issue: "High impressions but low clicks - missing featured snippet opportunity",
        suggestion: "Structure content with clear headings, bullet points, and direct answers to common questions",
        expectedImpact: "20-40% traffic increase",
        aiRankingFactor: "Answer-focused content structure"
      });
    }

    return recommendations;
  }

  private getDefaultAIOptimizations(pageData: PageAnalysisData) {
    return {
      contentStructure: [
        "Add FAQ section with natural language questions",
        "Use clear H2/H3 headings that match search queries",
        "Include step-by-step instructions where applicable",
        "Add summary boxes for key information"
      ],
      semanticOptimization: [
        "Include related entities and synonyms naturally",
        "Add context about industry terminology",
        "Use topic clusters and semantic keywords",
        "Include location-specific information if applicable"
      ],
      userIntent: [
        "Analyze and match specific user search intents",
        "Add comparison sections for competing solutions",
        "Include 'People Also Ask' type content",
        "Address common follow-up questions"
      ],
      competitiveAdvantage: [
        "Research competitor gaps and fill them",
        "Add unique insights or data points",
        "Include recent industry updates",
        "Provide actionable takeaways"
      ]
    };
  }

  private getFallbackRecommendations(pageData: PageAnalysisData): AIRecommendation {
    return {
      pageUrl: pageData.url,
      pageType: this.detectPageType(pageData.url),
      overallScore: this.calculateScore(pageData),
      recommendations: this.getDefaultRecommendations(pageData),
      aiOptimizationSuggestions: this.getDefaultAIOptimizations(pageData)
    };
  }

  async analyzeBulkPages(pagesData: PageAnalysisData[]): Promise<AIRecommendation[]> {
    const results = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < pagesData.length; i += batchSize) {
      const batch = pagesData.slice(i, i + batchSize);
      const batchPromises = batch.map(page => this.analyzePageForAI(page));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches
      if (i + batchSize < pagesData.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  async getTopPriorityRecommendations(recommendations: AIRecommendation[], limit: number = 10) {
    return recommendations
      .flatMap(rec => 
        rec.recommendations.map(r => ({
          ...r,
          pageUrl: rec.pageUrl,
          pageType: rec.pageType,
          overallScore: rec.overallScore
        }))
      )
      .filter(r => r.priority === 'high')
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, limit);
  }
}

export const pageAnalysisService = new PageAnalysisService();