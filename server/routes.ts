import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBrandSchema, insertKeywordSchema, insertTrackingResultSchema, insertOrganicKeywordSchema, alerts } from "@shared/schema";
import { createInsertSchema } from "drizzle-zod";
import { trackingService } from "./services/trackingService.js";
import { googleSheetsService } from "./services/googleSheetsService.js";
import { notificationService } from "./services/notificationService.js";
import { searchConsoleService } from "./services/searchConsoleService.js";
import { googleScrapeService } from "./services/googleScrapeService.js";
import { z } from "zod";
import { apiUsageLogger } from "./apiUsageLogger";

export async function registerRoutes(app: Express): Promise<Server> {
  // Brand routes
  app.get("/api/brands", async (req, res) => {
    try {
      const brands = await storage.getAllBrands();
      res.json(brands);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  app.post("/api/brands", async (req, res) => {
    try {
      console.log('Creating brand with data:', req.body);
      const validatedData = insertBrandSchema.parse(req.body);
      console.log('Validated data:', validatedData);
      const brand = await storage.createBrand(validatedData);
      res.status(201).json(brand);
    } catch (error) {
      console.error('Brand creation error:', error);
      res.status(400).json({ message: "Invalid brand data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Keyword routes
  app.get("/api/keywords", async (req, res) => {
    try {
      const { brandId } = req.query;
      const keywords = brandId 
        ? await storage.getKeywordsByBrand(brandId as string)
        : await storage.getAllKeywords();
      res.json(keywords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch keywords" });
    }
  });

  app.post("/api/keywords", async (req, res) => {
    try {
      const validatedData = insertKeywordSchema.parse(req.body);
      const keyword = await storage.createKeyword(validatedData);
      res.status(201).json(keyword);
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Invalid keyword data" });
      }
    }
  });

  // Search and track keywords
  app.post("/api/keywords/track", async (req, res) => {
    try {
      const schema = z.object({
        keywords: z.array(z.string()).min(1),
        brandId: z.string(),
        platforms: z.array(z.enum(['gpt', 'claude', 'gemini', 'perplexity'])).min(1),
      });
      
      const { keywords: keywordTexts, brandId, platforms } = schema.parse(req.body);
      
      const results = await trackingService.trackKeywords(keywordTexts, brandId, platforms);
      res.json(results);
    } catch (error) {
      res.status(400).json({ message: "Invalid tracking request" });
    }
  });

  // Tracking results routes
  app.get("/api/tracking-results", async (req, res) => {
    try {
      const { keywordId, brandId, aiPlatform, startDate, endDate } = req.query;
      
      const filters: any = {};
      if (keywordId) filters.keywordId = keywordId as string;
      if (brandId) filters.brandId = brandId as string;
      if (aiPlatform) filters.aiPlatform = aiPlatform as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const results = await storage.getTrackingResults(filters);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tracking results" });
    }
  });

  // Get latest tracking results with keyword and brand details
  app.get("/api/tracking-results/latest", async (req, res) => {
    try {
      const results = await storage.getLatestResults();
      
      // Enrich with keyword and brand data
      const enrichedResults = await Promise.all(results.map(async (result) => {
        const keyword = await storage.getKeyword(result.keywordId!);
        const brand = await storage.getBrand(result.brandId!);
        return {
          ...result,
          keyword,
          brand,
        };
      }));

      res.json(enrichedResults);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest results" });
    }
  });

  // Competitor analysis routes
  app.get("/api/competitor-analysis", async (req, res) => {
    try {
      const { keywordId } = req.query;
      const analysis = await storage.getCompetitorAnalysis(keywordId as string);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch competitor analysis" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // API Usage Stats route with caching
  let usageStatsCache: any = null;
  let usageStatsCacheTime = 0;
  const USAGE_CACHE_TTL = 60000; // 1 minute cache

  app.get("/api/usage/stats", async (req, res) => {
    try {
      const now = Date.now();
      
      // Return cached data if still fresh
      if (usageStatsCache && (now - usageStatsCacheTime) < USAGE_CACHE_TTL) {
        return res.json(usageStatsCache);
      }
      
      const usageStats = apiUsageLogger.getUsageStats();
      const apiKeyStatus = apiUsageLogger.getAPIKeyStatus();
      const result = {
        usage: usageStats,
        apiKeys: apiKeyStatus,
        dataSource: {
          openai: process.env.OPENAI_API_KEY ? 'Using your OpenAI API key for real ChatGPT responses' : 'Simulated responses - API key missing',
          claude: 'Simulated responses - Anthropic API key needed for real Claude integration',
          gemini: 'Simulated responses - Google AI API key needed for real Gemini integration', 
          perplexity: 'Simulated responses - Perplexity API key needed for real integration'
        }
      };
      
      // Cache the result
      usageStatsCache = result;
      usageStatsCacheTime = now;
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch usage stats" });
    }
  });

  // Recent activity
  app.get("/api/dashboard/recent-activity", async (req, res) => {
    try {
      const activity = await trackingService.getRecentActivity(10);
      res.json(activity);
    } catch (error) {
      console.error("Recent activity error:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Keywords management
  app.post("/api/keywords", async (req, res) => {
    try {
      const { keyword, brandId, category } = req.body;
      const newKeyword = await storage.createKeyword({
        keyword,
        brandId,
        category: category || 'General',
      });
      res.json(newKeyword);
    } catch (error) {
      console.error("Create keyword error:", error);
      res.status(500).json({ message: "Failed to create keyword" });
    }
  });

  app.get("/api/keywords", async (req, res) => {
    try {
      const keywords = await storage.getAllKeywords();
      res.json(keywords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch keywords" });
    }
  });

  app.delete("/api/keywords/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteKeyword(id);
      res.json({ message: "Keyword deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete keyword" });
    }
  });

  // Keyword detail with full analysis
  app.get("/api/keywords/:id/analysis", async (req, res) => {
    try {
      const { id } = req.params;
      
      const keyword = await storage.getKeyword(id);
      if (!keyword) {
        return res.status(404).json({ message: "Keyword not found" });
      }

      const trackingResults = await storage.getTrackingResults({ keywordId: id });
      const competitorAnalysis = await storage.getCompetitorAnalysis(id);
      const brand = await storage.getBrand(keyword.brandId!);

      res.json({
        keyword,
        brand,
        trackingResults,
        competitorAnalysis,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch keyword analysis" });
    }
  });

  // Google Sheets integration routes
  app.post("/api/sheets/import", async (req, res) => {
    try {
      const schema = z.object({
        spreadsheetUrl: z.string().url(),
        range: z.string().optional().default('A:D'),
      });
      
      const { spreadsheetUrl, range } = schema.parse(req.body);
      
      const spreadsheetId = googleSheetsService.extractSpreadsheetId(spreadsheetUrl);
      if (!spreadsheetId) {
        return res.status(400).json({ message: "Invalid Google Sheets URL" });
      }

      const result = await googleSheetsService.pullKeywordsFromSheet(spreadsheetId, range);
      res.json(result);
    } catch (error) {
      console.error('Sheets import error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to import from Google Sheets"
      });
    }
  });

  app.post("/api/sheets/info", async (req, res) => {
    try {
      const schema = z.object({
        spreadsheetUrl: z.string().url(),
      });
      
      const { spreadsheetUrl } = schema.parse(req.body);
      
      const spreadsheetId = googleSheetsService.extractSpreadsheetId(spreadsheetUrl);
      if (!spreadsheetId) {
        return res.status(400).json({ message: "Invalid Google Sheets URL" });
      }

      const info = await googleSheetsService.getSheetInfo(spreadsheetId);
      res.json(info);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get sheet info"
      });
    }
  });

  // Alert routes
  // Password verification endpoint
  app.post('/api/verify-password', async (req, res) => {
    try {
      const { password } = req.body;
      const correctPassword = process.env.DASHBOARD_PASSWORD || 'Agent';
      
      if (password === correctPassword) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
      }
    } catch (error) {
      console.error('Password verification error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getAllAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const insertAlertSchema = createInsertSchema(alerts).omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      });
      
      const alertData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(alertData);
      
      // Send alert creation confirmation email
      if (alert.notificationMethods && alert.notificationMethods.email) {
        try {
          const brand = await storage.getBrand(alert.brandId);
          const keyword = await storage.getKeyword(alert.keywordId);
          
          await notificationService.sendAlertCreationEmail({
            email: alert.notificationMethods.email,
            alertName: alert.name,
            brandName: brand?.name || 'Unknown Brand',
            keyword: keyword?.keyword || 'Unknown Keyword',
            platforms: alert.platforms
          });
        } catch (emailError) {
          console.error("Failed to send alert creation email:", emailError);
          // Don't fail the alert creation if email fails
        }
      }
      
      res.status(201).json(alert);
    } catch (error) {
      console.error("Error creating alert:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid alert data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create alert" });
      }
    }
  });

  app.delete("/api/alerts/:id", async (req, res) => {
    try {
      await storage.deleteAlert(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting alert:", error);
      res.status(500).json({ error: "Failed to delete alert" });
    }
  });

  app.get("/api/alerts/:id/logs", async (req, res) => {
    try {
      const logs = await storage.getAlertLogs(req.params.id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching alert logs:", error);
      res.status(500).json({ error: "Failed to fetch alert logs" });
    }
  });

  // Test email endpoint
  app.post("/api/test-email", async (req, res) => {
    try {
      const { email } = req.body;
      const result = await notificationService.sendAlertCreationEmail({
        email,
        alertName: "Test Alert - Email Verification",
        brandName: "Test Brand",
        keyword: "test keyword",
        platforms: ["gpt", "claude"]
      });
      
      if (result) {
        res.json({ success: true, message: "Test email sent successfully" });
      } else {
        res.status(500).json({ success: false, message: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ success: false, message: "Email service error", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Debug Brevo config endpoint
  app.get("/api/test-brevo-config", (req, res) => {
    const hasApiKey = !!process.env.BREVO_API_KEY;
    const keyLength = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.length : 0;
    res.json({ 
      hasApiKey, 
      keyLength,
      message: hasApiKey ? "Brevo API key is configured" : "Brevo API key is missing"
    });
  });

  // Test alert notification endpoint - Shows sample emails for different scenarios
  app.post("/api/test-alert-notification", async (req, res) => {
    try {
      const { email, alertName, brandName, keyword, platform, triggerType, currentValue, previousValue } = req.body;
      
      const testData = {
        alertName: alertName || "NotifyVisitors Brand Alert",
        brandName: brandName || "NotifyVisitors", 
        keyword: keyword || "customer data platform",
        platform: platform || "ChatGPT",
        triggerType: triggerType || "mention_change",
        currentValue: currentValue || "Position #2",
        previousValue: previousValue || "Not mentioned"
      };

      const success = await notificationService.sendEmailNotification(email, testData);
      
      if (success) {
        res.json({ 
          success: true, 
          message: "Test alert notification sent successfully",
          testData
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: "Failed to send test notification" 
        });
      }
    } catch (error) {
      console.error('Test notification error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Email troubleshooting endpoint
  app.post("/api/troubleshoot-email", async (req, res) => {
    try {
      const { email } = req.body;
      
      // Test direct Brevo API call
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY!
        },
        body: JSON.stringify({
          to: [{ email }],
          sender: { email: 'jason@notifyvisitorsmail.com', name: 'AI Ranking Tracker' },
          subject: '🔧 Email Troubleshooting Test',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>📧 Email Test Successful!</h2>
              <p>अगर आपको यह email मिली है, तो email service properly काम कर रही है।</p>
              <p><strong>Troubleshooting Steps:</strong></p>
              <ul>
                <li>✅ Check your spam/junk folder</li>
                <li>✅ Wait 5-10 minutes for delivery</li>
                <li>✅ Add noreply@brevo.com to your contacts</li>
                <li>✅ Check email filters</li>
              </ul>
              <p>Time sent: ${new Date().toISOString()}</p>
            </div>
          `,
          textContent: 'Email Test Successful! अगर आपको यह email मिली है, तो email service properly काम कर रही है।'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(500).json({ 
          success: false, 
          error: `Brevo API error: ${response.status} ${errorText}` 
        });
      }

      const result = await response.json();
      res.json({ 
        success: true, 
        messageId: result.messageId,
        message: 'Troubleshooting email sent. Check your inbox and spam folder in 5-10 minutes.',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Troubleshoot email error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Organic Keywords routes
  app.get("/api/organic-keywords", async (req, res) => {
    try {
      const organicKeywords = await storage.getAllOrganicKeywords();
      res.json(organicKeywords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organic keywords" });
    }
  });

  app.post("/api/organic-keywords", async (req, res) => {
    try {
      const validatedData = insertOrganicKeywordSchema.parse(req.body);
      const organicKeyword = await storage.createOrganicKeyword(validatedData);
      
      // Immediately check position after creating keyword
      console.log(`Auto-checking position for new keyword: ${organicKeyword.keyword}`);
      
      // Start position check in background
      googleScrapeService.searchKeywordPosition(
        organicKeyword.keyword,
        organicKeyword.domain,
        organicKeyword.country
      ).then(async (result) => {
        if (result && result.position > 0) {
          console.log(`Found position ${result.position} for ${organicKeyword.keyword}`);
          await storage.updateOrganicKeywordPosition(
            organicKeyword.id,
            result.position,
            result.url
          );
          console.log(`Updated ${organicKeyword.keyword} with position ${result.position}`);
        } else {
          console.log(`No ranking found for ${organicKeyword.keyword} in top 100`);
        }
      }).catch(error => {
        console.error(`Error checking position for ${organicKeyword.keyword}:`, error instanceof Error ? error.message : String(error));
      });
      
      res.status(201).json(organicKeyword);
    } catch (error) {
      res.status(400).json({ message: "Invalid organic keyword data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/organic-keywords/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { currentPosition } = req.body;
      
      if (typeof currentPosition !== 'number' || currentPosition < 1 || currentPosition > 100) {
        return res.status(400).json({ message: "Position must be a number between 1 and 100" });
      }
      
      const updatedKeyword = await storage.updateOrganicKeywordPosition(id, currentPosition);
      res.json(updatedKeyword);
    } catch (error) {
      console.error('Error updating organic keyword position:', error);
      res.status(500).json({ message: (error instanceof Error ? error.message : String(error)) || "Failed to update keyword position" });
    }
  });

  app.get("/api/organic-rankings/:keywordId?", async (req, res) => {
    try {
      const { keywordId } = req.params;
      const rankings = await storage.getOrganicRankings(keywordId);
      res.json(rankings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organic rankings" });
    }
  });

  // Top Pages route for Search Console data
  app.get("/api/top-pages", async (req, res) => {
    try {
      const { searchConsoleService } = await import("./services/searchConsoleService");
      
      const dateRange = parseInt(req.query.dateRange as string) || 30;
      const directoryFilter = req.query.directory as string || 'all';
      
      console.log(`Fetching top pages for ${dateRange} days, directory: ${directoryFilter}`);
      
      // Get top pages from Search Console
      const topPagesData = await searchConsoleService.getTopPages(
        'https://www.notifyvisitors.com',
        dateRange,
        directoryFilter
      );
      
      // Combine with page details for complete data
      const enrichedPages = await Promise.all(
        topPagesData.map(async (page, index) => {
          const pageDetails = await searchConsoleService.getPageDetails(page.page);
          
          return {
            id: (index + 1).toString(),
            url: page.page,
            title: pageDetails.title,
            clicks: page.clicks,
            impressions: page.impressions,
            ctr: Number((page.ctr * 100).toFixed(1)),
            position: Number(page.position.toFixed(1)),
            internalLinks: pageDetails.internalLinks,
            externalLinks: pageDetails.externalLinks,
            backlinks: pageDetails.backlinks,
            lastUpdated: new Date().toISOString()
          };
        })
      );
      
      res.json(enrichedPages);
    } catch (error) {
      console.error("Error fetching top pages:", error);
      res.status(500).json({ message: "Failed to fetch top pages" });
    }
  });

  // Get NotifyVisitors directories
  app.get("/api/notifyvisitors-directories", async (req, res) => {
    try {
      const { searchConsoleService } = await import("./services/searchConsoleService");
      const directories = searchConsoleService.getNotifyVisitorsDirectories();
      res.json(directories);
    } catch (error) {
      console.error("Error fetching directories:", error);
      res.status(500).json({ message: "Failed to fetch directories" });
    }
  });

  // Search Console integration routes
  app.post("/api/organic-keywords/sync", async (req, res) => {
    try {
      const { domain, keywords, country } = req.body;
      
      if (!searchConsoleService.isServiceConfigured()) {
        return res.status(400).json({ 
          message: "Google Search Console not configured",
          setupRequired: true 
        });
      }

      // Validate domain format
      const siteUrl = domain.startsWith('http') ? domain : `https://${domain}`;
      
      // Get keyword positions from Search Console
      const positions = await searchConsoleService.getKeywordPositions(
        siteUrl, 
        keywords, 
        country || 'usa'
      );

      // Update organic keywords with real positions
      const updatedKeywords = [];
      for (const position of positions) {
        const organicKeywords = await storage.getAllOrganicKeywords();
        const existingKeyword = organicKeywords.find(
          k => k.keyword === position.keyword && k.domain === domain
        );

        if (existingKeyword) {
          // Update existing keyword with new position data
          const updated = await storage.updateOrganicKeyword(existingKeyword.id, {
            previousPosition: existingKeyword.currentPosition,
            currentPosition: position.position > 0 ? position.position : null,
            searchVolume: position.impressions,
            url: position.url
          });
          
          // Create ranking history record
          await storage.createOrganicRanking({
            keywordId: existingKeyword.id,
            position: position.position > 0 ? position.position : null,
            url: position.url,
            clicks: position.clicks,
            impressions: position.impressions,
            ctr: (position.ctr * 100).toFixed(2) + '%'
          });
          
          updatedKeywords.push(updated);
        }
      }

      res.json({
        success: true,
        updated: updatedKeywords.length,
        message: `Updated ${updatedKeywords.length} keywords with Search Console data`
      });
    } catch (error) {
      console.error('Search Console sync error:', error);
      res.status(500).json({ 
        message: "Failed to sync with Search Console",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/search-console/sites", async (req, res) => {
    try {
      if (!searchConsoleService.isServiceConfigured()) {
        return res.status(400).json({ 
          message: "Google Search Console not configured",
          setupRequired: true 
        });
      }

      const sites = await searchConsoleService.getSiteList();
      res.json(sites);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch Search Console sites",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  // Automatic keyword position tracking
  app.post("/api/organic-keywords/auto-track", async (req, res) => {
    try {
      console.log("Starting automatic position tracking for all keywords...");
      
      // Start the automatic update process
      googleScrapeService.updateKeywordPositions()
        .then(() => {
          console.log("Automatic position tracking completed");
        })
        .catch(error => {
          console.error("Automatic position tracking failed:", error);
        });
      
      res.json({ 
        success: true, 
        message: "Automatic position tracking started. Keywords will be updated automatically."
      });
    } catch (error: any) {
      console.error("Auto-track error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to start automatic tracking", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Check single keyword position automatically
  app.post("/api/organic-keywords/:id/check-position", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the keyword details
      const keyword = await storage.getOrganicKeyword(id);
      if (!keyword) {
        return res.status(404).json({ message: "Keyword not found" });
      }

      console.log(`Checking position for: ${keyword.keyword} on ${keyword.domain} in ${keyword.country}`);
      
      // Use scraping service to check position
      const result = await googleScrapeService.searchKeywordPosition(
        keyword.keyword,
        keyword.domain,
        keyword.country
      );

      if (result && result.position > 0) {
        // Update the keyword with new position
        const updated = await storage.updateOrganicKeywordPosition(
          id,
          result.position,
          result.url
        );
        
        res.json({
          success: true,
          message: `Position found: #${result.position}`,
          keyword: updated,
          position: result.position,
          url: result.url
        });
      } else {
        res.json({
          success: false,
          message: "Not ranking in top 100",
          keyword,
          position: 0
        });
      }
    } catch (error: any) {
      console.error("Position check error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to check position", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  return httpServer;
}
