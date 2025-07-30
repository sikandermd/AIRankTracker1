import { google } from 'googleapis';
import { storage } from '../storage';

export class GoogleSheetsService {
  private sheets: any;
  private auth: any;

  constructor() {
    // Initialize Google Sheets API with service account or OAuth
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Use service account credentials from environment
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        this.auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
      } else {
        // For development, we'll handle this gracefully
        console.log('Google Sheets service account not configured');
      }
      
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    } catch (error) {
      console.error('Failed to initialize Google Sheets auth:', error);
    }
  }

  async pullKeywordsFromSheet(spreadsheetId: string, range: string = 'A:D'): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    if (!this.sheets) {
      throw new Error('Google Sheets service not initialized. Please configure GOOGLE_SERVICE_ACCOUNT_KEY.');
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return { imported: 0, skipped: 0, errors: ['No data found in spreadsheet'] };
      }

      // Assume first row is header: [keyword, category, brand, platforms]
      const headers = rows[0];
      const dataRows = rows.slice(1);

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rowNumber = i + 2; // +2 because we skip header and arrays are 0-indexed

        try {
          if (!row[0] || row[0].trim() === '') {
            skipped++;
            continue;
          }

          const keywordText = row[0].trim();
          const category = row[1]?.trim() || null;
          const brandName = row[2]?.trim() || 'Default Brand';
          const platforms = row[3]?.trim() || 'all';

          // Find or create brand
          let brand = await this.findOrCreateBrand(brandName);

          // Check if keyword already exists for this brand
          const existingKeywords = await storage.getKeywordsByBrand(brand.id);
          const exists = existingKeywords.some(k => 
            k.keyword.toLowerCase() === keywordText.toLowerCase()
          );

          if (exists) {
            skipped++;
            continue;
          }

          // Parse platform settings
          const platformSettings = this.parsePlatformSettings(platforms);

          // Create keyword
          await storage.createKeyword({
            keyword: keywordText,
            category,
            brandId: brand.id,
            ...platformSettings,
          });

          imported++;
        } catch (error) {
          errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return { imported, skipped, errors };
    } catch (error) {
      throw new Error(`Failed to pull keywords from Google Sheets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async findOrCreateBrand(brandName: string) {
    const brands = await storage.getAllBrands();
    let brand = brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());

    if (!brand) {
      brand = await storage.createBrand({
        name: brandName,
        slug: brandName.toLowerCase().replace(/\s+/g, '-'),
        description: `Auto-imported brand: ${brandName}`,
      });
    }

    return brand;
  }

  private parsePlatformSettings(platforms: string) {
    const platformStr = platforms.toLowerCase();
    
    if (platformStr === 'all' || platformStr === '') {
      return {
        trackGpt: true,
        trackClaude: true,
        trackGemini: true,
        trackPerplexity: true,
      };
    }

    return {
      trackGpt: platformStr.includes('gpt') || platformStr.includes('chatgpt'),
      trackClaude: platformStr.includes('claude'),
      trackGemini: platformStr.includes('gemini'),
      trackPerplexity: platformStr.includes('perplexity'),
    };
  }

  async getSheetInfo(spreadsheetId: string): Promise<{
    title: string;
    sheets: Array<{ title: string; rowCount: number; columnCount: number }>;
  }> {
    if (!this.sheets) {
      throw new Error('Google Sheets service not initialized');
    }

    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });

      const spreadsheet = response.data;
      return {
        title: spreadsheet.properties.title,
        sheets: spreadsheet.sheets.map((sheet: any) => ({
          title: sheet.properties.title,
          rowCount: sheet.properties.gridProperties.rowCount,
          columnCount: sheet.properties.gridProperties.columnCount,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to get sheet info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  extractSpreadsheetId(url: string): string | null {
    // Extract spreadsheet ID from Google Sheets URL
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }
}

export const googleSheetsService = new GoogleSheetsService();