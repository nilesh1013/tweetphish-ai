#!/usr/bin/env node
/**
 * Import large tweet dataset WITHOUT AI analysis
 * AI analysis will be done lazily when tweets are viewed
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { tweets } from '../drizzle/schema.ts';
import dotenv from 'dotenv';

dotenv.config();

async function importLargeDataset() {
  console.log('📥 Starting large dataset import...\n');
  
  // Create connection
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);
  
  const tweetsToInsert = [];
  let count = 0;
  let skipped = 0;
  let imported = 0;
  
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
    };
    
    tweetsToInsert.push(tweet);
    
    // Batch insert every 500 tweets
    if (tweetsToInsert.length >= 500) {
      try {
        await db.insert(tweets).values(tweetsToInsert);
        imported += tweetsToInsert.length;
        console.log(`✅ Imported ${imported} tweets (total processed: ${count}, skipped: ${skipped})`);
        tweetsToInsert.length = 0; // Clear array
      } catch (error) {
        console.error(`❌ Error inserting batch:`, error.message);
        // Continue with next batch
        tweetsToInsert.length = 0;
      }
    }
  }
  
  // Insert remaining tweets
  if (tweetsToInsert.length > 0) {
    try {
      await db.insert(tweets).values(tweetsToInsert);
      imported += tweetsToInsert.length;
      console.log(`✅ Imported final batch`);
    } catch (error) {
      console.error(`❌ Error inserting final batch:`, error.message);
    }
  }
  
  await connection.end();
  
  console.log(`\n📊 Import Summary:`);
  console.log(`   Total processed: ${count}`);
  console.log(`   Successfully imported: ${imported}`);
  console.log(`   Skipped (empty): ${skipped}`);
  console.log(`\n✨ Import complete! AI analysis will be done lazily when tweets are viewed.`);
}

importLargeDataset().catch(console.error);
