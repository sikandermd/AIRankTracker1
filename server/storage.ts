import { 
  users, brands, keywords, trackingResults, competitorAnalysis, alerts, alertLogs,
  organicKeywords, organicRankings, combinedAlertLogs,
  userProfiles, seoRecommendations, mlInsights, performanceMetrics,
  type User, type InsertUser, type UpsertUser, type Brand, type InsertBrand, 
  type Keyword, type InsertKeyword, type TrackingResult, type InsertTrackingResult,
  type CompetitorAnalysis, type InsertCompetitorAnalysis,
  type Alert, type InsertAlert, type AlertLog, type InsertAlertLog,
  type CombinedAlertLog, type InsertCombinedAlertLog,
  type OrganicKeyword, type InsertOrganicKeyword, type OrganicRanking, type InsertOrganicRanking,

  type SelectPerformanceMetric, type InsertPerformanceMetric
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray, gte, count } from "drizzle-orm";

export interface IStorage {
  // User operations for authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Brand operations (user-specific)
  getAllBrands(userId?: string): Promise<Brand[]>;
  getBrand(id: string): Promise<Brand | undefined>;
  createBrand(brand: InsertBrand): Promise<Brand>;

  // Keyword operations (user-specific)
  getAllKeywords(userId?: string): Promise<Keyword[]>;
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
    userId?: string;
  }): Promise<TrackingResult[]>;
  createTrackingResult(result: InsertTrackingResult): Promise<TrackingResult>;
  getLatestResults(keywordId?: string, userId?: string): Promise<TrackingResult[]>;

  // Competitor analysis operations
  getCompetitorAnalysis(keywordId?: string): Promise<CompetitorAnalysis[]>;
  createCompetitorAnalysis(analysis: InsertCompetitorAnalysis): Promise<CompetitorAnalysis>;

  // Alert operations
  getAllAlerts(userId?: string): Promise<Alert[]>;
  getAlert(id: string): Promise<Alert | undefined>;
  getAlertsForKeywordAndBrand(keywordId: string, brandId: string): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: string, updates: Partial<InsertAlert>): Promise<Alert>;
  deleteAlert(id: string): Promise<void>;

  // Alert log operations
  getAlertLogs(alertId?: string, userId?: string): Promise<AlertLog[]>;
  createAlertLog(log: InsertAlertLog): Promise<AlertLog>;
  updateAlertLog(id: string, updates: Partial<InsertAlertLog>): Promise<AlertLog>;

  // Combined Alert operations
  storeCombinedAlertLog(data: InsertCombinedAlertLog): Promise<CombinedAlertLog>;
  getCombinedAlerts(range?: string, userId?: string): Promise<any[]>;
  getCombinedAlertStats(): Promise<{
    totalCombined: number;
    totalIndividual: number;
    sentToday: number;
    averagePerBatch: number;
  }>;
  markCombinedAlertAsSent(brandId: string, keywordId: string, alertType: string, platform: string, timestamp: Date): Promise<void>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalVisibility: number;
    rankingImproved: number;
    rankingDropped: number;
    keywordsTracked: number;
  }>;

  // Organic Keywords operations
  getAllOrganicKeywords(userId?: string): Promise<OrganicKeyword[]>;
  getOrganicKeyword(id: string): Promise<OrganicKeyword | undefined>;
  createOrganicKeyword(keyword: InsertOrganicKeyword): Promise<OrganicKeyword>;
  updateOrganicKeyword(id: string, updates: Partial<InsertOrganicKeyword>): Promise<OrganicKeyword>;
  updateOrganicKeywordPosition(id: string, currentPosition: number): Promise<OrganicKeyword>;
  
  // Organic Rankings operations
  getOrganicRankings(keywordId?: string, userId?: string): Promise<OrganicRanking[]>;
  createOrganicRanking(ranking: InsertOrganicRanking): Promise<OrganicRanking>;


  createPerformanceMetric(metric: InsertPerformanceMetric): Promise<SelectPerformanceMetric>;
  getPerformanceMetrics(userId: string, filters?: { metricType?: string; brandId?: string; period?: string; }): Promise<SelectPerformanceMetric[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllBrands(userId?: string): Promise<Brand[]> {
    if (userId) {
      return await db.select().from(brands)
        .where(eq(brands.userId, userId))
        .orderBy(brands.name);
    }
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

  async getAllKeywords(userId?: string): Promise<Keyword[]> {
    if (userId) {
      return await db.select().from(keywords)
        .where(eq(keywords.userId, userId))
        .orderBy(desc(keywords.createdAt));
    }
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
      .values(result as any)
      .returning();
    return newResult;
  }

  async getLatestResults(keywordId?: string, userId?: string): Promise<TrackingResult[]> {
    let query = db.select().from(trackingResults);

    const conditions = [];
    if (keywordId) {
      conditions.push(eq(trackingResults.keywordId, keywordId));
    }
    if (userId) {
      conditions.push(eq(trackingResults.userId, userId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query
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
  async getAllAlerts(userId?: string): Promise<Alert[]> {
    if (userId) {
      return await db
        .select()
        .from(alerts)
        .where(eq(alerts.userId, userId))
        .orderBy(desc(alerts.createdAt));
    }
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
      .values(alert as any)
      .returning();
    return newAlert;
  }

  async updateAlert(id: string, updates: Partial<InsertAlert>): Promise<Alert> {
    const updateData: any = { ...updates, updatedAt: new Date() };
    const [updatedAlert] = await db
      .update(alerts)
      .set(updateData)
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
  async getAlertLogs(alertId?: string, userId?: string): Promise<AlertLog[]> {
    let query = db.select().from(alertLogs);

    const conditions = [];
    if (alertId) {
      conditions.push(eq(alertLogs.alertId, alertId));
    }
    if (userId) {
      conditions.push(eq(alertLogs.userId, userId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query
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


  // Organic Keywords operations
  async getAllOrganicKeywords(userId?: string): Promise<OrganicKeyword[]> {
    if (userId) {
      return await db.select().from(organicKeywords)
        .where(eq(organicKeywords.userId, userId))
        .orderBy(desc(organicKeywords.createdAt));
    }
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

  async updateOrganicKeywordPosition(id: string, currentPosition: number, url?: string): Promise<OrganicKeyword> {
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
        url: url || existing.url,
        updatedAt: new Date() 
      })
      .where(eq(organicKeywords.id, id))
      .returning();
    return updated;
  }

  async getOrganicKeywords(): Promise<OrganicKeyword[]> {
    return await db.select().from(organicKeywords).orderBy(desc(organicKeywords.createdAt));
  }

  // Organic Rankings operations
  async getOrganicRankings(keywordId?: string, userId?: string): Promise<OrganicRanking[]> {
    let query = db.select().from(organicRankings);

    const conditions = [];
    if (keywordId) {
      conditions.push(eq(organicRankings.keywordId, keywordId));
    }
    if (userId) {
      conditions.push(eq(organicRankings.userId, userId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(organicRankings.checkedAt));
  }

  async createOrganicRanking(ranking: InsertOrganicRanking): Promise<OrganicRanking> {
    const [created] = await db.insert(organicRankings).values(ranking).returning();
    return created;
  }

  // Combined Alert operations
  async storeCombinedAlertLog(data: InsertCombinedAlertLog): Promise<CombinedAlertLog> {
    const [log] = await db.insert(combinedAlertLogs).values(data).returning();
    return log;
  }

  async getCombinedAlerts(range?: string, userId?: string): Promise<any[]> {
    const conditions = [];
    
    if (range && range !== 'all') {
      const now = new Date();
      const daysBack = range === '1d' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : null;
      
      if (daysBack) {
        const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
        conditions.push(gte(combinedAlertLogs.createdAt, startDate));
      }
    }

    if (userId) {
      conditions.push(eq(combinedAlertLogs.userId, userId));
    }

    let query = db
      .select({
        id: combinedAlertLogs.id,
        brandId: combinedAlertLogs.brandId,
        keywordId: combinedAlertLogs.keywordId,
        email: combinedAlertLogs.email,
        combinedAt: combinedAlertLogs.combinedAt,
        sent: combinedAlertLogs.sent,
        createdAt: combinedAlertLogs.createdAt,
        brandName: brands.name,
        keyword: keywords.keyword,
      })
      .from(combinedAlertLogs)
      .leftJoin(brands, eq(combinedAlertLogs.brandId, brands.id))
      .leftJoin(keywords, eq(combinedAlertLogs.keywordId, keywords.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const logs = await query.orderBy(desc(combinedAlertLogs.createdAt));

    // Group by brand+keyword+email combination
    const grouped = logs.reduce((acc: any, log: any) => {
      const key = `${log.brandId}-${log.keywordId}-${log.email}`;
      if (!acc[key]) {
        acc[key] = {
          id: log.id,
          brandId: log.brandId,
          keywordId: log.keywordId,
          brandName: log.brandName,
          keyword: log.keyword,
          email: log.email,
          combinedAt: log.combinedAt || log.createdAt,
          sent: log.sent,
          alerts: []
        };
      }
      return acc;
    }, {});

    // Get individual alerts for each group
    for (const groupKey of Object.keys(grouped)) {
      const group = grouped[groupKey];
      const alertDetails = await db
        .select()
        .from(combinedAlertLogs)
        .where(
          and(
            eq(combinedAlertLogs.brandId, group.brandId),
            eq(combinedAlertLogs.keywordId, group.keywordId),
            eq(combinedAlertLogs.email, group.email)
          )
        )
        .orderBy(desc(combinedAlertLogs.timestamp));

      group.alerts = alertDetails.map((alert: any) => ({
        type: alert.alertType,
        platform: alert.platform,
        previousValue: alert.previousValue,
        currentValue: alert.currentValue,
        timestamp: alert.timestamp
      }));
    }

    return Object.values(grouped);
  }

  async getCombinedAlertStats(): Promise<{
    totalCombined: number;
    totalIndividual: number;
    sentToday: number;
    averagePerBatch: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalCombined] = await db
      .select({ count: count() })
      .from(combinedAlertLogs)
      .where(eq(combinedAlertLogs.combined, true));

    const [totalIndividual] = await db
      .select({ count: count() })
      .from(combinedAlertLogs);

    const [sentToday] = await db
      .select({ count: count() })
      .from(combinedAlertLogs)
      .where(
        and(
          eq(combinedAlertLogs.sent, true),
          gte(combinedAlertLogs.createdAt, today)
        )
      );

    const averagePerBatch = totalCombined.count > 0 ? totalIndividual.count / totalCombined.count : 0;

    return {
      totalCombined: totalCombined.count,
      totalIndividual: totalIndividual.count,
      sentToday: sentToday.count,
      averagePerBatch
    };
  }

  async markCombinedAlertAsSent(
    brandId: string,
    keywordId: string,
    alertType: string,
    platform: string,
    timestamp: Date
  ): Promise<void> {
    await db
      .update(combinedAlertLogs)
      .set({ 
        sent: true, 
        combinedAt: new Date() 
      })
      .where(
        and(
          eq(combinedAlertLogs.brandId, brandId),
          eq(combinedAlertLogs.keywordId, keywordId),
          eq(combinedAlertLogs.alertType, alertType),
          eq(combinedAlertLogs.platform, platform),
          eq(combinedAlertLogs.timestamp, timestamp)
        )
      );
  }



  async createPerformanceMetric(metric: InsertPerformanceMetric): Promise<SelectPerformanceMetric> {
    const [created] = await db.insert(performanceMetrics).values(metric).returning();
    return created;
  }

  async getPerformanceMetrics(userId: string, filters?: {
    metricType?: string;
    brandId?: string;
    period?: string;
  }): Promise<SelectPerformanceMetric[]> {
    const conditions = [eq(performanceMetrics.userId, userId)];
    
    if (filters?.metricType) {
      conditions.push(eq(performanceMetrics.metricType, filters.metricType));
    }
    if (filters?.brandId) {
      conditions.push(eq(performanceMetrics.brandId, filters.brandId));
    }
    if (filters?.period) {
      conditions.push(eq(performanceMetrics.period, filters.period));
    }

    return await db
      .select()
      .from(performanceMetrics)
      .where(and(...conditions))
      .orderBy(desc(performanceMetrics.date));
  }
}

export const storage = new DatabaseStorage();
