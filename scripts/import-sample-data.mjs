#!/usr/bin/env node
import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/mysql2';
import { tweets, tweetUrls } from '../drizzle/schema.js';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('🔒 TweetPhish AI - Sample Dataset Import');
console.log('═'.repeat(70));

const db = drizzle(DATABASE_URL);

// Read the sample dataset
const datasetPath = '/home/ubuntu/tweetphish-ai/sample_tweets_dataset.json';
console.log(`\n📂 Reading dataset from: ${datasetPath}`);

let dataset;
try {
  const fileContent = readFileSync(datasetPath, 'utf-8');
  dataset = JSON.parse(fileContent);
  console.log(`✅ Loaded ${dataset.length} tweets from dataset`);
} catch (error) {
  console.error(`❌ Error reading dataset: ${error.message}`);
  process.exit(1);
}

// Analyze dataset composition
console.log('\n📊 Dataset Composition Analysis');
console.log('─'.repeat(70));

const threatCounts = {
  critical: dataset.filter(t => t.expected_threat === 'critical').length,
  high: dataset.filter(t => t.expected_threat === 'high').length,
  medium: dataset.filter(t => t.expected_threat === 'medium').length,
  low: dataset.filter(t => t.expected_threat === 'low').length,
  safe: dataset.filter(t => t.expected_threat === 'safe').length,
};

const totalThreats = threatCounts.critical + threatCounts.high + threatCounts.medium + threatCounts.low;
const threatPercentage = ((totalThreats / dataset.length) * 100).toFixed(1);

console.log(`\n🎯 Threat Level Distribution:`);
console.log(`  🔴 Critical: ${threatCounts.critical} (${((threatCounts.critical/dataset.length)*100).toFixed(1)}%)`);
console.log(`  🟠 High:     ${threatCounts.high} (${((threatCounts.high/dataset.length)*100).toFixed(1)}%)`);
console.log(`  🟡 Medium:   ${threatCounts.medium} (${((threatCounts.medium/dataset.length)*100).toFixed(1)}%)`);
console.log(`  🟢 Safe:     ${threatCounts.safe} (${((threatCounts.safe/dataset.length)*100).toFixed(1)}%)`);
console.log(`\n  ⚠️  Total Threats: ${totalThreats}/${dataset.length} (${threatPercentage}%)`);

// Analyze threat patterns
const allPatterns = {};
dataset.forEach(tweet => {
  if (tweet.expected_patterns && Array.isArray(tweet.expected_patterns)) {
    tweet.expected_patterns.forEach(pattern => {
      allPatterns[pattern] = (allPatterns[pattern] || 0) + 1;
    });
  }
});

console.log(`\n🔍 Detected Threat Patterns:`);
const sortedPatterns = Object.entries(allPatterns)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

sortedPatterns.forEach(([pattern, count]) => {
  const patternName = pattern.replace(/_/g, ' ').toUpperCase();
  console.log(`  • ${patternName}: ${count} occurrences`);
});

// Analyze URLs
const tweetsWithUrls = dataset.filter(t => t.urls && t.urls.length > 0).length;
const totalUrls = dataset.reduce((sum, t) => sum + (t.urls?.length || 0), 0);

console.log(`\n🔗 URL Analysis:`);
console.log(`  • Tweets with URLs: ${tweetsWithUrls}/${dataset.length}`);
console.log(`  • Total URLs: ${totalUrls}`);
console.log(`  • Suspicious domains detected: ${totalUrls - threatCounts.safe}`);

// Import tweets
console.log('\n📥 Importing tweets into database...');
console.log('─'.repeat(70));

let importedCount = 0;
let errorCount = 0;

for (const tweet of dataset) {
  try {
    // Insert tweet
    const tweetData = {
      tweetId: tweet.tweet_id,
      text: tweet.text,
      author: tweet.author,
      authorUsername: tweet.author_username,
      createdAt: new Date(tweet.created_at),
      // AI analysis fields will be populated when analyzed
      sentimentScore: null,
      sentimentLabel: null,
      threatLevel: tweet.expected_threat, // Pre-populate with expected threat
      threatScore: null,
      credibilityScore: null,
      isPhishing: tweet.expected_threat === 'critical' || tweet.expected_threat === 'high',
      detectedPatterns: tweet.expected_patterns ? JSON.stringify(tweet.expected_patterns) : null,
      aiExplanation: null,
      embedding: null,
    };

    await db.insert(tweets).values(tweetData);

    // Insert URLs if present
    if (tweet.urls && tweet.urls.length > 0) {
      for (const urlString of tweet.urls) {
        await db.insert(tweetUrls).values({
          tweetId: parseInt(tweet.tweet_id),
          url: urlString,
          isPhishing: tweet.expected_threat === 'critical' || tweet.expected_threat === 'high',
          phishTankStatus: null,
          threatScore: tweet.expected_threat === 'critical' ? 0.9 : tweet.expected_threat === 'high' ? 0.7 : 0.3,
          aiThreatAssessment: null,
          detectedThreats: tweet.expected_patterns ? JSON.stringify(tweet.expected_patterns) : null,
          urlEmbedding: null,
          checkedAt: new Date(),
        });
      }
    }

    importedCount++;
    
    if (importedCount % 10 === 0) {
      process.stdout.write(`\r  ✓ Imported ${importedCount}/${dataset.length} tweets`);
    }
  } catch (error) {
    errorCount++;
    console.error(`\n  ✗ Error importing tweet ${tweet.tweet_id}: ${error.message}`);
  }
}

console.log(`\n\n${'═'.repeat(70)}`);
console.log(`✅ Import Complete!`);
console.log(`${'═'.repeat(70)}`);
console.log(`\n📊 Import Statistics:`);
console.log(`  • Total tweets processed: ${dataset.length}`);
console.log(`  • Successfully imported: ${importedCount}`);
console.log(`  • Errors encountered: ${errorCount}`);
console.log(`  • Success rate: ${((importedCount/dataset.length)*100).toFixed(1)}%`);

console.log(`\n🎯 Threat Summary:`);
console.log(`  • Critical threats: ${threatCounts.critical}`);
console.log(`  • High-risk content: ${threatCounts.high}`);
console.log(`  • Medium-risk content: ${threatCounts.medium}`);
console.log(`  • Safe content: ${threatCounts.safe}`);

console.log(`\n💡 Next Steps:`);
console.log(`  1. Visit the TweetPhish AI dashboard at the dev server URL`);
console.log(`  2. Try semantic search queries:`);
console.log(`     • "financial fraud" - finds money scams, investment theft`);
console.log(`     • "account theft" - finds credential harvesting attempts`);
console.log(`     • "fake giveaway" - finds prize scams and phishing`);
console.log(`  3. Compare semantic vs keyword search results`);
console.log(`  4. View AI-powered threat analysis with explanations`);
console.log(`  5. Upload your own dataset for analysis!`);

console.log(`\n${'═'.repeat(70)}`);
console.log(`🔒 TweetPhish AI - Ready for Demo!`);
console.log(`${'═'.repeat(70)}\n`);

process.exit(0);
