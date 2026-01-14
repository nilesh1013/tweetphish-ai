#!/usr/bin/env node
/**
 * Demo analysis script:
 * - Analyze first 20 tweets with real Gemini AI
 * - Add mock sentiment data for remaining tweets
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { tweets } from '../drizzle/schema.ts';
import { eq } from 'drizzle-orm';
import { invokeLLM } from '../server/_core/llm.ts';
import dotenv from 'dotenv';

dotenv.config();

const SENTIMENTS = ['positive', 'negative', 'neutral'];
const THREAT_LEVELS = ['safe', 'low', 'medium', 'high', 'critical'];
const PATTERNS = [
  'Phishing', 'Brand Impersonation', 'Urgency Tactics', 
  'Too Good To Be True', 'Advance Fee Fraud', 'Credential Harvesting',
  'Malware Distribution', 'Fake Giveaway', 'Investment Scam'
];

function getRandomSentiment() {
  const sentiment = SENTIMENTS[Math.floor(Math.random() * SENTIMENTS.length)];
  const score = sentiment === 'positive' ? Math.random() * 0.5 + 0.5 :
                sentiment === 'negative' ? -(Math.random() * 0.5 + 0.5) :
                (Math.random() - 0.5) * 0.4;
  return { sentiment, score };
}

function getRandomThreatLevel() {
  const weights = [0.4, 0.25, 0.15, 0.12, 0.08]; // More safe tweets
  const random = Math.random();
  let cumulative = 0;
  for (let i = 0; i < THREAT_LEVELS.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) return THREAT_LEVELS[i];
  }
  return 'safe';
}

function getRandomPatterns(count = 2) {
  const shuffled = [...PATTERNS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function analyzeWithGemini(text) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are a cybersecurity expert analyzing tweets for threats. Respond with JSON only.'
        },
        {
          role: 'user',
          content: `Analyze this tweet for sentiment and threats. Return JSON with:
{
  "sentiment": "positive/negative/neutral",
  "sentimentScore": -1 to 1,
  "threatLevel": "safe/low/medium/high/critical",
  "credibilityScore": 0 to 1,
  "isPhishing": boolean,
  "explanation": "brief explanation",
  "patterns": ["pattern1", "pattern2"]
}

Tweet: "${text.substring(0, 200)}"`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'tweet_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              sentiment: { type: 'string' },
              sentimentScore: { type: 'number' },
              threatLevel: { type: 'string' },
              credibilityScore: { type: 'number' },
              isPhishing: { type: 'boolean' },
              explanation: { type: 'string' },
              patterns: { type: 'array', items: { type: 'string' } }
            },
            required: ['sentiment', 'sentimentScore', 'threatLevel', 'credibilityScore', 'isPhishing', 'explanation', 'patterns'],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Gemini analysis error:', error.message);
    return null;
  }
}

async function demoAnalyze() {
  console.log('🎯 Starting demo analysis...\n');
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);
  
  // Get first 20 tweets for real analysis
  const firstTweets = await db.select().from(tweets).limit(20);
  console.log(`📊 Analyzing first ${firstTweets.length} tweets with Gemini AI...\n`);
  
  let analyzed = 0;
  for (const tweet of firstTweets) {
    console.log(`[${analyzed + 1}/20] Analyzing tweet ${tweet.id}...`);
    
    const analysis = await analyzeWithGemini(tweet.text);
    
    if (analysis) {
      await db.update(tweets)
        .set({
          sentimentScore: analysis.sentimentScore,
          sentimentLabel: analysis.sentiment,
          threatLevel: analysis.threatLevel,
          credibilityScore: analysis.credibilityScore,
          isPhishing: analysis.isPhishing,
          aiExplanation: analysis.explanation,
          detectedPatterns: JSON.stringify(analysis.patterns),
        })
        .where(eq(tweets.id, tweet.id));
      
      console.log(`   ✅ ${analysis.sentiment} | ${analysis.threatLevel}`);
    } else {
      console.log(`   ⚠️  Failed, using mock data`);
      const { sentiment, score } = getRandomSentiment();
      await db.update(tweets)
        .set({
          sentimentScore: score,
          sentimentLabel: sentiment,
          threatLevel: getRandomThreatLevel(),
          credibilityScore: Math.random() * 0.5 + 0.5,
          isPhishing: Math.random() < 0.2,
          aiExplanation: 'Demo analysis',
          detectedPatterns: JSON.stringify(getRandomPatterns()),
        })
        .where(eq(tweets.id, tweet.id));
    }
    
    analyzed++;
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📝 Adding mock sentiment data for remaining tweets...\n`);
  
  // Get remaining tweets (those with NULL sentiment)
  const { sql } = await import('drizzle-orm');
  const remainingTweets = await db.execute(sql`
    SELECT * FROM tweets 
    WHERE sentimentLabel IS NULL 
    LIMIT 12000
  `);
  
  console.log(`Found ${remainingTweets.length} tweets without analysis`);
  
  // Update in batches
  let mockCount = 0;
  for (const tweet of remainingTweets) {
    const { sentiment, score } = getRandomSentiment();
    
    await db.update(tweets)
      .set({
        sentimentScore: score,
        sentimentLabel: sentiment,
        threatLevel: getRandomThreatLevel(),
        credibilityScore: Math.random() * 0.5 + 0.5,
        isPhishing: Math.random() < 0.15,
        aiExplanation: 'Mock data for demo purposes',
        detectedPatterns: JSON.stringify(getRandomPatterns()),
      })
      .where(eq(tweets.id, tweet.id));
    
    mockCount++;
    
    if (mockCount % 500 === 0) {
      console.log(`   Added mock data for ${mockCount} tweets...`);
    }
  }
  
  await connection.end();
  
  console.log(`\n✨ Demo analysis complete!`);
  console.log(`   Real AI analysis: ${analyzed} tweets`);
  console.log(`   Mock data: ${mockCount} tweets`);
  console.log(`   Total: ${analyzed + mockCount} tweets\n`);
}

demoAnalyze().catch(console.error);
