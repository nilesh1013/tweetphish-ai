import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { tweetUrls } from '../drizzle/schema.ts';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

async function importFromCSV() {
  console.log('Starting CSV import process...');
  
  // Connect to MySQL target database
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const mysqlDb = drizzle(connection);
  
  // Read CSV file
  const csvContent = readFileSync('/home/ubuntu/tweetphish-ai/tweets_dataset.csv', 'utf-8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  
  console.log(`Found ${lines.length - 1} records to import`);
  
  let imported = 0;
  let skipped = 0;
  
  // Process in batches
  const batchSize = 100;
  for (let i = 1; i < lines.length; i += batchSize) {
    const batch = lines.slice(i, Math.min(i + batchSize, lines.length));
    
    for (const line of batch) {
      if (!line.trim()) continue;
      
      try {
        const values = line.split(',');
        const record = {
          id: values[0],
          url: values[1] || '',
          phish_url: values[2] === '1',
          users: values[3] || '',
          tags: values[4] || '',
          which_phish: values[5] || null,
          full_url: values[6] || null,
          query_keyword: values[7] || null,
          user_keyword: values[8] || null,
        };
        
        await mysqlDb.insert(tweetUrls).values({
          tweetId: 0,
          url: record.url,
          expandedUrl: record.full_url,
          isPhishing: record.phish_url,
          phishTankStatus: record.which_phish,
          threatScore: record.phish_url ? 0.8 : 0.1,
          aiThreatAssessment: null,
          detectedThreats: null,
          urlEmbedding: null,
        });
        
        imported++;
      } catch (error) {
        skipped++;
        if (!error.message.includes('Duplicate')) {
          console.error(`Error on line ${i}:`, error.message);
        }
      }
    }
    
    if (i % 1000 === 0) {
      console.log(`Progress: ${i}/${lines.length - 1} processed`);
    }
  }
  
  console.log(`\nImport complete!`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  
  await connection.end();
}

importFromCSV().catch(console.error);
