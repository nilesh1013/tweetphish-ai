import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { z } from "zod";
import { 
  getRecentTweets, 
  getTweetsByQuery, 
  getSearchHistory, 
  getAnalyticsStats,
  insertSearchHistory,
  getUrlsByTweetId
} from "./db";
import { analyzeTweetWithAI, semanticSearch, compareSearchMethods } from "./ai-analysis";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  tweets: router({
    getSentimentSummary: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get sentiment distribution
      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN sentimentLabel = 'positive' THEN 1 ELSE 0 END) as positive,
          SUM(CASE WHEN sentimentLabel = 'negative' THEN 1 ELSE 0 END) as negative,
          SUM(CASE WHEN sentimentLabel = 'neutral' THEN 1 ELSE 0 END) as neutral,
          SUM(CASE WHEN threatLevel = 'critical' THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN threatLevel = 'high' THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN threatLevel = 'medium' THEN 1 ELSE 0 END) as medium,
          SUM(CASE WHEN threatLevel = 'low' THEN 1 ELSE 0 END) as low,
          SUM(CASE WHEN threatLevel = 'safe' THEN 1 ELSE 0 END) as safe
        FROM tweets
      `);
      
      // Get sample positive and negative tweets for word extraction
      const [positiveTweets] = await db.execute(`
        SELECT text FROM tweets 
        WHERE sentimentLabel = 'positive' 
        ORDER BY sentimentScore DESC 
        LIMIT 200
      `);
      
      const [negativeTweets] = await db.execute(`
        SELECT text FROM tweets 
        WHERE sentimentLabel = 'negative' 
        ORDER BY sentimentScore ASC 
        LIMIT 200
      `);
      
      // Extract meaningful sentiment-specific words
      const extractSentimentWords = (tweets: any[], count = 5) => {
        // Extended stopwords including generic/common words
        const stopWords = new Set([
          'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'http', 'https', 'com', 'www', 'rt',
          // Additional generic words to filter
          'more', 'read', 'using', 'about', 'just', 'like', 'get', 'make', 'know', 'time', 'than', 'into', 'some', 'other', 'than', 'then', 'them', 'only', 'over', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'need', 'take', 'come', 'see', 'think', 'look', 'find', 'tell', 'ask', 'try', 'feel', 'become', 'leave', 'call'
        ]);
        
        const wordCount: Record<string, number> = {};
        tweets.forEach((tweet: any) => {
          const words = tweet.text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter((w: string) => w.length > 4 && !stopWords.has(w)); // Increased min length to 5
          
          words.forEach((word: string) => {
            wordCount[word] = (wordCount[word] || 0) + 1;
          });
        });
        
        return Object.entries(wordCount)
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .slice(0, count)
          .map(([word, count]) => ({ word, count: count as number }));
      };
      
      // Extract words from both sets
      const positiveWords = extractSentimentWords(positiveTweets as unknown as any[], 10);
      const negativeWords = extractSentimentWords(negativeTweets as unknown as any[], 10);
      
      // Remove words that appear in both lists (keep only unique sentiment words)
      const positiveWordSet = new Set(positiveWords.map(w => w.word));
      const negativeWordSet = new Set(negativeWords.map(w => w.word));
      
      const uniquePositive = positiveWords
        .filter(w => !negativeWordSet.has(w.word))
        .slice(0, 5);
      
      const uniqueNegative = negativeWords
        .filter(w => !positiveWordSet.has(w.word))
        .slice(0, 5);
      
      return {
        distribution: (stats as any)[0],
        topPositiveWords: uniquePositive,
        topNegativeWords: uniqueNegative,
      };
    }),
    // Get recent analyzed tweets with pagination
    getRecent: publicProcedure
      .input(z.object({ 
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20) 
      }))
      .query(async ({ input }) => {
        const offset = (input.page - 1) * input.limit;
        const tweets = await getRecentTweets(input.limit + 1, offset); // Get one extra to check if there are more
        const hasMore = tweets.length > input.limit;
        const results = hasMore ? tweets.slice(0, input.limit) : tweets;
        
        return {
          tweets: results,
          hasMore,
          page: input.page,
          totalDisplayed: results.length
        };
      }),

    // Search tweets by keyword (traditional search)
    searchByKeyword: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input, ctx }) => {
        const results = await getTweetsByQuery(input.query);
        
        // Log search history
        await insertSearchHistory({
          userId: ctx.user?.id,
          query: input.query,
          searchType: 'keyword',
          resultsCount: results.length,
          threatsDetected: results.filter(t => t.threatLevel && !['safe', 'low'].includes(t.threatLevel)).length,
          phishingDetected: results.filter(t => t.isPhishing).length,
        });
        
        return results;
      }),

    // Semantic search using AI embeddings
    semanticSearch: publicProcedure
      .input(z.object({ 
        query: z.string(),
        limit: z.number().optional().default(20)
      }))
      .query(async ({ input, ctx }) => {
        const results = await semanticSearch(input.query, input.limit);
        
        // Log search history
        await insertSearchHistory({
          userId: ctx.user?.id,
          query: input.query,
          searchType: 'semantic',
          resultsCount: results.length,
          threatsDetected: 0,
          phishingDetected: 0,
        });
        
        return results;
      }),

    // Compare semantic vs keyword search
    compareSearch: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await compareSearchMethods(input.query);
      }),

    // Analyze a specific tweet with AI
    analyzeTweet: publicProcedure
      .input(z.object({ 
        tweetId: z.string(),
        text: z.string()
      }))
      .mutation(async ({ input }) => {
        return await analyzeTweetWithAI(input.tweetId, input.text);
      }),

    // Lazy analyze tweet - check cache first, then analyze if needed
    lazyAnalyze: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await import('./db').then(m => m.getDb());
        if (!db) throw new Error('Database not available');

        const { tweets } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');

        // Get tweet from database
        const result = await db.select().from(tweets).where(eq(tweets.id, input.id)).limit(1);
        if (!result[0]) throw new Error('Tweet not found');

        const tweet = result[0];

        // If already analyzed (has sentiment and threat level), return cached results
        if (tweet.sentimentLabel && tweet.threatLevel) {
          return {
            ...tweet,
            detectedPatterns: tweet.detectedPatterns ? JSON.parse(tweet.detectedPatterns) : [],
            cached: true
          };
        }

        // Otherwise, analyze with AI
        const analysis = await analyzeTweetWithAI(tweet.tweetId, tweet.text);

        // Cache results in database
        await db.update(tweets)
          .set({
            sentimentScore: analysis.sentimentScore,
            sentimentLabel: analysis.sentimentLabel,
            threatLevel: analysis.threatLevel,
            credibilityScore: analysis.credibilityScore,
            isPhishing: analysis.isPhishing,
            aiExplanation: analysis.aiExplanation,
            detectedPatterns: JSON.stringify(analysis.detectedPatterns),
          })
          .where(eq(tweets.id, input.id));

        return { ...tweet, ...analysis, cached: false };
      }),

    // Get URLs for a tweet
    getTweetUrls: publicProcedure
      .input(z.object({ tweetId: z.number() }))
      .query(async ({ input }) => {
        return await getUrlsByTweetId(input.tweetId);
      }),
  }),

  analytics: router({
    // Get overall statistics
    getStats: publicProcedure.query(async () => {
      return await getAnalyticsStats();
    }),

    // Get search history
    getHistory: publicProcedure
      .input(z.object({ limit: z.number().optional().default(20) }))
      .query(async ({ input, ctx }) => {
        return await getSearchHistory(ctx.user?.id, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
