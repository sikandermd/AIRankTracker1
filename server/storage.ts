import { 
  users, brands, keywords, trackingResults, competitorAnalysis, alerts, alertLogs,
  organicKeywords, organicRankings,
  type User, type InsertUser, type Brand, type InsertBrand, 
  type Keyword, type InsertKeyword, type TrackingResult, type InsertTrackingResult,
  type CompetitorAnalysis, type InsertCompetitorAnalysis,
  type Alert, type InsertAlert, type AlertLog, type InsertAlertLog,
  type OrganicKeyword, type InsertOrganicKeyword, type OrganicRanking, type InsertOrganicRanking
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

  // Alert operations
  getAllAlerts(): Promise<Alert[]>;
  getAlert(id: string): Promise<Alert | undefined>;
  getAlertsForKeywordAndBrand(keywordId: string, brandId: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: string, updates: Partial<InsertAlert>): Promise<Alert>;
  deleteAlert(id: string): Promise<void>;

  // Alert log operations
  getAlertLogs(alertId?: string): Promise<AlertLog[]>;
  createAlertLog(log: InsertAlertLog): Promise<AlertLog>;
  updateAlertLog(id: string, updates: Partial<InsertAlertLog>): Promise<AlertLog>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalVisibility: number;
    rankingImproved: number;
    rankingDropped: number;
    keywordsTracked: number;
  }>;

  // Organic Keywords operations
  getAllOrganicKeywords(): Promise<OrganicKeyword[]>;
  getOrganicKeyword(id: string): Promise<OrganicKeyword | undefined>;
  createOrganicKeyword(keyword: InsertOrganicKeyword): Promise<OrganicKeyword>;
  updateOrganicKeyword(id: string, updates: Partial<InsertOrganicKeyword>): Promise<OrganicKeyword>;
  updateOrganicKeywordPosition(id: string, currentPosition: number): Promise<OrganicKeyword>;
  
  // Organic Rankings operations
  getOrganicRankings(keywordId?: string): Promise<OrganicRanking[]>;
  createOrganicRanking(ranking: InsertOrganicRanking): Promise<OrganicRanking>;
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
    // Generate slug from name
    const slug = brand.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const [newBrand] = await db
      .insert(brands)
      .values({ ...brand, slug })
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
    // Check for duplicate keyword for the same brand
    const existing = await db
      .select()
      .from(keywords)
      .where(and(
        eq(keywords.keyword, keyword.keyword),
        eq(keywords.brandId, keyword.brandId!)
      ))
      .limit(1);

    if (existing.length > 0) {
      throw new Error(`Keyword "${keyword.keyword}" already exists for this brand`);
    }

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

  // Alert operations
  async getAllAlerts(): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .orderBy(desc(alerts.createdAt));
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    const [alert] = await db
      .select()
      .from(alerts)
      .where(eq(alerts.id, id));
    return alert;
  }

  async getAlertsForKeywordAndBrand(keywordId: string, brandId: string): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(
        and(
          eq(alerts.keywordId, keywordId),
          eq(alerts.brandId, brandId),
          eq(alerts.isActive, true)
        )
      );
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db
      .insert(alerts)
      .values(alert)
      .returning();
    return newAlert;
  }

  async updateAlert(id: string, updates: Partial<InsertAlert>): Promise<Alert> {
    const [updatedAlert] = await db
      .update(alerts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(alerts.id, id))
      .returning();
    return updatedAlert;
  }

  async deleteAlert(id: string): Promise<void> {
    await db
      .delete(alerts)
      .where(eq(alerts.id, id));
  }

  // Alert log operations
  async getAlertLogs(alertId?: string): Promise<AlertLog[]> {
    if (alertId) {
      return await db
        .select()
        .from(alertLogs)
        .where(eq(alertLogs.alertId, alertId))
        .orderBy(desc(alertLogs.triggeredAt));
    }

    return await db
      .select()
      .from(alertLogs)
      .orderBy(desc(alertLogs.triggeredAt))
      .limit(100);
  }

  async createAlertLog(log: InsertAlertLog): Promise<AlertLog> {
    const [newLog] = await db
      .insert(alertLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async updateAlertLog(id: string, updates: Partial<InsertAlertLog>): Promise<AlertLog> {
    const [updatedLog] = await db
      .update(alertLogs)
      .set(updates)
      .where(eq(alertLogs.id, id))
      .returning();
    return updatedLog;
  }

  // Dashboard stats  
  async getDashboardStats(): Promise<{
    totalVisibility: number;
    rankingImproved: number;
    rankingDropped: number;
    keywordsTracked: number;
  }> {
    const totalVisibility = 35;
    const rankingImproved = 12;
    const rankingDropped = 4;
    const keywordsTracked = 28;
    return { totalVisibility, rankingImproved, rankingDropped, keywordsTracked };
  }

  // Organic Keywords operations
  async getAllOrganicKeywords(): Promise<OrganicKeyword[]> {
    return await db.select().from(organicKeywords).orderBy(desc(organicKeywords.createdAt));
  }

  async getOrganicKeyword(id: string): Promise<OrganicKeyword | undefined> {
    const [keyword] = await db.select().from(organicKeywords).where(eq(organicKeywords.id, id));
    return keyword || undefined;
  }

  async createOrganicKeyword(keyword: InsertOrganicKeyword): Promise<OrganicKeyword> {
    const [created] = await db.insert(organicKeywords).values(keyword).returning();
    return created;
  }

  async updateOrganicKeyword(id: string, updates: Partial<InsertOrganicKeyword>): Promise<OrganicKeyword> {
    const [updated] = await db
      .update(organicKeywords)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organicKeywords.id, id))
      .returning();
    return updated;
  }

  async updateOrganicKeywordPosition(id: string, currentPosition: number): Promise<OrganicKeyword> {
    // First get the current keyword to store previous position
    const existing = await this.getOrganicKeyword(id);
    if (!existing) {
      throw new Error('Keyword not found');
    }

    const [updated] = await db
      .update(organicKeywords)
      .set({ 
        previousPosition: existing.currentPosition,
        currentPosition: currentPosition,
        updatedAt: new Date() 
      })
      .where(eq(organicKeywords.id, id))
      .returning();
    return updated;
  }

  // Organic Rankings operations
  async getOrganicRankings(keywordId?: string): Promise<OrganicRanking[]> {
    if (keywordId) {
      return await db
        .select()
        .from(organicRankings)
        .where(eq(organicRankings.keywordId, keywordId))
        .orderBy(desc(organicRankings.checkedAt));
    }
    return await db.select().from(organicRankings).orderBy(desc(organicRankings.checkedAt));
  }

  async createOrganicRanking(ranking: InsertOrganicRanking): Promise<OrganicRanking> {
    const [created] = await db.insert(organicRankings).values(ranking).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
