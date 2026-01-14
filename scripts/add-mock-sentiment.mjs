#!/usr/bin/env node
/**
 * Add mock sentiment data for demo purposes
 */

import {drizzle} from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const SENTIMENTS = ['positive', 'negative', 'neutral'];
const THREAT_LEVELS = ['safe', 'low', 'medium', 'high', 'critical'];
const PATTERNS = [
  ['Phishing', 'Urgency Tactics'],
  ['Brand Impersonation', 'Too Good To Be True'],
  ['Advance Fee Fraud', 'Credential Harvesting'],
  ['Malware Distribution', 'Fake Giveaway'],
  ['Investment Scam', 'Phishing']
];

function getRandomSentiment() {
  const sentiment = SENTIMENTS[Math.floor(Math.random() * SENTIMENTS.length)];
  const score = sentiment === 'positive' ? Math.random() * 0.5 + 0.5 :
                sentiment === 'negative' ? -(Math.random() * 0.5 + 0.5) :
                (Math.random() - 0.5) * 0.4;
  return { sentiment, score };
}

function getRandomThreatLevel() {
  const weights = [0.5, 0.25, 0.12, 0.08, 0.05]; // More safe tweets
  const random = Math.random();
  let cumulative = 0;
  for (let i = 0; i < THREAT_LEVELS.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) return THREAT_LEVELS[i];
  }
  return 'safe';
}

async function addMockData() {
  console.log('📝 Adding mock sentiment data...\n');
  
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(conn);
  
  // Update all NULL sentiment tweets with mock data
  const result = await db.execute(`
    UPDATE tweets 
    SET 
      sentimentScore = (RAND() * 2 - 1),
      sentimentLabel = ELT(FLOOR(RAND() * 3) + 1, 'positive', 'negative', 'neutral'),
      threatLevel = ELT(FLOOR(RAND() * 5) + 1, 'safe', 'low', 'medium', 'high', 'critical'),
      credibilityScore = (RAND() * 0.5 + 0.5),
      isPhishing = (RAND() < 0.15),
      aiExplanation = 'Mock data for demo purposes',
      detectedPatterns = JSON_ARRAY('Demo Pattern 1', 'Demo Pattern 2')
    WHERE sentimentLabel IS NULL
  `);
  
  console.log(`✅ Updated ${result[0].affectedRows} tweets with mock sentiment data\n`);
  
  // Verify
  const check = await db.execute(`
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
  
  const stats = check[0][0];
  console.log('📊 Sentiment Distribution:');
  console.log(`   Positive: ${stats.positive} (${((stats.positive/stats.total)*100).toFixed(1)}%)`);
  console.log(`   Negative: ${stats.negative} (${((stats.negative/stats.total)*100).toFixed(1)}%)`);
  console.log(`   Neutral:  ${stats.neutral} (${((stats.neutral/stats.total)*100).toFixed(1)}%)`);
  
  console.log('\n🎯 Threat Distribution:');
  console.log(`   Critical: ${stats.critical} (${((stats.critical/stats.total)*100).toFixed(1)}%)`);
  console.log(`   High:     ${stats.high} (${((stats.high/stats.total)*100).toFixed(1)}%)`);
  console.log(`   Medium:   ${stats.medium} (${((stats.medium/stats.total)*100).toFixed(1)}%)`);
  console.log(`   Low:      ${stats.low} (${((stats.low/stats.total)*100).toFixed(1)}%)`);
  console.log(`   Safe:     ${stats.safe} (${((stats.safe/stats.total)*100).toFixed(1)}%)`);
  
  await conn.end();
  console.log('\n✨ Mock data added successfully!');
}

addMockData().catch(console.error);
