import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, tweets, tweetUrls, searchHistory, InsertTweet, InsertTweetUrl, InsertSearchHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Tweet operations
export async function insertTweet(tweet: InsertTweet) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tweets).values(tweet);
  return result;
}

export async function getTweetByTweetId(tweetId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(tweets).where(eq(tweets.tweetId, tweetId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRecentTweets(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(tweets).orderBy(desc(tweets.analyzedAt)).limit(limit).offset(offset);
}

export async function getTweetsByQuery(query: string, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(tweets).where(eq(tweets.searchQuery, query)).orderBy(desc(tweets.analyzedAt)).limit(limit);
}

// URL operations
export async function insertTweetUrl(url: InsertTweetUrl) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(tweetUrls).values(url);
}

export async function getUrlsByTweetId(tweetId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(tweetUrls).where(eq(tweetUrls.tweetId, tweetId));
}

// Search history operations
export async function insertSearchHistory(history: InsertSearchHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(searchHistory).values(history);
}

export async function getSearchHistory(userId?: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  
  if (userId) {
    return db.select().from(searchHistory).where(eq(searchHistory.userId, userId)).orderBy(desc(searchHistory.createdAt)).limit(limit);
  }
  
  return db.select().from(searchHistory).orderBy(desc(searchHistory.createdAt)).limit(limit);
}

export async function getAnalyticsStats() {
  const db = await getDb();
  if (!db) return null;
  
  const allTweets = await db.select().from(tweets);
  const allSearches = await db.select().from(searchHistory);
  
  const totalTweets = allTweets.length;
  const totalSearches = allSearches.length;
  const threatsDetected = allTweets.filter(t => t.threatLevel && !['safe', 'low'].includes(t.threatLevel)).length;
  const phishingDetected = allTweets.filter(t => t.isPhishing).length;
  
  return {
    totalTweets,
    totalSearches,
    threatsDetected,
    phishingDetected,
  };
}
