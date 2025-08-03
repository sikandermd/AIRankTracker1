import axios from 'axios';
import { storage } from '../storage';

interface ScrapedResult {
  keyword: string;
  domain: string;
  position: number;
  url: string;
  country: string;
}

export class GoogleScrapeService {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  ];

  private getCountryCode(country: string): string {
    const countryMap: Record<string, string> = {
      'US': 'com',
      'IN': 'co.in',
      'UK': 'co.uk',
      'GB': 'co.uk',
      'CA': 'ca',
      'AU': 'com.au',
      'DE': 'de',
      'FR': 'fr'
    };
    return countryMap[country.toUpperCase()] || 'com';
  }

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async searchKeywordPosition(
    keyword: string, 
    targetDomain: string, 
    country: string = 'US'
  ): Promise<ScrapedResult | null> {
    try {
      const googleTLD = this.getCountryCode(country);
      const searchUrl = `https://www.google.${googleTLD}/search`;
      
      const params = {
        q: keyword,
        num: 100, // Get up to 100 results
        hl: country.toLowerCase() === 'in' ? 'hi' : 'en',
        gl: country.toLowerCase(),
        start: 0
      };

      const headers = {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      };

      console.log(`Searching for "${keyword}" in ${country} targeting ${targetDomain}`);
      
      const response = await axios.get(searchUrl, {
        params,
        headers,
        timeout: 15000,
        validateStatus: (status) => status < 500 // Accept redirects and client errors
      });

      if (response.status !== 200) {
        console.log(`Google returned status ${response.status}`);
        return null;
      }

      const html = response.data;
      
      // Extract search result URLs and find position
      const position = this.extractPosition(html, targetDomain);
      
      if (position > 0) {
        console.log(`Found ${targetDomain} at position ${position} for "${keyword}" in ${country}`);
        return {
          keyword,
          domain: targetDomain,
          position,
          url: this.extractLandingPage(html, targetDomain, position),
          country: country.toUpperCase()
        };
      }

      console.log(`${targetDomain} not found in top 100 for "${keyword}" in ${country}`);
      return null;

    } catch (error: any) {
      console.error(`Error scraping Google for "${keyword}":`, error.message);
      return null;
    }
  }

  private extractPosition(html: string, targetDomain: string): number {
    try {
      // Clean domain for matching
      const cleanDomain = targetDomain.replace(/^(https?:\/\/)?(www\.)?/, '');
      
      // Multiple regex patterns to catch different Google result formats
      const patterns = [
        /<div class="[^"]*g[^"]*"[^>]*>[\s\S]*?<a[^>]+href="[^"]*\/\/[^"]*?([^"\/\s]+\.[^"\/\s]+)[^"]*"[^>]*>/g,
        /<a[^>]+href="[^"]*\/\/[^"]*?([^"\/\s]+\.[^"\/\s]+)[^"]*"[^>]*>/g,
        /cite[^>]*>([^<]+)<\/cite>/g
      ];

      let position = 0;
      
      for (const pattern of patterns) {
        let match;
        let currentPos = 0;
        
        while ((match = pattern.exec(html)) !== null && currentPos < 100) {
          currentPos++;
          const foundDomain = match[1];
          
          if (foundDomain && this.isDomainMatch(foundDomain, cleanDomain)) {
            return currentPos;
          }
        }
      }
      
      return 0;
    } catch (error) {
      console.error('Error extracting position:', error);
      return 0;
    }
  }

  private isDomainMatch(foundDomain: string, targetDomain: string): boolean {
    const cleanFound = foundDomain.replace(/^(www\.)?/, '').toLowerCase();
    const cleanTarget = targetDomain.replace(/^(www\.)?/, '').toLowerCase();
    
    return cleanFound === cleanTarget || 
           cleanFound.includes(cleanTarget) || 
           cleanTarget.includes(cleanFound);
  }

  private extractLandingPage(html: string, targetDomain: string, position: number): string {
    try {
      // Extract the specific URL for the ranking page
      const escapedDomain = targetDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const urlPattern = new RegExp(`<a[^>]+href="([^"]*\\/\\/[^"]*?${escapedDomain}[^"]*)"[^>]*>`, 'i');
      const match = html.match(urlPattern);
      
      if (match && match[1]) {
        return match[1];
      }
      
      return `https://${targetDomain}`;
    } catch (error: any) {
      console.error('Error extracting landing page:', error.message);
      return `https://${targetDomain}`;
    }
  }

  async updateKeywordPositions(): Promise<void> {
    try {
      const keywords = await storage.getOrganicKeywords();
      console.log(`Starting automatic position updates for ${keywords.length} keywords`);
      
      for (const keyword of keywords) {
        try {
          // Skip if recently updated (within last hour)
          const lastUpdate = new Date(keyword.updatedAt);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          
          if (lastUpdate > oneHourAgo && keyword.currentPosition) {
            console.log(`Skipping ${keyword.keyword} - recently updated`);
            continue;
          }

          console.log(`Checking position for: ${keyword.keyword} on ${keyword.domain} in ${keyword.country}`);
          
          const result = await this.searchKeywordPosition(
            keyword.keyword,
            keyword.domain,
            keyword.country
          );

          if (result && result.position > 0) {
            await storage.updateOrganicKeywordPosition(
              keyword.id,
              result.position,
              result.url
            );
            console.log(`Updated ${keyword.keyword}: Position ${result.position}`);
          } else {
            console.log(`No ranking found for ${keyword.keyword}`);
          }

          // Rate limiting - wait between requests
          await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
          
        } catch (error: any) {
          console.error(`Error updating ${keyword.keyword}:`, error.message);
        }
      }
      
      console.log('Completed automatic position updates');
    } catch (error) {
      console.error('Error in updateKeywordPositions:', error);
    }
  }
}

export const googleScrapeService = new GoogleScrapeService();