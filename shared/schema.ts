import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const keywords = pgTable("keywords", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyword: text("keyword").notNull(),
  category: text("category"),
  brandId: varchar("brand_id").references(() => brands.id),
  trackGpt: boolean("track_gpt").default(true),
  trackClaude: boolean("track_claude").default(true),
  trackGemini: boolean("track_gemini").default(true),
  trackPerplexity: boolean("track_perplexity").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  keywordIdx: index("keyword_idx").on(table.keyword),
  brandIdx: index("brand_idx").on(table.brandId),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

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
