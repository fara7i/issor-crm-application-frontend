import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function resetDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }

  console.log('🗑️  Dropping all existing tables...');

  try {
    const sql = neon(databaseUrl);

    // Drop all tables in correct order (respecting foreign keys)
    await sql`DROP TABLE IF EXISTS scanned_orders CASCADE`;
    await sql`DROP TABLE IF EXISTS product_delivery_stats CASCADE`;
    await sql`DROP TABLE IF EXISTS order_items CASCADE`;
    await sql`DROP TABLE IF EXISTS orders CASCADE`;
    await sql`DROP TABLE IF EXISTS stock_history CASCADE`;
    await sql`DROP TABLE IF EXISTS stock CASCADE`;
    await sql`DROP TABLE IF EXISTS products CASCADE`;
    await sql`DROP TABLE IF EXISTS salaries CASCADE`;
    await sql`DROP TABLE IF EXISTS charges CASCADE`;
    await sql`DROP TABLE IF EXISTS ads_costs CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    // Drop old tables from previous schema
    await sql`DROP TABLE IF EXISTS admin CASCADE`;
    await sql`DROP TABLE IF EXISTS "adsCost" CASCADE`;
    await sql`DROP TABLE IF EXISTS "order" CASCADE`;
    await sql`DROP TABLE IF EXISTS product CASCADE`;
    await sql`DROP TABLE IF EXISTS salary CASCADE`;

    // Drop enums
    await sql`DROP TYPE IF EXISTS user_role CASCADE`;
    await sql`DROP TYPE IF EXISTS stock_history_type CASCADE`;
    await sql`DROP TYPE IF EXISTS order_status CASCADE`;
    await sql`DROP TYPE IF EXISTS payment_status CASCADE`;
    await sql`DROP TYPE IF EXISTS charge_type CASCADE`;
    await sql`DROP TYPE IF EXISTS ad_platform CASCADE`;

    console.log('✅ All tables dropped successfully!');
    console.log('📝 Now run: npm run db:push');

  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    process.exit(1);
  }
}

resetDatabase();
