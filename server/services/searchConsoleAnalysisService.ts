import { google } from 'googleapis';
import { pageAnalysisService } from './pageAnalysisService';

interface SearchConsoleData {
  page: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  country: string;
}

interface PagePerformanceData {
  url: string;
  totalClicks: number;
  totalImpressions: number;
  avgPosition: number;
  avgCtr: number;
  topKeywords: string[];
  underperformingKeywords: string[];
  countries: string[];
}

export class SearchConsoleAnalysisService {
  private searchConsole: any;

  constructor() {
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        const auth = new google.auth.JWT(
          credentials.client_email,
          undefined,
          credentials.private_key,
          ['https://www.googleapis.com/auth/webmasters.readonly']
        );
        
        this.searchConsole = google.searchconsole({ version: 'v1', auth });
      } catch (error) {
        console.error('Search Console setup error:', error);
      }
    }
  }

  async getPagePerformanceData(siteUrl: string, days: number = 30): Promise<PagePerformanceData[]> {
    if (!this.searchConsole) {
      console.log('Search Console not configured, using demo data for AI analysis...');
      return this.getDemoPageData(siteUrl);
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const response = await this.searchConsole.searchanalytics.query({
        siteUrl: siteUrl,
        requestBody: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['page', 'query', 'country'],
          rowLimit: 25000,
          startRow: 0
        }
      });

      const rows = response.data.rows || [];
      return this.processSearchConsoleData(rows);
      
    } catch (error) {
      console.error('Search Console API error:', error);
      console.log('Falling back to demo data for AI analysis demonstration...');
      return this.getDemoPageData(siteUrl);
    }
  }

  private getDemoPageData(siteUrl: string): PagePerformanceData[] {
    // Generate realistic demo data for AI analysis demonstration
    const demoPages = [
      {
        url: `${siteUrl}/blog/customer-data-platform-guide`,
        totalClicks: 245,
        totalImpressions: 3420,
        avgPosition: 12.5,
        avgCtr: 7.1,
        topKeywords: ['customer data platform', 'cdp software', 'customer analytics'],
        underperformingKeywords: ['cdp tools comparison', 'best customer data platform'],
        countries: ['US', 'IN', 'GB']
      },
      {
        url: `${siteUrl}/features/customer-engagement`,
        totalClicks: 180,
        totalImpressions: 2890,
        avgPosition: 8.3,
        avgCtr: 6.2,
        topKeywords: ['customer engagement platform', 'customer retention tools'],
        underperformingKeywords: ['engagement software pricing'],
        countries: ['US', 'CA', 'AU']
      },
      {
        url: `${siteUrl}/blog/email-marketing-automation`,
        totalClicks: 320,
        totalImpressions: 4150,
        avgPosition: 6.8,
        avgCtr: 7.7,
        topKeywords: ['email marketing automation', 'automated email campaigns'],
        underperformingKeywords: ['email automation tools'],
        countries: ['US', 'GB', 'IN']
      },
      {
        url: `${siteUrl}/solutions/ecommerce-personalization`,
        totalClicks: 125,
        totalImpressions: 2100,
        avgPosition: 15.2,
        avgCtr: 5.9,
        topKeywords: ['ecommerce personalization', 'product recommendations'],
        underperformingKeywords: ['personalization engine', 'ai recommendations'],
        countries: ['US', 'DE', 'FR']
      },
      {
        url: `${siteUrl}/blog/web-push-notifications-guide`,
        totalClicks: 95,
        totalImpressions: 1850,
        avgPosition: 18.7,
        avgCtr: 5.1,
        topKeywords: ['web push notifications', 'browser notifications'],
        underperformingKeywords: ['push notification strategy'],
        countries: ['US', 'IN', 'SG']
      }
    ];

    return demoPages;
  }

  private processSearchConsoleData(rows: any[]): PagePerformanceData[] {
    const pageData = new Map<string, {
      clicks: number;
      impressions: number;
      positions: number[];
      ctrs: number[];
      keywords: Map<string, { clicks: number; impressions: number; position: number; ctr: number }>;
      countries: Set<string>;
    }>();

    // Aggregate data by page
    rows.forEach(row => {
      const [page, query, country] = row.keys;
      const { clicks, impressions, ctr, position } = row;

      if (!pageData.has(page)) {
        pageData.set(page, {
          clicks: 0,
          impressions: 0,
          positions: [],
          ctrs: [],
          keywords: new Map(),
          countries: new Set()
        });
      }

      const data = pageData.get(page)!;
      data.clicks += clicks;
      data.impressions += impressions;
      data.positions.push(position);
      data.ctrs.push(ctr);
      data.countries.add(country);

      // Track keyword performance
      if (!data.keywords.has(query)) {
        data.keywords.set(query, { clicks: 0, impressions: 0, position: 0, ctr: 0 });
      }
      const keywordData = data.keywords.get(query)!;
      keywordData.clicks += clicks;
      keywordData.impressions += impressions;
      keywordData.position = position; // Latest position
      keywordData.ctr = ctr;
    });

    // Convert to PagePerformanceData format
    return Array.from(pageData.entries()).map(([url, data]) => {
      const avgPosition = data.positions.reduce((a, b) => a + b, 0) / data.positions.length;
      const avgCtr = data.ctrs.reduce((a, b) => a + b, 0) / data.ctrs.length;

      // Get top and underperforming keywords
      const keywordArray = Array.from(data.keywords.entries());
      const topKeywords = keywordArray
        .sort((a, b) => b[1].clicks - a[1].clicks)
        .slice(0, 10)
        .map(([keyword]) => keyword);

      const underperformingKeywords = keywordArray
        .filter(([, data]) => data.impressions > 100 && data.ctr < 2)
        .sort((a, b) => b[1].impressions - a[1].impressions)
        .slice(0, 5)
        .map(([keyword]) => keyword);

      return {
        url,
        totalClicks: data.clicks,
        totalImpressions: data.impressions,
        avgPosition,
        avgCtr,
        topKeywords,
        underperformingKeywords,
        countries: Array.from(data.countries)
      };
    });
  }

  async generatePageRecommendations(siteUrl: string, days: number = 30) {
    try {
      console.log(`Analyzing ${siteUrl} for the last ${days} days...`);
      
      const pagePerformanceData = await this.getPagePerformanceData(siteUrl, days);
      
      // Convert to format expected by AI analysis
      const analysisData = pagePerformanceData.map(page => ({
        url: page.url,
        keywords: [...page.topKeywords, ...page.underperformingKeywords],
        currentPosition: Math.round(page.avgPosition),
        clicks: page.totalClicks,
        impressions: page.totalImpressions,
        ctr: page.avgCtr,
        country: page.countries[0] || 'US' // Primary country
      }));

      console.log(`Processing ${analysisData.length} pages for AI recommendations...`);
      
      // Get AI-powered recommendations
      const recommendations = await pageAnalysisService.analyzeBulkPages(analysisData);
      
      // Get top priority items
      const topPriorities = await pageAnalysisService.getTopPriorityRecommendations(recommendations, 20);
      
      return {
        totalPages: analysisData.length,
        recommendations,
        topPriorities,
        summary: this.generateAnalysisSummary(pagePerformanceData, recommendations)
      };
      
    } catch (error) {
      console.error('Page recommendations error:', error);
      throw error;
    }
  }

  private generateAnalysisSummary(pageData: PagePerformanceData[], recommendations: any[]) {
    const totalClicks = pageData.reduce((sum, page) => sum + page.totalClicks, 0);
    const totalImpressions = pageData.reduce((sum, page) => sum + page.totalImpressions, 0);
    const avgCtr = pageData.reduce((sum, page) => sum + page.avgCtr, 0) / pageData.length;
    const avgPosition = pageData.reduce((sum, page) => sum + page.avgPosition, 0) / pageData.length;

    const highPriorityCount = recommendations.reduce((count, rec) => 
      count + rec.recommendations.filter((r: any) => r.priority === 'high').length, 0
    );

    const pageTypes = recommendations.reduce((types, rec) => {
      types[rec.pageType] = (types[rec.pageType] || 0) + 1;
      return types;
    }, {} as Record<string, number>);

    return {
      performance: {
        totalClicks,
        totalImpressions,
        avgCtr: Math.round(avgCtr * 100) / 100,
        avgPosition: Math.round(avgPosition * 100) / 100
      },
      opportunities: {
        highPriorityIssues: highPriorityCount,
        pagesAnalyzed: pageData.length,
        pageTypeBreakdown: pageTypes
      },
      topIssues: this.getTopIssueTypes(recommendations)
    };
  }

  private getTopIssueTypes(recommendations: any[]) {
    const issueTypes = recommendations.reduce((types, rec) => {
      rec.recommendations.forEach((r: any) => {
        types[r.category] = (types[r.category] || 0) + 1;
      });
      return types;
    }, {} as Record<string, number>);

    return Object.entries(issueTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
  }

  async getRecommendationsForPage(siteUrl: string, pageUrl: string) {
    try {
      const pageData = await this.getPagePerformanceData(siteUrl, 30);
      const targetPage = pageData.find(page => page.url === pageUrl);
      
      if (!targetPage) {
        throw new Error('Page not found in Search Console data');
      }

      const analysisData = {
        url: targetPage.url,
        keywords: [...targetPage.topKeywords, ...targetPage.underperformingKeywords],
        currentPosition: Math.round(targetPage.avgPosition),
        clicks: targetPage.totalClicks,
        impressions: targetPage.totalImpressions,
        ctr: targetPage.avgCtr,
        country: targetPage.countries[0] || 'US'
      };

      return await pageAnalysisService.analyzePageForAI(analysisData);
      
    } catch (error) {
      console.error('Single page analysis error:', error);
      throw error;
    }
  }
}

export const searchConsoleAnalysisService = new SearchConsoleAnalysisService();