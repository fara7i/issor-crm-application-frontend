import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testConnection() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    process.exit(1);
  }

  console.log('🔄 Testing database connection...');

  try {
    const sql = neon(databaseUrl);
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;

    console.log('✅ Database connection successful!');
    console.log(`📅 Server time: ${result[0].current_time}`);
    console.log(`🐘 PostgreSQL version: ${result[0].pg_version.split(',')[0]}`);

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
