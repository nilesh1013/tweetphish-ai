import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { tweetUrls } from '../drizzle/schema.ts';
import * as dotenv from 'dotenv';

dotenv.config();

async function importTweets() {
  console.log('Starting tweet import process...');
  
  // Connect to SQLite source database
  const sqliteDb = new Database('/home/ubuntu/tweetphish/tweetphish/db.sqlite3', { readonly: true });
  
  // Connect to MySQL target database
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const mysqlDb = drizzle(connection);
  
  // Fetch all tweets from SQLite
  const tweets = sqliteDb.prepare('SELECT * FROM tweets_tweeturls').all();
  console.log(`Found ${tweets.length} tweets to import`);
  
  let imported = 0;
  let skipped = 0;
  
  // Import in batches
  const batchSize = 100;
  for (let i = 0; i < tweets.length; i += batchSize) {
    const batch = tweets.slice(i, i + batchSize);
    
    for (const tweet of batch) {
      try {
        // Map SQLite fields to MySQL schema
        await mysqlDb.insert(tweetUrls).values({
          tweetId: 0, // We'll create synthetic tweet records later
          url: tweet.url || '',
          expandedUrl: tweet.full_url || null,
          isPhishing: tweet.phish_url === 1,
          phishTankStatus: tweet.which_phish || null,
          threatScore: tweet.phish_url === 1 ? 0.8 : 0.1,
          aiThreatAssessment: null,
          detectedThreats: null,
        }).onDuplicateKeyUpdate({
          set: {
            expandedUrl: tweet.full_url || null,
            isPhishing: tweet.phish_url === 1,
            phishTankStatus: tweet.which_phish || null,
          }
        });
        
        imported++;
      } catch (error) {
        skipped++;
        if (error.code !== 'ER_DUP_ENTRY') {
          console.error(`Error importing tweet ${tweet.id}:`, error.message);
        }
      }
    }
    
    console.log(`Progress: ${Math.min(i + batchSize, tweets.length)}/${tweets.length} processed`);
  }
  
  console.log(`\nImport complete!`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  
  sqliteDb.close();
  await connection.end();
}

importTweets().catch(console.error);
