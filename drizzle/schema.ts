import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, float } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Analyzed tweets with AI-powered threat assessment
 */
export const tweets = mysqlTable("tweets", {
  id: int("id").autoincrement().primaryKey(),
  tweetId: varchar("tweetId", { length: 64 }).notNull().unique(),
  text: text("text").notNull(),
  author: varchar("author", { length: 255 }),
  authorUsername: varchar("authorUsername", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  analyzedAt: timestamp("analyzedAt").defaultNow().notNull(),
  
  // AI Analysis Results
  sentimentScore: float("sentimentScore"), // -1 to 1
  sentimentLabel: varchar("sentimentLabel", { length: 50 }), // positive, negative, neutral
  threatLevel: varchar("threatLevel", { length: 50 }), // safe, low, medium, high, critical
  threatScore: float("threatScore"), // 0 to 1
  credibilityScore: float("credibilityScore"), // 0 to 1
  isPhishing: boolean("isPhishing").default(false),
  
  // AI Explanations
  aiExplanation: text("aiExplanation"),
  detectedPatterns: text("detectedPatterns"), // JSON array of detected patterns
  
  // Metadata
  searchQuery: varchar("searchQuery", { length: 500 }),
  searchType: varchar("searchType", { length: 50 }), // query or username
  userId: int("userId"),
  
  // Semantic Search
  embedding: text("embedding"), // JSON array of embedding vector
});

export type Tweet = typeof tweets.$inferSelect;
export type InsertTweet = typeof tweets.$inferInsert;

/**
 * URLs extracted from tweets with phishing detection
 */
export const tweetUrls = mysqlTable("tweetUrls", {
  id: int("id").autoincrement().primaryKey(),
  tweetId: int("tweetId").notNull(),
  url: varchar("url", { length: 2000 }).notNull(),
  expandedUrl: varchar("expandedUrl", { length: 2000 }),
  
  // Phishing Detection
  isPhishing: boolean("isPhishing").default(false),
  phishTankStatus: varchar("phishTankStatus", { length: 50 }),
  threatScore: float("threatScore"), // 0 to 1
  
  // AI Analysis
  aiThreatAssessment: text("aiThreatAssessment"),
  detectedThreats: text("detectedThreats"), // JSON array
  urlEmbedding: text("urlEmbedding"), // JSON array for semantic search
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  checkedAt: timestamp("checkedAt").defaultNow().notNull(),
});

export type TweetUrl = typeof tweetUrls.$inferSelect;
export type InsertTweetUrl = typeof tweetUrls.$inferInsert;

/**
 * Search history and analytics
 */
export const searchHistory = mysqlTable("searchHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  query: varchar("query", { length: 500 }).notNull(),
  searchType: varchar("searchType", { length: 50 }).notNull(), // query or username
  resultsCount: int("resultsCount").default(0),
  threatsDetected: int("threatsDetected").default(0),
  phishingDetected: int("phishingDetected").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = typeof searchHistory.$inferInsert;
