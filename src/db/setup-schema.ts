import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function setupSchema() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }

  console.log('📦 Creating database schema...');
  const sql = neon(databaseUrl);

  try {
    // Create enums
    console.log('Creating enums...');
    await sql`CREATE TYPE "user_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'SHOP_AGENT', 'WAREHOUSE_AGENT', 'CONFIRMER')`;
    await sql`CREATE TYPE "stock_history_type" AS ENUM('ADD', 'REMOVE', 'ADJUSTMENT')`;
    await sql`CREATE TYPE "order_status" AS ENUM('PENDING', 'CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED')`;
    await sql`CREATE TYPE "payment_status" AS ENUM('UNPAID', 'PAID', 'REFUNDED')`;
    await sql`CREATE TYPE "charge_type" AS ENUM('WATER_BILL', 'ELECTRICITY_BILL', 'RENT', 'LAWYER', 'BROKEN_PARTS', 'MAINTENANCE', 'OTHER')`;
    await sql`CREATE TYPE "ad_platform" AS ENUM('FACEBOOK', 'INSTAGRAM', 'GOOGLE', 'TIKTOK', 'SNAPCHAT', 'OTHER')`;

    // Create users table
    console.log('Creating users table...');
    await sql`
      CREATE TABLE "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "password_hash" text NOT NULL,
        "role" "user_role" DEFAULT 'SHOP_AGENT' NOT NULL,
        "name" varchar(255),
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `;

    // Create products table
    console.log('Creating products table...');
    await sql`
      CREATE TABLE "products" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "sku" varchar(100) NOT NULL UNIQUE,
        "barcode" varchar(100) UNIQUE,
        "selling_price" numeric(10, 2) NOT NULL,
        "cost_price" numeric(10, 2) NOT NULL,
        "description" text,
        "image_url" text,
        "is_active" boolean DEFAULT true,
        "created_by" integer REFERENCES "users"("id"),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `;

    // Create stock table
    console.log('Creating stock table...');
    await sql`
      CREATE TABLE "stock" (
        "id" serial PRIMARY KEY NOT NULL,
        "product_id" integer NOT NULL REFERENCES "products"("id"),
        "quantity" integer DEFAULT 0 NOT NULL,
        "warehouse_location" varchar(100),
        "min_stock_level" integer DEFAULT 10,
        "last_updated" timestamp DEFAULT now()
      )
    `;

    // Create stock_history table
    console.log('Creating stock_history table...');
    await sql`
      CREATE TABLE "stock_history" (
        "id" serial PRIMARY KEY NOT NULL,
        "product_id" integer NOT NULL REFERENCES "products"("id"),
        "quantity_change" integer NOT NULL,
        "type" "stock_history_type" NOT NULL,
        "reason" text,
        "previous_quantity" integer,
        "new_quantity" integer,
        "created_by" integer REFERENCES "users"("id"),
        "created_at" timestamp DEFAULT now()
      )
    `;

    // Create orders table
    console.log('Creating orders table...');
    await sql`
      CREATE TABLE "orders" (
        "id" serial PRIMARY KEY NOT NULL,
        "order_number" varchar(100) NOT NULL UNIQUE,
        "customer_name" varchar(255) NOT NULL,
        "customer_phone" varchar(50) NOT NULL,
        "customer_address" text NOT NULL,
        "customer_city" varchar(100),
        "total_amount" numeric(10, 2) NOT NULL,
        "delivery_price" numeric(10, 2) DEFAULT 0,
        "status" "order_status" DEFAULT 'PENDING',
        "payment_status" "payment_status" DEFAULT 'UNPAID',
        "notes" text,
        "created_by" integer REFERENCES "users"("id"),
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      )
    `;

    // Create order_items table
    console.log('Creating order_items table...');
    await sql`
      CREATE TABLE "order_items" (
        "id" serial PRIMARY KEY NOT NULL,
        "order_id" integer NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "product_id" integer NOT NULL REFERENCES "products"("id"),
        "quantity" integer NOT NULL,
        "unit_price" numeric(10, 2) NOT NULL,
        "subtotal" numeric(10, 2) NOT NULL
      )
    `;

    // Create product_delivery_stats table
    console.log('Creating product_delivery_stats table...');
    await sql`
      CREATE TABLE "product_delivery_stats" (
        "id" serial PRIMARY KEY NOT NULL,
        "product_id" integer NOT NULL UNIQUE REFERENCES "products"("id"),
        "total_orders" integer DEFAULT 0,
        "delivered_orders" integer DEFAULT 0,
        "cancelled_orders" integer DEFAULT 0,
        "returned_orders" integer DEFAULT 0,
        "in_transit_orders" integer DEFAULT 0,
        "updated_at" timestamp DEFAULT now()
      )
    `;

    // Create scanned_orders table
    console.log('Creating scanned_orders table...');
    await sql`
      CREATE TABLE "scanned_orders" (
        "id" serial PRIMARY KEY NOT NULL,
        "order_id" integer NOT NULL REFERENCES "orders"("id"),
        "delivery_company" varchar(255),
        "tracking_number" varchar(255),
        "scanned_by" integer NOT NULL REFERENCES "users"("id"),
        "scanned_at" timestamp DEFAULT now(),
        "notes" text
      )
    `;

    // Create salaries table
    console.log('Creating salaries table...');
    await sql`
      CREATE TABLE "salaries" (
        "id" serial PRIMARY KEY NOT NULL,
        "employee_name" varchar(255) NOT NULL,
        "position" varchar(100),
        "base_amount" numeric(10, 2) NOT NULL,
        "bonus" numeric(10, 2) DEFAULT 0,
        "deductions" numeric(10, 2) DEFAULT 0,
        "total_amount" numeric(10, 2) NOT NULL,
        "month" integer NOT NULL,
        "year" integer NOT NULL,
        "notes" text,
        "paid_at" timestamp,
        "created_by" integer REFERENCES "users"("id"),
        "created_at" timestamp DEFAULT now()
      )
    `;

    // Create charges table
    console.log('Creating charges table...');
    await sql`
      CREATE TABLE "charges" (
        "id" serial PRIMARY KEY NOT NULL,
        "type" "charge_type" NOT NULL,
        "custom_type" varchar(255),
        "amount" numeric(10, 2) NOT NULL,
        "description" text,
        "charge_date" date NOT NULL,
        "created_by" integer REFERENCES "users"("id"),
        "created_at" timestamp DEFAULT now()
      )
    `;

    // Create ads_costs table
    console.log('Creating ads_costs table...');
    await sql`
      CREATE TABLE "ads_costs" (
        "id" serial PRIMARY KEY NOT NULL,
        "campaign_name" varchar(255) NOT NULL,
        "platform" "ad_platform" NOT NULL,
        "cost" numeric(10, 2) NOT NULL,
        "results" integer DEFAULT 0,
        "cost_per_result" numeric(10, 2),
        "campaign_date" date NOT NULL,
        "notes" text,
        "created_by" integer REFERENCES "users"("id"),
        "created_at" timestamp DEFAULT now()
      )
    `;

    console.log('✅ All tables created successfully!');
    console.log('📝 Now run: npm run db:seed');

  } catch (error) {
    console.error('❌ Error creating schema:', error);
    process.exit(1);
  }
}

setupSchema();
