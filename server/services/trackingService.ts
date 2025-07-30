import { storage } from "../storage";
import { aiAnalyzer } from "./aiAnalyzer";
import type { InsertTrackingResult, InsertCompetitorAnalysis } from "@shared/schema";

export class TrackingService {
  async trackKeywords(
    keywordTexts: string[], 
    brandId: string, 
    platforms: string[]
  ): Promise<any[]> {
    const results = [];
    const brand = await storage.getBrand(brandId);
    
    if (!brand) {
      throw new Error("Brand not found");
    }

    for (const keywordText of keywordTexts) {
      // Create or find existing keyword
      let keyword = await this.findOrCreateKeyword(keywordText, brandId);
      
      // Track across all selected platforms
      for (const platform of platforms) {
        try {
          const platformResult = await this.trackKeywordOnPlatform(
            keyword.id, 
            brandId, 
            keywordText, 
            brand.name, 
            platform
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

  private async findOrCreateKeyword(keywordText: string, brandId: string) {
    const keywords = await storage.getAllKeywords();
    const existing = keywords.find(k => 
      k.keyword.toLowerCase() === keywordText.toLowerCase() && 
      k.brandId === brandId
    );

    if (existing) {
      return existing;
    }

    return await storage.createKeyword({
      keyword: keywordText,
      brandId,
      category: this.categorizeKeyword(keywordText),
    });
  }

  private async trackKeywordOnPlatform(
    keywordId: string, 
    brandId: string, 
    keywordText: string, 
    brandName: string, 
    platform: string
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
    const results = await storage.getLatestResults();
    
    return results.slice(0, limit).map(result => ({
      id: result.id,
      type: result.mentioned ? 'mention_detected' : 'visibility_lost',
      message: result.mentioned 
        ? `New mention detected on ${result.aiPlatform}`
        : `Lost visibility on ${result.aiPlatform}`,
      timestamp: result.trackedAt,
      platform: result.aiPlatform,
      keywordId: result.keywordId,
    }));
  }
}

export const trackingService = new TrackingService();
