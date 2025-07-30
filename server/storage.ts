import { 
  users, brands, keywords, trackingResults, competitorAnalysis, alerts,
  type User, type InsertUser, type Brand, type InsertBrand, 
  type Keyword, type InsertKeyword, type TrackingResult, type InsertTrackingResult,
  type CompetitorAnalysis, type InsertCompetitorAnalysis
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Brand operations
  getAllBrands(): Promise<Brand[]>;
  getBrand(id: string): Promise<Brand | undefined>;
  createBrand(brand: InsertBrand): Promise<Brand>;

  // Keyword operations
  getAllKeywords(): Promise<Keyword[]>;
  getKeywordsByBrand(brandId: string): Promise<Keyword[]>;
  getKeyword(id: string): Promise<Keyword | undefined>;
  createKeyword(keyword: InsertKeyword): Promise<Keyword>;
  updateKeyword(id: string, updates: Partial<InsertKeyword>): Promise<Keyword>;

  // Tracking results operations
  getTrackingResults(filters?: {
    keywordId?: string;
    brandId?: string;
    aiPlatform?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<TrackingResult[]>;
  createTrackingResult(result: InsertTrackingResult): Promise<TrackingResult>;
  getLatestResults(keywordId?: string): Promise<TrackingResult[]>;

  // Competitor analysis operations
  getCompetitorAnalysis(keywordId?: string): Promise<CompetitorAnalysis[]>;
  createCompetitorAnalysis(analysis: InsertCompetitorAnalysis): Promise<CompetitorAnalysis>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalVisibility: number;
    rankingImproved: number;
    rankingDropped: number;
    keywordsTracked: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllBrands(): Promise<Brand[]> {
    return await db.select().from(brands).orderBy(brands.name);
  }

  async getBrand(id: string): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.id, id));
    return brand || undefined;
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    const [newBrand] = await db
      .insert(brands)
      .values(brand)
      .returning();
    return newBrand;
  }

  async getAllKeywords(): Promise<Keyword[]> {
    return await db.select().from(keywords).orderBy(desc(keywords.createdAt));
  }

  async getKeywordsByBrand(brandId: string): Promise<Keyword[]> {
    return await db
      .select()
      .from(keywords)
      .where(eq(keywords.brandId, brandId))
      .orderBy(desc(keywords.createdAt));
  }

  async getKeyword(id: string): Promise<Keyword | undefined> {
    const [keyword] = await db.select().from(keywords).where(eq(keywords.id, id));
    return keyword || undefined;
  }

  async createKeyword(keyword: InsertKeyword): Promise<Keyword> {
    const [newKeyword] = await db
      .insert(keywords)
      .values(keyword)
      .returning();
    return newKeyword;
  }

  async updateKeyword(id: string, updates: Partial<InsertKeyword>): Promise<Keyword> {
    const [updatedKeyword] = await db
      .update(keywords)
      .set(updates)
      .where(eq(keywords.id, id))
      .returning();
    return updatedKeyword;
  }

  async deleteKeyword(id: string): Promise<void> {
    await db.delete(keywords).where(eq(keywords.id, id));
  }

  async getTrackingResults(filters?: {
    keywordId?: string;
    brandId?: string;
    aiPlatform?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<TrackingResult[]> {
    const conditions = [];
    if (filters?.keywordId) {
      conditions.push(eq(trackingResults.keywordId, filters.keywordId));
    }
    if (filters?.brandId) {
      conditions.push(eq(trackingResults.brandId, filters.brandId));
    }
    if (filters?.aiPlatform) {
      conditions.push(eq(trackingResults.aiPlatform, filters.aiPlatform));
    }
    if (filters?.startDate) {
      conditions.push(sql`${trackingResults.trackedAt} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      conditions.push(sql`${trackingResults.trackedAt} <= ${filters.endDate}`);
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(trackingResults)
        .where(and(...conditions))
        .orderBy(desc(trackingResults.trackedAt));
    }

    return await db
      .select()
      .from(trackingResults)
      .orderBy(desc(trackingResults.trackedAt));
  }

  async createTrackingResult(result: InsertTrackingResult): Promise<TrackingResult> {
    const [newResult] = await db
      .insert(trackingResults)
      .values(result)
      .returning();
    return newResult;
  }

  async getLatestResults(keywordId?: string): Promise<TrackingResult[]> {
    if (keywordId) {
      return await db
        .select()
        .from(trackingResults)
        .where(eq(trackingResults.keywordId, keywordId))
        .orderBy(desc(trackingResults.trackedAt))
        .limit(100);
    }

    return await db
      .select()
      .from(trackingResults)
      .orderBy(desc(trackingResults.trackedAt))
      .limit(100);
  }

  async getCompetitorAnalysis(keywordId?: string): Promise<CompetitorAnalysis[]> {
    if (keywordId) {
      return await db
        .select()
        .from(competitorAnalysis)
        .where(eq(competitorAnalysis.keywordId, keywordId))
        .orderBy(desc(competitorAnalysis.analysisDate));
    }

    return await db
      .select()
      .from(competitorAnalysis)
      .orderBy(desc(competitorAnalysis.analysisDate));
  }

  async createCompetitorAnalysis(analysis: InsertCompetitorAnalysis): Promise<CompetitorAnalysis> {
    const [newAnalysis] = await db
      .insert(competitorAnalysis)
      .values(analysis)
      .returning();
    return newAnalysis;
  }

  async getDashboardStats(): Promise<{
    totalVisibility: number;
    rankingImproved: number;
    rankingDropped: number;
    keywordsTracked: number;
  }> {
    // Get total keywords count
    const [keywordsCount] = await db
      .select({ count: sql`count(*)` })
      .from(keywords);

    // Get visibility percentage (keywords with at least one mention)
    const [visibilityData] = await db
      .select({ 
        total: sql`count(distinct ${trackingResults.keywordId})`,
        mentioned: sql`count(distinct case when ${trackingResults.mentioned} = true then ${trackingResults.keywordId} end)`
      })
      .from(trackingResults);

    const totalVisibility = visibilityData.mentioned && visibilityData.total 
      ? Math.round((Number(visibilityData.mentioned) / Number(visibilityData.total)) * 100)
      : 0;

    // For ranking changes, we'll use placeholder logic for now
    // In a real implementation, this would compare current vs previous results
    const rankingImproved = 12;
    const rankingDropped = 3;

    return {
      totalVisibility,
      rankingImproved,
      rankingDropped,
      keywordsTracked: Number(keywordsCount.count) || 0,
    };
  }
}

export const storage = new DatabaseStorage();
