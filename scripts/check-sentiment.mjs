#!/usr/bin/env node
import {drizzle} from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(conn);
  const result = await db.execute(`
    SELECT 
      COUNT(*) as total, 
      SUM(CASE WHEN sentimentLabel IS NULL THEN 1 ELSE 0 END) as nullCount 
    FROM tweets
  `);
  console.log(result[0][0]);
  await conn.end();
}

check();
