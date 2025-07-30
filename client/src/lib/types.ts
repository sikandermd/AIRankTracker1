export interface DashboardStats {
  totalVisibility: number;
  rankingImproved: number;
  rankingDropped: number;
  keywordsTracked: number;
}

export interface EnrichedTrackingResult {
  id: string;
  keywordId: string;
  brandId: string;
  aiPlatform: string;
  mentioned: boolean;
  position: string | null;
  mentionCount: number;
  responseText: string | null;
  competitorsMentioned: string[];
  analysisData: Record<string, any> | null;
  trackedAt: Date;
  keyword?: {
    id: string;
    keyword: string;
    category: string | null;
  };
  brand?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CompetitorData {
  competitorBrand: string;
  mentionCount: number;
  visibilityScore: number;
  change: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  platform: string;
}

export interface SearchFilters {
  keywords: string[];
  brandId: string;
  brandIds?: string[];
  platforms: string[];
  dateRange: string;
}
