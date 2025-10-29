import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, getCurrentUser } from "./auth";
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
  // Setup authentication
  await setupAuth(app);

  // Brand routes - protected
  app.get("/api/brands", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const brands = await storage.getAllBrands(user?.id);
      res.json(brands);
    } catch (error: unknown) {
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  app.post("/api/brands", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      console.log('Creating brand with data:', req.body);
      const validatedData = insertBrandSchema.parse({
        ...req.body,
        userId: user.id // Ensure brand belongs to current user
      });
      console.log('Validated data:', validatedData);
      const brand = await storage.createBrand(validatedData);
      res.status(201).json(brand);
    } catch (error: unknown) {
      console.error('Brand creation error:', error);
      res.status(400).json({ message: "Invalid brand data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Keyword routes - protected
  app.get("/api/keywords", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const { brandId } = req.query;
      
      if (brandId) {
        // Verify brand ownership before fetching keywords
        const brand = await storage.getBrand(brandId as string);
        if (!brand) {
          return res.status(404).json({ message: "Brand not found" });
        }
        if (brand.userId !== user?.id) {
          return res.status(403).json({ message: "Access denied" });
        }
        const keywords = await storage.getKeywordsByBrand(brandId as string);
        res.json(keywords);
      } else {
        const keywords = await storage.getAllKeywords(user?.id);
        res.json(keywords);
      }
    } catch (error: unknown) {
      res.status(500).json({ message: "Failed to fetch keywords" });
    }
  });

  app.post("/api/keywords", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const validatedData = insertKeywordSchema.parse({
        ...req.body,
        userId: user.id // Ensure keyword belongs to current user
      });
      const keyword = await storage.createKeyword(validatedData);
      res.status(201).json(keyword);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Invalid keyword data" });
      }
    }
  });

  // Search and track keywords
  app.post("/api/keywords/track", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const schema = z.object({
        keywords: z.array(z.string()).min(1),
        brandId: z.string(),
        platforms: z.array(z.enum(['gpt', 'claude', 'gemini', 'perplexity'])).min(1),
      });
      
      const { keywords: keywordTexts, brandId, platforms } = schema.parse(req.body);
      
      const results = await trackingService.trackKeywords(keywordTexts, brandId, platforms, user!.id);
      res.json(results);
    } catch (error: unknown) {
      res.status(400).json({ message: "Invalid tracking request" });
    }
  });

  // Tracking results routes
  app.get("/api/tracking-results", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const { keywordId, brandId, aiPlatform, startDate, endDate } = req.query;
      
      const filters: any = { userId: user?.id };
      if (keywordId) filters.keywordId = keywordId as string;
      if (brandId) filters.brandId = brandId as string;
      if (aiPlatform) filters.aiPlatform = aiPlatform as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const results = await storage.getTrackingResults(filters);
      res.json(results);
    } catch (error: unknown) {
      res.status(500).json({ message: "Failed to fetch tracking results" });
    }
  });

  // Get latest tracking results with keyword and brand details
  app.get("/api/tracking-results/latest", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const results = await storage.getLatestResults(undefined, user?.id);
      
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
    } catch (error: unknown) {
      res.status(500).json({ message: "Failed to fetch latest results" });
    }
  });

  // Competitor analysis routes
  app.get("/api/competitor-analysis", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const { keywordId } = req.query;
      const analysis = await storage.getCompetitorAnalysis(keywordId as string, user?.id);
      res.json(analysis);
    } catch (error: unknown) {
      res.status(500).json({ message: "Failed to fetch competitor analysis" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error: unknown) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // API Usage Stats route with caching
  let usageStatsCache: any = null;
  let usageStatsCacheTime = 0;
  const USAGE_CACHE_TTL = 60000; // 1 minute cache

  app.get("/api/usage/stats", requireAuth, async (req, res) => {
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
    } catch (error: unknown) {
      res.status(500).json({ message: "Failed to fetch usage stats" });
    }
  });

  // Recent activity
  app.get("/api/dashboard/recent-activity", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const activity = await trackingService.getRecentActivity(10, user?.id);
      res.json(activity);
    } catch (error: unknown) {
      console.error("Recent activity error:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  app.delete("/api/keywords/:id", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const { id } = req.params;
      
      // Verify ownership before deleting
      const keyword = await storage.getKeyword(id);
      if (!keyword) {
        return res.status(404).json({ message: "Keyword not found" });
      }
      if (keyword.userId !== user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteKeyword(id);
      res.json({ message: "Keyword deleted successfully" });
    } catch (error: unknown) {
      res.status(500).json({ message: "Failed to delete keyword" });
    }
  });

  // Keyword detail with full analysis
  app.get("/api/keywords/:id/analysis", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const { id } = req.params;
      
      const keyword = await storage.getKeyword(id);
      if (!keyword) {
        return res.status(404).json({ message: "Keyword not found" });
      }

      // Verify ownership
      if (keyword.userId !== user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const trackingResults = await storage.getTrackingResults({ keywordId: id, userId: user!.id });
      const competitorAnalysis = await storage.getCompetitorAnalysis(id, user!.id);
      const brand = await storage.getBrand(keyword.brandId!);

      // Verify brand ownership
      if (brand && brand.userId !== user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json({
        keyword,
        brand,
        trackingResults,
        competitorAnalysis,
      });
    } catch (error: unknown) {
      res.status(500).json({ message: "Failed to fetch keyword analysis" });
    }
  });

  // Google Sheets integration routes
  app.post("/api/sheets/import", requireAuth, async (req, res) => {
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
    } catch (error: unknown) {
      console.error('Sheets import error:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to import from Google Sheets"
      });
    }
  });

  app.post("/api/sheets/info", requireAuth, async (req, res) => {
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
    } catch (error: unknown) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get sheet info"
      });
    }
  });

  // Alert routes
  // Combined Alerts endpoints
  app.get("/api/combined-alerts", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const { range } = req.query;
      const alerts = await storage.getCombinedAlerts(range as string, user?.id);
      res.json(alerts);
    } catch (error: unknown) {
      console.error("Error fetching combined alerts:", error);
      res.status(500).json({ error: "Failed to fetch combined alerts" });
    }
  });

  app.get("/api/combined-alerts/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getCombinedAlertStats();
      res.json(stats);
    } catch (error: unknown) {
      console.error("Error fetching combined alert stats:", error);
      res.status(500).json({ error: "Failed to fetch combined alert stats" });
    }
  });

  app.post("/api/combined-alerts/force-send", requireAuth, async (req, res) => {
    try {
      const { combinedAlertService } = await import("./services/combinedAlertService");
      await combinedAlertService.forceSendAllBatches();
      res.json({ success: true, message: "All pending batches sent" });
    } catch (error: unknown) {
      console.error("Error force sending alerts:", error);
      res.status(500).json({ error: "Failed to force send alerts" });
    }
  });

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
    } catch (error: unknown) {
      console.error('Password verification error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  app.get("/api/alerts", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const alerts = await storage.getAllAlerts(user?.id);
      res.json(alerts);
    } catch (error: unknown) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.post("/api/alerts", requireAuth, async (req, res) => {
    try {
      console.log("Alert creation request:", req.body);
      
      // Handle multi-brand, multi-keyword alert setup
      const alertSetupSchema = z.object({
        name: z.string().min(1, "Alert name is required"),
        brandId: z.string().optional(), // Primary brand for backward compatibility
        selectedBrands: z.array(z.string()).min(1, "At least one brand must be selected"),
        customKeywords: z.array(z.string()).min(1, "At least one keyword must be added"),
        platforms: z.array(z.string()).min(1, "At least one platform must be selected"),
        triggerConditions: z.object({
          mentionChange: z.boolean().default(false),
          positionImprove: z.boolean().default(false),
          newPlatform: z.boolean().default(false),
          mentionIncrease: z.boolean().default(false),
        }),
        notificationMethods: z.object({
          email: z.string().email("Please enter a valid email"),
          discordWebhook: z.string().url().optional().nullable(),
        }),
        isActive: z.boolean().default(true),
      });
      
      const validatedData = alertSetupSchema.parse(req.body);
      console.log("Validated alert data:", validatedData);
      
      // Create alerts for each brand-keyword combination
      const createdAlerts = [];
      
      for (const brandId of validatedData.selectedBrands) {
        for (const keyword of validatedData.customKeywords) {
          // First create the keyword if it doesn't exist
          let keywordRecord;
          try {
            const user = getCurrentUser(req);
            if (!user) {
              return res.status(401).json({ error: "User not authenticated" });
            }
            
            keywordRecord = await storage.createKeyword({
              keyword: keyword,
              brandId: brandId,
              category: "alert-keyword", // Special category for alert keywords
              userId: user.id,
              trackGpt: validatedData.platforms.includes('gpt') || validatedData.platforms.includes('chatgpt'),
              trackClaude: validatedData.platforms.includes('claude'),
              trackGemini: validatedData.platforms.includes('gemini'),
              trackPerplexity: validatedData.platforms.includes('perplexity'),
            });
          } catch (keywordError) {
            // If keyword already exists, find it
            const existingKeywords = await storage.getAllKeywords();
            keywordRecord = existingKeywords.find(kw => 
              kw.keyword.toLowerCase() === keyword.toLowerCase() && 
              kw.brandId === brandId
            );
            
            if (!keywordRecord) {
              console.error(`Could not create or find keyword: ${keyword} for brand: ${brandId}`);
              continue;
            }
          }
          
          // Create the alert
          const alertData = {
            name: `${validatedData.name} - ${keyword}`,
            brandId: brandId,
            keywordId: keywordRecord.id,
            userId: user.id,
            platforms: validatedData.platforms,
            triggerConditions: validatedData.triggerConditions,
            notificationMethods: validatedData.notificationMethods,
            isActive: validatedData.isActive,
          };
          
          try {
            const alert = await storage.createAlert(alertData);
            createdAlerts.push(alert);
            console.log(`Created alert for brand: ${brandId}, keyword: ${keyword}`);
            
            // Send alert creation confirmation email
            if (alert.notificationMethods && alert.notificationMethods.email) {
              try {
                const brand = await storage.getBrand(alert.brandId);
                
                await notificationService.sendAlertCreationEmail({
                  email: alert.notificationMethods.email,
                  alertName: alert.name,
                  brandName: brand?.name || 'Unknown Brand',
                  keyword: keyword,
                  platforms: alert.platforms
                });
              } catch (emailError) {
                console.error("Failed to send alert creation email:", emailError);
                // Don't fail the alert creation if email fails
              }
            }
          } catch (alertError) {
            console.error(`Failed to create alert for brand: ${brandId}, keyword: ${keyword}:`, alertError);
          }
        }
      }
      
      if (createdAlerts.length === 0) {
        return res.status(400).json({ 
          error: "No alerts were created. Please check your data.",
          details: "Failed to create alerts for the provided brands and keywords"
        });
      }
      
      // Send ONE consolidated email with all brands and keywords
      if (createdAlerts.length > 0) {
        try {
          const emailData = {
            email: validatedData.notificationMethods.email,
            alertName: validatedData.name,
            brands: [] as Array<{ brandName: string; keywords: string[] }>,
            platforms: validatedData.platforms
          };

          // Group keywords by brand for email
          const brandMap = new Map<string, { brandName: string; keywords: string[] }>();
          
          for (const alert of createdAlerts) {
            const brand = await storage.getBrand(alert.brandId);
            const keyword = validatedData.customKeywords.find(kw => alert.name.includes(kw)) || 'Unknown';
            
            if (brand) {
              if (!brandMap.has(brand.id)) {
                brandMap.set(brand.id, { brandName: brand.name, keywords: [] });
              }
              brandMap.get(brand.id)!.keywords.push(keyword);
            }
          }

          emailData.brands = Array.from(brandMap.values());
          
          console.log("Sending consolidated email with data:", emailData);
          const emailResult = await notificationService.sendMultiBrandAlertCreationEmail(emailData);
          console.log("Consolidated multi-brand alert creation email result:", emailResult);
        } catch (emailError) {
          console.error("Failed to send consolidated alert creation email:", emailError);
          // Don't fail the alert creation if email fails
        }
      }

      console.log(`Successfully created ${createdAlerts.length} alerts`);
      res.status(201).json({
        message: `Successfully created ${createdAlerts.length} alerts`,
        alerts: createdAlerts,
        count: createdAlerts.length
      });
      
    } catch (error: unknown) {
      console.error("Error creating alert:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid alert data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create alert", details: error instanceof Error ? error.message : String(error) });
      }
    }
  });

  // New multi-brand multi-keyword alert creation endpoint
  app.post("/api/alerts/multi", requireAuth, async (req, res) => {
    try {
      console.log("Multi-brand alert creation request:", req.body);
      
      // Handle multi-brand, multi-keyword alert setup
      const alertSetupSchema = z.object({
        name: z.string().min(1, "Alert name is required"),
        selectedBrands: z.array(z.string()).min(1, "At least one brand must be selected"),
        customBrands: z.array(z.object({
          id: z.string(),
          name: z.string()
        })).optional().default([]),
        customKeywords: z.array(z.string()).min(1, "At least one keyword must be added"),
        platforms: z.array(z.string()).min(1, "At least one platform must be selected"),
        triggerConditions: z.object({
          mentionChange: z.boolean().default(false),
          positionImprove: z.boolean().default(false),
          newPlatform: z.boolean().default(false),
          mentionIncrease: z.boolean().default(false),
        }),
        notificationMethods: z.object({
          email: z.string().email("Please enter a valid email"),
          discordWebhook: z.string().url().optional().nullable(),
        }),
        isActive: z.boolean().default(true),
      });
      
      const validatedData = alertSetupSchema.parse(req.body);
      console.log("Validated multi-alert data:", validatedData);

      const user = getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      
      // Create custom brands in the database first
      const customBrandIdMap = new Map<string, string>(); // Maps custom ID to real DB ID
      if (validatedData.customBrands && validatedData.customBrands.length > 0) {
        for (const customBrand of validatedData.customBrands) {
          try {
            // Check if brand already exists by name
            const allBrands = await storage.getAllBrands();
            const existingBrand = allBrands.find(
              b => b.name.toLowerCase() === customBrand.name.toLowerCase() && b.userId === user.id
            );
            
            if (existingBrand) {
              // Brand already exists, use it
              customBrandIdMap.set(customBrand.id, existingBrand.id);
              console.log(`Using existing brand: ${customBrand.name} with ID: ${existingBrand.id}`);
            } else {
              // Create new brand
              const createdBrand = await storage.createBrand({
                name: customBrand.name,
                description: `Custom brand: ${customBrand.name}`,
                userId: user.id
              });
              customBrandIdMap.set(customBrand.id, createdBrand.id);
              console.log(`Created custom brand: ${customBrand.name} with ID: ${createdBrand.id}`);
            }
          } catch (error) {
            console.error(`Failed to create custom brand ${customBrand.name}:`, error);
          }
        }
      }
      
      // Create alerts for each brand-keyword combination
      const createdAlerts = [];
      
      for (const brandId of validatedData.selectedBrands) {
        // Get the real brand ID (if it was a custom brand)
        const actualBrandId = customBrandIdMap.get(brandId) || brandId;
        for (const keyword of validatedData.customKeywords) {
          // First create the keyword if it doesn't exist
          let keywordRecord;
          try {
            keywordRecord = await storage.createKeyword({
              keyword: keyword,
              brandId: actualBrandId,
              category: "alert-keyword", // Special category for alert keywords
              userId: user.id,
              trackGpt: validatedData.platforms.includes('gpt') || validatedData.platforms.includes('chatgpt'),
              trackClaude: validatedData.platforms.includes('claude'),
              trackGemini: validatedData.platforms.includes('gemini'),
              trackPerplexity: validatedData.platforms.includes('perplexity'),
            });
          } catch (keywordError) {
            // If keyword already exists, find it
            const existingKeywords = await storage.getAllKeywords();
            keywordRecord = existingKeywords.find(kw => 
              kw.keyword.toLowerCase() === keyword.toLowerCase() && 
              kw.brandId === actualBrandId
            );
            
            if (!keywordRecord) {
              console.error(`Could not create or find keyword: ${keyword} for brand: ${actualBrandId}`);
              continue;
            }
          }
          
          // Create the alert
          const alertData = {
            name: `${validatedData.name} - ${keyword}`,
            brandId: actualBrandId,
            keywordId: keywordRecord.id,
            userId: user.id,
            platforms: validatedData.platforms,
            triggerConditions: validatedData.triggerConditions,
            notificationMethods: validatedData.notificationMethods,
            isActive: validatedData.isActive,
          };
          
          try {
            const alert = await storage.createAlert(alertData);
            createdAlerts.push(alert);
            console.log(`Created alert for brand: ${actualBrandId}, keyword: ${keyword}`);
            
            // Send alert creation confirmation email
            if (alert.notificationMethods && alert.notificationMethods.email) {
              try {
                const brand = await storage.getBrand(alert.brandId);
                
                await notificationService.sendAlertCreationEmail({
                  email: alert.notificationMethods.email,
                  alertName: alert.name,
                  brandName: brand?.name || 'Unknown Brand',
                  keyword: keyword,
                  platforms: alert.platforms
                });
              } catch (emailError) {
                console.error("Failed to send alert creation email:", emailError);
                // Don't fail the alert creation if email fails
              }
            }
          } catch (alertError) {
            console.error(`Failed to create alert for brand: ${brandId}, keyword: ${keyword}:`, alertError);
          }
        }
      }
      
      if (createdAlerts.length === 0) {
        return res.status(400).json({ 
          error: "No alerts were created. Please check your data.",
          details: "Failed to create alerts for the provided brands and keywords"
        });
      }
      
      // Send ONE consolidated email with all brands and keywords
      if (createdAlerts.length > 0) {
        try {
          const emailData = {
            email: validatedData.notificationMethods.email,
            alertName: validatedData.name,
            brands: [] as Array<{ brandName: string; keywords: string[] }>,
            platforms: validatedData.platforms
          };

          // Group keywords by brand for email
          const brandMap = new Map<string, { brandName: string; keywords: string[] }>();
          
          for (const alert of createdAlerts) {
            const brand = await storage.getBrand(alert.brandId);
            const keyword = validatedData.customKeywords.find(kw => alert.name.includes(kw)) || 'Unknown';
            
            if (brand) {
              if (!brandMap.has(brand.id)) {
                brandMap.set(brand.id, { brandName: brand.name, keywords: [] });
              }
              brandMap.get(brand.id)!.keywords.push(keyword);
            }
          }

          emailData.brands = Array.from(brandMap.values());
          
          console.log("Sending consolidated email with data:", emailData);
          const emailResult = await notificationService.sendMultiBrandAlertCreationEmail(emailData);
          console.log("Consolidated multi-brand alert creation email result:", emailResult);
        } catch (emailError) {
          console.error("Failed to send consolidated alert creation email:", emailError);
          // Don't fail the alert creation if email fails
        }
      }

      // Send ONE consolidated email with enhanced keyword status
      if (createdAlerts.length > 0) {
        try {
          const enhancedEmailData = {
            email: validatedData.notificationMethods.email,
            alertName: validatedData.name,
            brands: [] as Array<{ 
              brandName: string; 
              keywords: Array<{
                keyword: string;
                status: {
                  mention_change: boolean;
                  position_improve: boolean;
                  new_platform: boolean;
                  mention_increase: boolean;
                }
              }>
            }>,
            platforms: validatedData.platforms
          };

          // Group keywords by brand with status for email
          const enhancedBrandMap = new Map<string, { 
            brandName: string; 
            keywords: Array<{
              keyword: string;
              status: {
                mention_change: boolean;
                position_improve: boolean;
                new_platform: boolean;
                mention_increase: boolean;
              }
            }>
          }>();
          
          for (const alert of createdAlerts) {
            const brand = await storage.getBrand(alert.brandId);
            const keyword = validatedData.customKeywords.find(kw => alert.name.includes(kw)) || 'Unknown';
            
            if (brand) {
              if (!enhancedBrandMap.has(brand.id)) {
                enhancedBrandMap.set(brand.id, { 
                  brandName: brand.name, 
                  keywords: [] 
                });
              }
              enhancedBrandMap.get(brand.id)!.keywords.push({
                keyword: keyword,
                status: {
                  mention_change: validatedData.triggerConditions.mentionChange,
                  position_improve: validatedData.triggerConditions.positionImprove,
                  new_platform: validatedData.triggerConditions.newPlatform,
                  mention_increase: validatedData.triggerConditions.mentionIncrease
                }
              });
            }
          }

          enhancedEmailData.brands = Array.from(enhancedBrandMap.values());
          
          console.log("Sending enhanced consolidated email with data:", enhancedEmailData);
          const emailResult = await notificationService.sendMultiBrandAlertCreationEmail(enhancedEmailData);
          console.log("Enhanced consolidated multi-brand alert creation email result:", emailResult);
        } catch (emailError) {
          console.error("Failed to send enhanced consolidated alert creation email:", emailError);
          // Don't fail the alert creation if email fails
        }
      }

      console.log(`Successfully created ${createdAlerts.length} multi-brand alerts`);
      res.status(201).json({
        message: `Successfully created ${createdAlerts.length} alerts`,
        alerts: createdAlerts,
        count: createdAlerts.length
      });
      
    } catch (error: unknown) {
      console.error("Error creating multi-brand alert:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid alert data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create alert", details: error instanceof Error ? error.message : String(error) });
      }
    }
  });

  app.delete("/api/alerts/:id", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      
      // Verify ownership before deleting
      const alert = await storage.getAlert(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      if (alert.userId !== user?.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deleteAlert(req.params.id);
      res.status(204).send();
    } catch (error: unknown) {
      console.error("Error deleting alert:", error);
      res.status(500).json({ error: "Failed to delete alert" });
    }
  });

  app.get("/api/alerts/:id/logs", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const logs = await storage.getAlertLogs(req.params.id, user?.id);
      res.json(logs);
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error('Troubleshoot email error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Organic Keywords routes
  app.get("/api/organic-keywords", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const organicKeywords = await storage.getAllOrganicKeywords(user?.id);
      res.json(organicKeywords);
    } catch (error: unknown) {
      res.status(500).json({ message: "Failed to fetch organic keywords" });
    }
  });

  app.post("/api/organic-keywords", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const validatedData = insertOrganicKeywordSchema.parse(req.body);
      const organicKeyword = await storage.createOrganicKeyword({ ...validatedData, userId: user!.id });
      
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
    } catch (error: unknown) {
      res.status(400).json({ message: "Invalid organic keyword data", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.patch("/api/organic-keywords/:id", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const { id } = req.params;
      const { currentPosition } = req.body;
      
      if (typeof currentPosition !== 'number' || currentPosition < 1 || currentPosition > 100) {
        return res.status(400).json({ message: "Position must be a number between 1 and 100" });
      }
      
      // Verify ownership before updating
      const organicKeyword = await storage.getOrganicKeyword(id);
      if (!organicKeyword) {
        return res.status(404).json({ message: "Organic keyword not found" });
      }
      if (organicKeyword.userId !== user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedKeyword = await storage.updateOrganicKeywordPosition(id, currentPosition);
      res.json(updatedKeyword);
    } catch (error: unknown) {
      console.error('Error updating organic keyword position:', error);
      res.status(500).json({ message: (error instanceof Error ? error.message : String(error)) || "Failed to update keyword position" });
    }
  });

  app.get("/api/organic-rankings/:keywordId?", requireAuth, async (req, res) => {
    try {
      const user = getCurrentUser(req);
      const { keywordId } = req.params;
      const rankings = await storage.getOrganicRankings(keywordId, user?.id);
      res.json(rankings);
    } catch (error: unknown) {
      res.status(500).json({ message: "Failed to fetch organic rankings" });
    }
  });

  // Top Pages route for Search Console data
  app.get("/api/top-pages", requireAuth, async (req, res) => {
    try {
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
    } catch (error: unknown) {
      console.error("Error fetching top pages:", error);
      res.status(500).json({ message: "Failed to fetch top pages" });
    }
  });

  // Get NotifyVisitors directories
  app.get("/api/notifyvisitors-directories", requireAuth, async (req, res) => {
    try {
      const directories = searchConsoleService.getNotifyVisitorsDirectories();
      res.json(directories);
    } catch (error: unknown) {
      console.error("Error fetching directories:", error);
      res.status(500).json({ message: "Failed to fetch directories" });
    }
  });

  // Search Console integration routes
  app.post("/api/organic-keywords/sync", requireAuth, async (req, res) => {
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
            userId: existingKeyword.userId,
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
    } catch (error: unknown) {
      console.error('Search Console sync error:', error);
      res.status(500).json({ 
        message: "Failed to sync with Search Console",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/search-console/sites", requireAuth, async (req, res) => {
    try {
      if (!searchConsoleService.isServiceConfigured()) {
        return res.status(400).json({ 
          message: "Google Search Console not configured",
          setupRequired: true 
        });
      }

      const sites = await searchConsoleService.getSiteList();
      res.json(sites);
    } catch (error: unknown) {
      res.status(500).json({ 
        message: "Failed to fetch Search Console sites",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // AI Visibility Audit endpoint
  app.post("/api/ai-visibility-audit", requireAuth, async (req, res) => {
    try {
      const { type, url, brandName, domain, queries } = req.body;
      
      console.log(`AI Visibility Audit request - Type: ${type}, URL: ${url}, Brand: ${brandName}`);
      
      // Simulate AI analysis with comprehensive 20-factor evaluation
      const mockAnalysisResult = {
        url: type === 'url' ? url : undefined,
        brandName: type === 'brand' ? brandName : undefined,
        overallScore: Math.floor(Math.random() * 4) + 6, // 6-10 score range
        factors: [
          {
            id: 1,
            name: "Schema Markup (FAQPage, HowTo, Article)",
            score: Math.floor(Math.random() * 10) + 1,
            analysis: "Limited schema markup detected. FAQPage and Article schemas are missing, reducing AI model understanding.",
            actionableAdvice: "Implement FAQPage schema for Q&A sections and Article schema for blog posts to improve LLM comprehension.",
            icon: "Database"
          },
          {
            id: 2,
            name: "E-E-A-T (Expertise, Experience, Author Credibility)",
            score: Math.floor(Math.random() * 10) + 1,
            analysis: "Author bylines present but lacking detailed expertise indicators and professional credentials.",
            actionableAdvice: "Add detailed author bios, credentials, and experience sections. Include links to professional profiles.",
            icon: "Award"
          },
          {
            id: 3,
            name: "Conversational / Question-Answer Tone",
            score: Math.floor(Math.random() * 10) + 1,
            analysis: "Content style is informational but lacks conversational elements that AI models prefer for responses.",
            actionableAdvice: "Restructure content to include natural questions and answers. Use conversational language patterns.",
            icon: "Users"
          },
          {
            id: 4,
            name: "Technical Performance (page speed, crawlability)",
            score: Math.floor(Math.random() * 10) + 1,
            analysis: "Page load speed is moderate. Some optimization opportunities exist for better crawlability.",
            actionableAdvice: "Optimize images, minify CSS/JS, and improve server response times to under 2 seconds.",
            icon: "Zap"
          },
          {
            id: 5,
            name: "Accuracy & Query Intent Relevance",
            score: Math.floor(Math.random() * 10) + 1,
            analysis: "Content addresses user intent but could be more precise in answering specific queries.",
            actionableAdvice: "Research actual user questions and provide direct, precise answers in the first paragraph.",
            icon: "Target"
          }
        ],
        topQuickWins: [
          "Add FAQ schema markup to existing Q&A sections for immediate LLM recognition",
          "Include direct answers to common questions in the first 100 words of content",
          "Add structured data for product/service information to appear in AI responses"
        ],
        llmCitabilityRating: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)] as "Low" | "Medium" | "High",
        sentimentInsights: {
          brandMentionSentiment: type === 'brand' 
            ? `${brandName} appears in AI responses with generally positive context, mentioned alongside industry leaders.`
            : "Page content presents information in a neutral, authoritative tone suitable for AI citation.",
          negativeSignals: [
            "Limited third-party validation and reviews",
            "Sparse mention in authoritative industry publications"
          ],
          neutralCues: [
            "Technical documentation style",
            "Lack of emotional language or strong positioning statements"
          ]
        },
        extractedFAQs: [
          {
            question: "What is the main purpose of this content?",
            answer: "This content provides comprehensive information about the topic with actionable insights."
          },
          {
            question: "How does this solution compare to alternatives?",
            answer: "The solution offers unique advantages in terms of implementation and results."
          }
        ],
        citationsList: [
          "wikipedia.org",
          "industry-publication.com",
          "authoritative-source.org",
          "research-institution.edu"
        ]
      };

      // Add remaining factors (6-20) to complete the analysis
      const remainingFactors = [
        { id: 6, name: "Clarity & Readability (bullets, headings, short paragraphs)", icon: "FileText" },
        { id: 7, name: "Freshness / Content Recency", icon: "Clock" },
        { id: 8, name: "Semantic Relevance / Intent Recognition (LSI keywords)", icon: "Brain" },
        { id: 9, name: "User Engagement Signals (if available)", icon: "Eye" },
        { id: 10, name: "Citation Depth & Source Authority", icon: "Shield" },
        { id: 11, name: "Internal Linking & Topical Hub Structure", icon: "Link" },
        { id: 12, name: "Content Depth & Original Use Cases", icon: "Sparkles" },
        { id: 13, name: "Keyword Stuffing / Spammy Signal Avoidance", icon: "XCircle" },
        { id: 14, name: "Topical Focus vs Generic Content", icon: "Target" },
        { id: 15, name: "Brand Mentions on reliable domains", icon: "Globe" },
        { id: 16, name: "Entity Signals / Knowledge Graph Metadata", icon: "Database" },
        { id: 17, name: "Retrieval-Augmented Generation compatibility (RAG format)", icon: "Brain" },
        { id: 18, name: "Multi-format layout (tables, quick facts, visuals)", icon: "BarChart3" },
        { id: 19, name: "Proper HTML Tag Hierarchy (h1/h2/h3)", icon: "FileText" },
        { id: 20, name: "Human Feedback / Upvotes or Community Ratings", icon: "Users" }
      ];

      remainingFactors.forEach(factor => {
        mockAnalysisResult.factors.push({
          ...factor,
          score: Math.floor(Math.random() * 10) + 1,
          analysis: `Analysis for ${factor.name} shows opportunities for improvement in AI visibility.`,
          actionableAdvice: `Optimize ${factor.name} by implementing best practices for LLM citation and ranking.`
        });
      });

      // Calculate overall score as average of all factors
      const avgScore = mockAnalysisResult.factors.reduce((sum, factor) => sum + factor.score, 0) / mockAnalysisResult.factors.length;
      mockAnalysisResult.overallScore = Math.round(avgScore * 10) / 10;

      res.json(mockAnalysisResult);
    } catch (error: unknown) {
      console.error("AI Visibility Audit error:", error);
      res.status(500).json({ 
        error: "Failed to analyze AI visibility", 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  const httpServer = createServer(app);
  // Automatic keyword position tracking
  app.post("/api/organic-keywords/auto-track", requireAuth, async (req, res) => {
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
  app.post("/api/organic-keywords/:id/check-position", requireAuth, async (req, res) => {
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



  // AI-Powered Page Analysis and SEO Recommendations
  app.post("/api/analyze-pages", requireAuth, async (req, res) => {
    try {
      const { searchConsoleAnalysisService } = await import("./services/searchConsoleAnalysisService");
      const { siteUrl, days = 30 } = req.body;
      
      if (!siteUrl) {
        return res.status(400).json({ error: "Site URL is required" });
      }
      
      console.log(`Starting AI analysis for ${siteUrl} over ${days} days...`);
      const analysis = await searchConsoleAnalysisService.generatePageRecommendations(siteUrl, days);
      
      res.json({
        success: true,
        data: analysis,
        timestamp: new Date().toISOString(),
        note: !process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 
          'Demo mode: Using sample data for AI analysis demonstration. Add Google Service Account key for real Search Console data.' : 
          'Live mode: Using real Search Console data.'
      });
      
    } catch (error: unknown) {
      console.error("Page analysis error:", error);
      res.status(500).json({ 
        error: "Failed to analyze pages", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.post("/api/analyze-single-page", requireAuth, async (req, res) => {
    try {
      const { searchConsoleAnalysisService } = await import("./services/searchConsoleAnalysisService");
      const { siteUrl, pageUrl } = req.body;
      
      if (!siteUrl || !pageUrl) {
        return res.status(400).json({ error: "Site URL and Page URL are required" });
      }
      
      console.log(`Analyzing single page: ${pageUrl} for site: ${siteUrl}`);
      const recommendation = await searchConsoleAnalysisService.getRecommendationsForPage(siteUrl, pageUrl);
      
      res.json({
        success: true,
        data: recommendation,
        timestamp: new Date().toISOString()
      });
      
    } catch (error: unknown) {
      console.error("Single page analysis error:", error);
      res.status(500).json({ 
        error: "Failed to analyze page", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // AI Recommendations Dashboard Data
  app.get("/api/ai-recommendations/summary", requireAuth, async (req, res) => {
    try {
      const { pageAnalysisService } = await import("./services/pageAnalysisService");
      
      // Get sample recommendations for dashboard
      const sampleData = {
        totalPagesAnalyzed: 0,
        highPriorityIssues: 0,
        averageScore: 0,
        topIssueCategories: [
          { category: "Title & Meta Optimization", count: 0 },
          { category: "Content Authority", count: 0 },
          { category: "Featured Snippet Optimization", count: 0 }
        ],
        recentAnalyses: []
      };
      
      res.json(sampleData);
      
    } catch (error: unknown) {
      console.error("AI recommendations summary error:", error);
      res.status(500).json({ 
        error: "Failed to fetch AI recommendations summary"
      });
    }
  });

  // n8n Integration endpoint - Webhook for external automation
  app.post("/api/webhooks/n8n/trigger", async (req, res) => {
    try {
      const schema = z.object({
        action: z.enum(['track', 'analyze', 'report', 'monitor']),
        data: z.any(),
        webhookUrl: z.string().url().optional(),
      });
      
      const { action, data, webhookUrl } = schema.parse(req.body);
      
      // Process different actions for n8n workflows
      let result;
      switch (action) {
        case 'track':
          // Trigger tracking workflow
          if (!data.keywords || !data.brandId || !data.platforms) {
            throw new Error('Missing required fields for tracking: keywords, brandId, platforms');
          }
          result = await trackingService.trackKeywords(data.keywords, data.brandId, data.platforms);
          break;
        case 'analyze':
          // Analyze existing results
          result = await storage.getLatestResults();
          break;
        case 'report':
          // Generate summary report
          result = await storage.getTrackingResults({
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            endDate: new Date()
          });
          break;
        case 'monitor':
          // Get dashboard stats for monitoring
          result = await storage.getDashboardStats();
          break;
        default:
          throw new Error('Invalid action');
      }
      
      // If webhook URL provided, send result there (for n8n callback)
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action, 
              result, 
              timestamp: new Date().toISOString(),
              success: true 
            })
          });
        } catch (webhookError) {
          console.error('n8n webhook delivery failed:', webhookError);
        }
      }
      
      res.json({ success: true, action, result, timestamp: new Date().toISOString() });
    } catch (error: unknown) {
      console.error('n8n webhook error:', error);
      res.status(400).json({ 
        success: false,
        message: "n8n webhook failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  return httpServer;
}
