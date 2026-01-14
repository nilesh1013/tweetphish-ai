#!/usr/bin/env node
/**
 * Import large tweet dataset WITHOUT AI analysis
 * AI analysis will be done lazily when tweets are viewed
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

async function importLargeDataset() {
  console.log('📥 Starting large dataset import...\n');
  
  const tweetsToInsert = [];
  let count = 0;
  let skipped = 0;
  
  // Read CSV file
  const parser = createReadStream('./twitter_large.csv').pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
    })
  );
  
  for await (const record of parser) {
    count++;
    
    // Skip if no text
    if (!record.text || record.text.trim() === '') {
      skipped++;
      continue;
    }
    
    // Extract URLs from tweet text
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = record.text.match(urlRegex) || [];
    
    // Create tweet object WITHOUT AI analysis (will be done lazily)
    const tweet = {
      tweetId: record.id || `tweet_${Date.now()}_${count}`,
      text: record.text.substring(0, 500), // Limit text length
      author: record.author || 'Unknown',
      authorUsername: record.author || 'unknown',
      createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
      
      // AI analysis fields - initially NULL (lazy loading)
      sentimentScore: null,
      sentimentLabel: null,
      threatLevel: null,
      credibilityScore: null,
      isPhishing: false,
      aiExplanation: null,
      detectedPatterns: null,
      embedding: null,
      
      // Store URLs for later analysis
      hasUrls: urls.length > 0,
      urlCount: urls.length,
    };
    
    tweetsToInsert.push(tweet);
    
    // Batch insert every 1000 tweets
    if (tweetsToInsert.length >= 1000) {
      try {
        await db.execute(
          `INSERT INTO tweets (tweetId, text, author, authorUsername, createdAt, sentimentScore, sentimentLabel, threatLevel, credibilityScore, isPhishing, aiExplanation, detectedPatterns, embedding) 
           VALUES ${tweetsToInsert.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}`,
          tweetsToInsert.flatMap(t => [
            t.tweetId, t.text, t.author, t.authorUsername, t.createdAt,
            t.sentimentScore, t.sentimentLabel, t.threatLevel, t.credibilityScore,
            t.isPhishing, t.aiExplanation, t.detectedPatterns, t.embedding
          ])
        );
        console.log(`✅ Imported ${count - skipped} tweets (skipped ${skipped})`);
        tweetsToInsert.length = 0; // Clear array
      } catch (error) {
        console.error(`❌ Error inserting batch:`, error.message);
      }
    }
  }
  
  // Insert remaining tweets
  if (tweetsToInsert.length > 0) {
    try {
      await db.execute(
        `INSERT INTO tweets (tweetId, text, author, authorUsername, createdAt, sentimentScore, sentimentLabel, threatLevel, credibilityScore, isPhishing, aiExplanation, detectedPatterns, embedding) 
         VALUES ${tweetsToInsert.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}`,
        tweetsToInsert.flatMap(t => [
          t.tweetId, t.text, t.author, t.authorUsername, t.createdAt,
          t.sentimentScore, t.sentimentLabel, t.threatLevel, t.credibilityScore,
          t.isPhishing, t.aiExplanation, t.detectedPatterns, t.embedding
        ])
      );
      console.log(`✅ Imported final batch`);
    } catch (error) {
      console.error(`❌ Error inserting final batch:`, error.message);
    }
  }
  
  console.log(`\n📊 Import Summary:`);
  console.log(`   Total processed: ${count}`);
  console.log(`   Successfully imported: ${count - skipped}`);
  console.log(`   Skipped (empty): ${skipped}`);
  console.log(`\n✨ Import complete! AI analysis will be done lazily when tweets are viewed.`);
}

importLargeDataset().catch(console.error);
