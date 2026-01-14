import { invokeLLM } from "./_core/llm";
import { getRecentTweets, insertTweet, getTweetByTweetId } from "./db";

interface TweetAnalysis {
  sentimentScore: number;
  sentimentLabel: string;
  threatLevel: string;
  threatScore: number;
  credibilityScore: number;
  isPhishing: boolean;
  aiExplanation: string;
  detectedPatterns: string[];
}

interface SemanticSearchResult {
  tweetId: string;
  text: string;
  similarity: number;
  threatLevel: string | undefined;
  isPhishing: boolean;
}

/**
 * Analyze a tweet using Gemini AI for sentiment, threat detection, and credibility scoring
 */
export async function analyzeTweetWithAI(tweetId: string, text: string): Promise<TweetAnalysis> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert security analyst specializing in detecting phishing, scams, and threats in social media content. Analyze tweets for:
1. Sentiment (positive, negative, neutral)
2. Threat level (safe, low, medium, high, critical)
3. Credibility score (0-1, where 1 is highly credible)
4. Phishing indicators
5. Suspicious patterns

Return your analysis in JSON format.`
        },
        {
          role: "user",
          content: `Analyze this tweet for threats and credibility:\n\n"${text}"\n\nProvide detailed analysis including sentiment, threat level, credibility score, whether it's phishing, explanation, and detected patterns.`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "tweet_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sentimentScore: { 
                type: "number", 
                description: "Sentiment score from -1 (negative) to 1 (positive)" 
              },
              sentimentLabel: { 
                type: "string", 
                description: "Sentiment label: positive, negative, or neutral" 
              },
              threatLevel: { 
                type: "string", 
                description: "Threat level: safe, low, medium, high, or critical" 
              },
              threatScore: { 
                type: "number", 
                description: "Threat score from 0 (safe) to 1 (critical threat)" 
              },
              credibilityScore: { 
                type: "number", 
                description: "Credibility score from 0 (not credible) to 1 (highly credible)" 
              },
              isPhishing: { 
                type: "boolean", 
                description: "Whether the tweet appears to be phishing" 
              },
              aiExplanation: { 
                type: "string", 
                description: "Detailed explanation of the analysis" 
              },
              detectedPatterns: { 
                type: "array", 
                items: { type: "string" },
                description: "List of suspicious patterns detected" 
              }
            },
            required: [
              "sentimentScore", 
              "sentimentLabel", 
              "threatLevel", 
              "threatScore", 
              "credibilityScore", 
              "isPhishing", 
              "aiExplanation", 
              "detectedPatterns"
            ],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    const contentStr = typeof content === 'string' ? content : '';
    if (!contentStr) {
      throw new Error("No response from AI");
    }

    const analysis: TweetAnalysis = JSON.parse(contentStr);

    // Store the analysis in database
    const existingTweet = await getTweetByTweetId(tweetId);
    if (!existingTweet) {
      await insertTweet({
        tweetId,
        text,
        sentimentScore: analysis.sentimentScore,
        sentimentLabel: analysis.sentimentLabel,
        threatLevel: analysis.threatLevel,
        threatScore: analysis.threatScore,
        credibilityScore: analysis.credibilityScore,
        isPhishing: analysis.isPhishing,
        aiExplanation: analysis.aiExplanation,
        detectedPatterns: JSON.stringify(analysis.detectedPatterns),
      });
    }

    return analysis;
  } catch (error) {
    console.error("Error analyzing tweet:", error);
    throw error;
  }
}

/**
 * Generate embedding for text using Gemini
 */
async function generateEmbedding(text: string): Promise<number[]> {
  // For MVP, we'll use a simple approach: get AI to generate semantic keywords
  // In production, you'd use a proper embedding model
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Extract 10 key semantic concepts from the text as single words or short phrases, separated by commas."
      },
      {
        role: "user",
        content: text
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  const contentStr = typeof content === 'string' ? content : '';
  const keywords = contentStr.split(',').map((k: string) => k.trim());
  
  // Create a simple embedding based on keyword presence (for MVP demo)
  // In production, use proper embedding models
  return keywords.map((k: string) => k.length * Math.random());
}

/**
 * Semantic search using AI to find similar tweets
 */
export async function semanticSearch(query: string, limit: number = 20): Promise<SemanticSearchResult[]> {
  try {
    // Get all tweets (in production, you'd use vector database)
    const allTweets = await getRecentTweets(1000);
    
    if (allTweets.length === 0) {
      return [];
    }

    // Use AI to find semantically similar tweets
    const tweetTexts = allTweets.map((t, i) => `${i}: ${t.text || 'No text'}`).join('\n');
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a semantic search engine. Given a query and a list of tweets, find the most semantically similar tweets.
Consider meaning, context, and intent - not just keyword matching.
Return the indices of the top ${limit} most relevant tweets with similarity scores.`
        },
        {
          role: "user",
          content: `Query: "${query}"\n\nTweets:\n${tweetTexts.substring(0, 10000)}\n\nReturn the top ${limit} most semantically similar tweet indices with similarity scores (0-1).`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "semantic_search_results",
          strict: true,
          schema: {
            type: "object",
            properties: {
              results: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: { type: "number" },
                    similarity: { type: "number" }
                  },
                  required: ["index", "similarity"],
                  additionalProperties: false
                }
              }
            },
            required: ["results"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    const contentStr = typeof content === 'string' ? content : '';
    if (!contentStr) {
      return [];
    }

    const searchResults = JSON.parse(contentStr) as { results: Array<{ index: number; similarity: number }> };
    
    const mappedResults = searchResults.results
      .map((r: { index: number; similarity: number }) => {
        const tweet = allTweets[r.index];
        if (!tweet) return null;
        return {
          tweetId: tweet.tweetId,
          text: tweet.text || '',
          similarity: r.similarity,
          threatLevel: tweet.threatLevel || undefined,
          isPhishing: tweet.isPhishing || false,
        };
      })
      .filter((r): r is SemanticSearchResult => r !== null)
      .slice(0, limit);
    
    return mappedResults;
  } catch (error) {
    console.error("Error in semantic search:", error);
    return [];
  }
}

/**
 * Compare semantic search vs keyword search
 */
export async function compareSearchMethods(query: string) {
  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearch(query, 10),
    getRecentTweets(100).then(tweets => 
      tweets
        .filter(t => t.text?.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10)
        .map(t => ({
          tweetId: t.tweetId,
          text: t.text || '',
          threatLevel: t.threatLevel || undefined,
          isPhishing: t.isPhishing || false,
        }))
    )
  ]);

  return {
    semantic: semanticResults,
    keyword: keywordResults,
    semanticCount: semanticResults.length,
    keywordCount: keywordResults.length,
  };
}

/**
 * Batch analyze multiple tweets
 */
export async function batchAnalyzeTweets(tweets: Array<{ tweetId: string; text: string }>) {
  const results = [];
  
  for (const tweet of tweets) {
    try {
      const analysis = await analyzeTweetWithAI(tweet.tweetId, tweet.text);
      results.push({ tweetId: tweet.tweetId, success: true, analysis });
    } catch (error) {
      results.push({ tweetId: tweet.tweetId, success: false, error: String(error) });
    }
  }
  
  return results;
}
