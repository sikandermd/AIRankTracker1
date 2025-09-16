import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for user sessions
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Google OAuth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  userId: varchar("user_id").references(() => users.id).notNull(), // Each brand belongs to a user
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const keywords = pgTable("keywords", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyword: text("keyword").notNull(),
  category: text("category"),
  brandId: varchar("brand_id").references(() => brands.id),
  userId: varchar("user_id").references(() => users.id).notNull(), // Keywords belong to users
  trackGpt: boolean("track_gpt").default(true),
  trackClaude: boolean("track_claude").default(true),
  trackGemini: boolean("track_gemini").default(true),
  trackPerplexity: boolean("track_perplexity").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  keywordIdx: index("keyword_idx").on(table.keyword),
  brandIdx: index("brand_idx").on(table.brandId),
  userIdx: index("user_idx").on(table.userId),
}));

export const trackingResults = pgTable("tracking_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keywordId: varchar("keyword_id").references(() => keywords.id),
  brandId: varchar("brand_id").references(() => brands.id),
  aiPlatform: text("ai_platform").notNull(), // 'gpt', 'claude', 'gemini', 'perplexity'
  mentioned: boolean("mentioned").default(false),
  position: text("position"), // 'top', 'middle', 'bottom'
  mentionCount: integer("mention_count").default(0),
  responseText: text("response_text"),
  competitorsMentioned: jsonb("competitors_mentioned").$type<string[]>().default([]),
  analysisData: jsonb("analysis_data").$type<Record<string, any>>(),
  trackedAt: timestamp("tracked_at").defaultNow().notNull(),
}, (table) => ({
  keywordIdx: index("tracking_keyword_idx").on(table.keywordId),
  platformIdx: index("tracking_platform_idx").on(table.aiPlatform),
  dateIdx: index("tracking_date_idx").on(table.trackedAt),
}));

export const competitorAnalysis = pgTable("competitor_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitorBrand: text("competitor_brand").notNull(),
  keywordId: varchar("keyword_id").references(() => keywords.id),
  aiPlatform: text("ai_platform").notNull(),
  mentionCount: integer("mention_count").default(0),
  visibilityScore: integer("visibility_score").default(0), // 0-100
  position: text("position"),
  analysisDate: timestamp("analysis_date").defaultNow().notNull(),
}, (table) => ({
  competitorIdx: index("competitor_idx").on(table.competitorBrand),
  keywordIdx: index("competitor_keyword_idx").on(table.keywordId),
}));

// Organic Keywords Tracking Tables
export const organicKeywords = pgTable("organic_keywords", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyword: text("keyword").notNull(),
  domain: text("domain").notNull(), // website domain being tracked
  country: text("country").notNull().default('US'), // country code (US, IN, UK, etc.)
  searchEngine: text("search_engine").notNull().default('google'), // google, bing
  currentPosition: integer("current_position"),
  previousPosition: integer("previous_position"),
  searchVolume: integer("search_volume"),
  difficulty: integer("difficulty"), // 0-100
  url: text("url"), // landing page URL for this keyword
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  keywordIdx: index("organic_keyword_idx").on(table.keyword),
  domainIdx: index("organic_domain_idx").on(table.domain),
  countryIdx: index("organic_country_idx").on(table.country),
}));

export const organicRankings = pgTable("organic_rankings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keywordId: varchar("keyword_id").references(() => organicKeywords.id).notNull(),
  position: integer("position"),
  url: text("url"),
  searchVolume: integer("search_volume"),
  clicks: integer("clicks").default(0),
  impressions: integer("impressions").default(0),
  ctr: text("ctr"), // click-through rate as percentage
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
}, (table) => ({
  keywordIdx: index("organic_ranking_keyword_idx").on(table.keywordId),
  dateIdx: index("organic_ranking_date_idx").on(table.checkedAt),
  positionIdx: index("organic_ranking_position_idx").on(table.position),
}));

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  brandId: varchar("brand_id").references(() => brands.id).notNull(),
  keywordId: varchar("keyword_id").references(() => keywords.id).notNull(),
  platforms: text("platforms").array().notNull(), // ['gpt', 'claude', 'gemini', 'perplexity']
  triggerConditions: jsonb("trigger_conditions").$type<{
    mentionChange: boolean;
    positionImprove: boolean;
    newPlatform: boolean;
    mentionIncrease: boolean;
  }>().notNull(),
  notificationMethods: jsonb("notification_methods").$type<{
    email?: string;
    discord?: string;
  }>().notNull(),
  isActive: boolean("is_active").default(true),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const alertLogs = pgTable("alert_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertId: varchar("alert_id").references(() => alerts.id).notNull(),
  platform: text("platform").notNull(),
  triggerType: text("trigger_type").notNull(), // 'mention_change', 'position_improve', 'new_platform', 'mention_increase'
  previousValue: text("previous_value"),
  currentValue: text("current_value").notNull(),
  notificationSent: boolean("notification_sent").default(false),
  notificationError: text("notification_error"),
  triggeredAt: timestamp("triggered_at").defaultNow().notNull(),
});

