import { storage } from "../storage";
import { aiAnalyzer } from "./aiAnalyzer";
import { alertEngine } from "./alertEngine";
import type { InsertTrackingResult, InsertCompetitorAnalysis } from "@shared/schema";

export class TrackingService {
  async trackKeywords(
    keywordTexts: string[], 
    brandId: string, 
    platforms: string[],
    userId: string
  ): Promise<any[]> {
    const results = [];
    const brand = await storage.getBrand(brandId);
    
    if (!brand) {
      throw new Error("Brand not found");
    }

    for (const keywordText of keywordTexts) {
      // Create or find existing keyword
      let keyword = await this.findOrCreateKeyword(keywordText, brandId, userId);
      
      // Track across all selected platforms
      for (const platform of platforms) {
        try {
          const platformResult = await this.trackKeywordOnPlatform(
            keyword.id, 
            brandId, 
            keywordText, 
            brand.name, 
            platform,
            userId
          );
          results.push(platformResult);
        } catch (error) {
          console.error(`Error tracking ${keywordText} on ${platform}:`, error);
          results.push({
            keyword: keywordText,
            platform,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    return results;
  }

  private async findOrCreateKeyword(keywordText: string, brandId: string, userId: string) {
    const keywords = await storage.getAllKeywords(userId);
    const existing = keywords.find(k => 
      k.keyword.toLowerCase() === keywordText.toLowerCase() && 
      k.brandId === brandId &&
      k.userId === userId
    );

    if (existing) {
      return existing;
    }

    return await storage.createKeyword({
      keyword: keywordText,
      brandId,
      userId,
      category: this.categorizeKeyword(keywordText),
    });
  }

  private async trackKeywordOnPlatform(
    keywordId: string, 
    brandId: string, 
    keywordText: string, 
    brandName: string, 
    platform: string,
    userId: string
  ) {
    // Get AI platform response
    const responseText = await aiAnalyzer.getAIPlatformResponse(keywordText, platform);
    
    // Analyze the response
    const analysis = await aiAnalyzer.analyzeAIResponse(
      keywordText, 
      brandName, 
      platform, 
      responseText
    );

    // Store tracking result
    const trackingResult: InsertTrackingResult = {
      keywordId,
      brandId,
      userId,
      aiPlatform: platform,
      mentioned: analysis.mentioned,
      position: analysis.position,
      mentionCount: analysis.mentionCount,
      responseText: analysis.responseText,
      competitorsMentioned: analysis.competitorsMentioned,
      analysisData: {
        confidence: analysis.confidence,
        platform: platform,
        keyword: keywordText,
        brand: brandName,
      } as Record<string, any>,
    };

    const result = await storage.createTrackingResult(trackingResult);

    // Check alerts for this result
    await alertEngine.checkAlertsForResult({
      keywordId,
      brandId,
      aiPlatform: platform,
      mentioned: analysis.mentioned,
      position: analysis.position,
      mentionCount: analysis.mentionCount,
    });

    // Store competitor analysis
    for (const competitor of analysis.competitorsMentioned) {
      const competitorAnalysis: InsertCompetitorAnalysis = {
        competitorBrand: competitor,
        keywordId,
        aiPlatform: platform,
        mentionCount: 1, // Simplified for now
        visibilityScore: Math.floor(Math.random() * 100), // Would be calculated based on actual analysis
        position: 'top', // Would be determined from actual analysis
      };

      await storage.createCompetitorAnalysis(competitorAnalysis);
    }

    return {
      keyword: keywordText,
      brand: brandName,
      platform,
      mentioned: analysis.mentioned,
      position: analysis.position,
      mentionCount: analysis.mentionCount,
      competitors: analysis.competitorsMentioned,
      confidence: analysis.confidence,
    };
  }

  private categorizeKeyword(keyword: string): string {
    const lowerKeyword = keyword.toLowerCase();
    
    if (lowerKeyword.includes('cdp') || lowerKeyword.includes('customer data platform')) {
      return 'CDP Tools';
    }
    if (lowerKeyword.includes('marketing automation') || lowerKeyword.includes('automation')) {
      return 'Marketing Automation';
    }
    if (lowerKeyword.includes('analytics') || lowerKeyword.includes('tracking')) {
      return 'Analytics';
    }
    if (lowerKeyword.includes('engagement') || lowerKeyword.includes('customer engagement')) {
      return 'Customer Engagement';
    }
    
    return 'General';
  }

  async getRecentActivity(limit: number = 10) {
    try {
      const results = await storage.getLatestResults();
      
      return results.slice(0, limit).map((result: any) => {
        let message = "";
        let type = "tracking";
        let color = "bg-blue-400";

        if (result.mentioned) {
          if (result.position && result.position <= 3) {
            message = `Ranked #${result.position} for keyword on ${result.aiPlatform}`;
            type = "improvement";
            color = "bg-green-400";
          } else {
            message = `Mentioned on ${result.aiPlatform}`;
            type = "mention";
            color = "bg-yellow-400";
          }
        } else {
          message = `Not mentioned on ${result.aiPlatform}`;
          type = "loss";
          color = "bg-red-400";
        }

        return {
          id: `activity-${result.id}`,
          type,
          message,
          timestamp: this.formatTimeAgo(new Date(result.trackedAt)),
          color,
        };
      });
    } catch (error) {
      console.error("Error in getRecentActivity:", error);
      return [];
    }
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }
}

export const trackingService = new TrackingService();
