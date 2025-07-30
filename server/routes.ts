import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBrandSchema, insertKeywordSchema, insertTrackingResultSchema } from "@shared/schema";
import { trackingService } from "./services/trackingService.js";
import { z } from "zod";

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
      const validatedData = insertBrandSchema.parse(req.body);
      const brand = await storage.createBrand(validatedData);
      res.status(201).json(brand);
    } catch (error) {
      res.status(400).json({ message: "Invalid brand data" });
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
      res.status(400).json({ message: "Invalid keyword data" });
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

  const httpServer = createServer(app);
  return httpServer;
}
