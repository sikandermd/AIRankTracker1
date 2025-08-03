import { google } from 'googleapis';

interface SearchConsoleResult {
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
  query: string;
  page: string;
}

interface KeywordPosition {
  keyword: string;
  position: number;
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  country: string;
}

class SearchConsoleService {
  private searchConsole: any;
  private isConfigured: boolean = false;

  constructor() {
    this.initializeService();
  }

  private initializeService() {
    try {
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        console.log('Google Search Console service account not configured');
        return;
      }

      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
      });

      this.searchConsole = google.searchconsole({ version: 'v1', auth });
      this.isConfigured = true;
      console.log('Google Search Console API configured successfully');
    } catch (error) {
      console.error('Failed to initialize Google Search Console:', error);
      this.isConfigured = false;
    }
  }

  async getKeywordPositions(
    siteUrl: string, 
    keywords: string[], 
    country: string = 'usa',
    startDate: string = '2024-01-01',
    endDate: string = new Date().toISOString().split('T')[0]
  ): Promise<KeywordPosition[]> {
    if (!this.isConfigured) {
      throw new Error('Google Search Console not configured. Please add GOOGLE_SERVICE_ACCOUNT_KEY environment variable.');
    }

    try {
      const results: KeywordPosition[] = [];

      for (const keyword of keywords) {
        const response = await this.searchConsole.searchanalytics.query({
          siteUrl,
          requestBody: {
            startDate,
            endDate,
            dimensions: ['query', 'page'],
            dimensionFilterGroups: [
              {
                filters: [
                  {
                    dimension: 'query',
                    expression: keyword,
                    operator: 'equals'
                  },
                  {
                    dimension: 'country',
                    expression: country.toLowerCase(),
                    operator: 'equals'
                  }
                ]
              }
            ],
            rowLimit: 1000,
            startRow: 0
          }
        });

        if (response.data.rows && response.data.rows.length > 0) {
          const topResult = response.data.rows[0];
          results.push({
            keyword,
            position: Math.round(topResult.position || 0),
            url: topResult.keys[1] || '',
            clicks: topResult.clicks || 0,
            impressions: topResult.impressions || 0,
            ctr: parseFloat((topResult.ctr || 0).toFixed(4)),
            country: country.toUpperCase()
          });
        } else {
          // Keyword not found in results
          results.push({
            keyword,
            position: 0, // Not ranking
            url: '',
            clicks: 0,
            impressions: 0,
            ctr: 0,
            country: country.toUpperCase()
          });
        }

        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return results;
    } catch (error) {
      console.error('Search Console API error:', error);
      throw new Error(`Failed to fetch keyword positions: ${error.message}`);
    }
  }

  async getSiteList(): Promise<string[]> {
    if (!this.isConfigured) {
      throw new Error('Google Search Console not configured');
    }

    try {
      const response = await this.searchConsole.sites.list();
      return response.data.siteEntry?.map((site: any) => site.siteUrl) || [];
    } catch (error) {
      console.error('Failed to fetch site list:', error);
      throw new Error(`Failed to fetch sites: ${error.message}`);
    }
  }

  async getTopQueries(
    siteUrl: string,
    country: string = 'usa',
    limit: number = 100
  ): Promise<SearchConsoleResult[]> {
    if (!this.isConfigured) {
      throw new Error('Google Search Console not configured');
    }

    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await this.searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['query', 'page'],
          dimensionFilterGroups: [
            {
              filters: [
                {
                  dimension: 'country',
                  expression: country.toLowerCase(),
                  operator: 'equals'
                }
              ]
            }
          ],
          rowLimit: limit,
          startRow: 0
        }
      });

      if (!response.data.rows) return [];

      return response.data.rows.map((row: any) => ({
        position: Math.round(row.position || 0),
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: parseFloat((row.ctr || 0).toFixed(4)),
        query: row.keys[0] || '',
        page: row.keys[1] || ''
      }));
    } catch (error) {
      console.error('Failed to fetch top queries:', error);
      throw new Error(`Failed to fetch top queries: ${error.message}`);
    }
  }

  isServiceConfigured(): boolean {
    return this.isConfigured;
  }
}

export const searchConsoleService = new SearchConsoleService();