export const combinedAlertLogs = pgTable("combined_alert_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").references(() => brands.id).notNull(),
  keywordId: varchar("keyword_id").references(() => keywords.id).notNull(),
  alertType: text("alert_type").notNull(),
  platform: text("platform").notNull(),
  previousValue: text("previous_value"),
  currentValue: text("current_value"),
  email: text("email").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  combined: boolean("combined").default(true),
  sent: boolean("sent").default(false),
  combinedAt: timestamp("combined_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const brandsRelations = relations(brands, ({ many }) => ({
  keywords: many(keywords),
  trackingResults: many(trackingResults),
}));

export const keywordsRelations = relations(keywords, ({ one, many }) => ({
  brand: one(brands, {
    fields: [keywords.brandId],
    references: [brands.id],
  }),
  trackingResults: many(trackingResults),
  competitorAnalysis: many(competitorAnalysis),
  alerts: many(alerts),
}));

export const trackingResultsRelations = relations(trackingResults, ({ one }) => ({
  keyword: one(keywords, {
    fields: [trackingResults.keywordId],
    references: [keywords.id],
  }),
  brand: one(brands, {
    fields: [trackingResults.brandId],
    references: [brands.id],
  }),
}));

export const competitorAnalysisRelations = relations(competitorAnalysis, ({ one }) => ({
  keyword: one(keywords, {
    fields: [competitorAnalysis.keywordId],
    references: [keywords.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one, many }) => ({
  brand: one(brands, {
    fields: [alerts.brandId],
    references: [brands.id],
  }),
  keyword: one(keywords, {
    fields: [alerts.keywordId],
    references: [keywords.id],
  }),
  logs: many(alertLogs),
}));

export const alertLogsRelations = relations(alertLogs, ({ one }) => ({
  alert: one(alerts, {
    fields: [alertLogs.alertId],
    references: [alerts.id],
  }),
}));

export const organicKeywordsRelations = relations(organicKeywords, ({ many }) => ({
  rankings: many(organicRankings),
}));

export const organicRankingsRelations = relations(organicRankings, ({ one }) => ({
  keyword: one(organicKeywords, {
    fields: [organicRankings.keywordId],
    references: [organicKeywords.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
  slug: true, // Auto-generated from name
});

export const insertKeywordSchema = createInsertSchema(keywords).omit({
  id: true,
  createdAt: true,
});

export const insertTrackingResultSchema = createInsertSchema(trackingResults).omit({
  id: true,
  trackedAt: true,
});

export const insertCompetitorAnalysisSchema = createInsertSchema(competitorAnalysis).omit({
  id: true,
  analysisDate: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastTriggered: true,
});

export const insertAlertLogSchema = createInsertSchema(alertLogs).omit({
  id: true,
  triggeredAt: true,
});

export const insertCombinedAlertLogSchema = createInsertSchema(combinedAlertLogs).omit({
  id: true,
  timestamp: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type Brand = typeof brands.$inferSelect;
export type InsertBrand = z.infer<typeof insertBrandSchema>;

export type Keyword = typeof keywords.$inferSelect;
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;

export type TrackingResult = typeof trackingResults.$inferSelect;
export type InsertTrackingResult = z.infer<typeof insertTrackingResultSchema>;

export type CompetitorAnalysis = typeof competitorAnalysis.$inferSelect;
export type InsertCompetitorAnalysis = z.infer<typeof insertCompetitorAnalysisSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type AlertLog = typeof alertLogs.$inferSelect;
export type InsertAlertLog = z.infer<typeof insertAlertLogSchema>;

export type CombinedAlertLog = typeof combinedAlertLogs.$inferSelect;
export type InsertCombinedAlertLog = z.infer<typeof insertCombinedAlertLogSchema>;

// Organic Keywords Insert Schemas
export const insertOrganicKeywordSchema = createInsertSchema(organicKeywords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganicRankingSchema = createInsertSchema(organicRankings).omit({
  id: true,
  checkedAt: true,
});

// Organic Keywords Types
export type OrganicKeyword = typeof organicKeywords.$inferSelect;
export type InsertOrganicKeyword = z.infer<typeof insertOrganicKeywordSchema>;

export type OrganicRanking = typeof organicRankings.$inferSelect;
export type InsertOrganicRanking = z.infer<typeof insertOrganicRankingSchema>;


// ML-Powered SEO Recommendation System Tables
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  industry: text("industry"),
  businessSize: text("business_size"), // startup, small, medium, enterprise
  primaryGoals: text("primary_goals").array(), // ['brand_awareness', 'lead_generation', 'sales']
  targetAudience: jsonb("target_audience").$type<{
    demographics: string[];
    interests: string[];
    geoLocations: string[];
  }>(),
  competitorBrands: text("competitor_brands").array().default([]),
  monthlyBudget: integer("monthly_budget"),
  preferredChannels: text("preferred_channels").array(), // ['organic', 'paid', 'social']
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const seoRecommendations = pgTable("seo_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  brandId: varchar("brand_id").references(() => brands.id),
  type: text("type").notNull(), // 'keyword', 'content', 'technical', 'competitive'
  priority: text("priority").notNull(), // 'high', 'medium', 'low'
  category: text("category").notNull(), // 'ai_visibility', 'organic_ranking', 'competitor_gap'
  title: text("title").notNull(),
  description: text("description").notNull(),
  actionItems: jsonb("action_items").$type<{
    task: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    timeframe: string;
  }[]>().notNull(),
  expectedImpact: jsonb("expected_impact").$type<{
    metric: string;
    currentValue: number;
    projectedValue: number;
    confidence: number; // 0-100
  }[]>(),
  relatedKeywords: text("related_keywords").array().default([]),
  confidenceScore: integer("confidence_score").notNull(), // 0-100
  status: text("status").default('pending'), // 'pending', 'in_progress', 'completed', 'dismissed'
  implementedAt: timestamp("implemented_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("recommendation_user_idx").on(table.userId),
  typeIdx: index("recommendation_type_idx").on(table.type),
  priorityIdx: index("recommendation_priority_idx").on(table.priority),
  statusIdx: index("recommendation_status_idx").on(table.status),
}));

export const mlInsights = pgTable("ml_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  brandId: varchar("brand_id").references(() => brands.id),
  insightType: text("insight_type").notNull(), // 'trend', 'anomaly', 'opportunity', 'threat'
  title: text("title").notNull(),
  description: text("description").notNull(),
  data: jsonb("data").$type<{
    metrics: Record<string, number>;
    trends: Array<{
      period: string;
      value: number;
      change: number;
    }>;
    patterns: string[];
  }>().notNull(),
  confidence: integer("confidence").notNull(), // 0-100
  impact: text("impact").notNull(), // 'high', 'medium', 'low'
  actionability: text("actionability").notNull(), // 'immediate', 'short_term', 'long_term'
  relatedRecommendations: text("related_recommendations").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("insight_user_idx").on(table.userId),
  typeIdx: index("insight_type_idx").on(table.insightType),
  impactIdx: index("insight_impact_idx").on(table.impact),
}));

export const performanceMetrics = pgTable("performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  brandId: varchar("brand_id").references(() => brands.id),
  metricType: text("metric_type").notNull(), // 'ai_visibility', 'organic_ranking', 'traffic', 'conversions'
  metricName: text("metric_name").notNull(),
  value: integer("value").notNull(),
  previousValue: integer("previous_value"),
  changePercent: integer("change_percent"),
  period: text("period").notNull(), // 'daily', 'weekly', 'monthly'
  date: timestamp("date").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("metric_user_idx").on(table.userId),
  typeIdx: index("metric_type_idx").on(table.metricType),
  dateIdx: index("metric_date_idx").on(table.date),
}));

// ML Schema Insert/Select Types
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSeoRecommendationSchema = createInsertSchema(seoRecommendations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMlInsightSchema = createInsertSchema(mlInsights).omit({
  id: true,
  createdAt: true,
});

export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({
  id: true,  
  createdAt: true,
});

export type InsertUserProfile = typeof userProfiles.$inferInsert;
export type SelectUserProfile = typeof userProfiles.$inferSelect;
export type InsertSeoRecommendation = typeof seoRecommendations.$inferInsert;
export type SelectSeoRecommendation = typeof seoRecommendations.$inferSelect;
export type InsertMlInsight = typeof mlInsights.$inferInsert;
export type SelectMlInsight = typeof mlInsights.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;
export type SelectPerformanceMetric = typeof performanceMetrics.$inferSelect;
