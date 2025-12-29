import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as schema from './schema';
import { users, products, stock, productDeliveryStats } from './schema';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  console.log('🌱 Starting database seed...\n');

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  try {
    // Seed Users
    console.log('👤 Seeding users...');
    const usersData = [
      {
        email: 'superadmin@magazine.ma',
        passwordHash: await hashPassword('Admin123!'),
        role: 'SUPER_ADMIN' as const,
        name: 'Super Admin',
        isActive: true,
      },
      {
        email: 'admin@magazine.ma',
        passwordHash: await hashPassword('Admin123!'),
        role: 'ADMIN' as const,
        name: 'Admin User',
        isActive: true,
      },
      {
        email: 'shop@magazine.ma',
        passwordHash: await hashPassword('Shop123!'),
        role: 'SHOP_AGENT' as const,
        name: 'Shop Agent',
        isActive: true,
      },
      {
        email: 'warehouse@magazine.ma',
        passwordHash: await hashPassword('Warehouse123!'),
        role: 'WAREHOUSE_AGENT' as const,
        name: 'Warehouse Agent',
        isActive: true,
      },
      {
        email: 'confirmer@magazine.ma',
        passwordHash: await hashPassword('Confirm123!'),
        role: 'CONFIRMER' as const,
        name: 'Confirmer Agent',
        isActive: true,
      },
    ];

    const insertedUsers = await db
      .insert(users)
      .values(usersData)
      .onConflictDoNothing()
      .returning();

    console.log(`   ✅ Inserted ${insertedUsers.length} users`);

    // Get the super admin user ID for created_by references
    const superAdminId = insertedUsers.find(u => u.email === 'superadmin@magazine.ma')?.id || 1;

    // Seed Products
    console.log('📦 Seeding products...');
    const productsData = [
      {
        name: 'Wireless Bluetooth Headphones',
        sku: 'ELEC-001',
        barcode: '1234567890123',
        sellingPrice: '299.99',
        costPrice: '150.00',
        description: 'High-quality wireless headphones with noise cancellation',
        imageUrl: '',
        isActive: true,
        createdBy: superAdminId,
      },
      {
        name: 'Smart Watch Pro',
        sku: 'ELEC-002',
        barcode: '1234567890124',
        sellingPrice: '499.99',
        costPrice: '250.00',
        description: 'Advanced smartwatch with health monitoring features',
        imageUrl: '',
        isActive: true,
        createdBy: superAdminId,
      },
      {
        name: 'Laptop Stand Adjustable',
        sku: 'ACCS-001',
        barcode: '1234567890125',
        sellingPrice: '79.99',
        costPrice: '35.00',
        description: 'Ergonomic adjustable laptop stand for better posture',
        imageUrl: '',
        isActive: true,
        createdBy: superAdminId,
      },
      {
        name: 'USB-C Hub 7-in-1',
        sku: 'ACCS-002',
        barcode: '1234567890126',
        sellingPrice: '59.99',
        costPrice: '25.00',
        description: 'Multi-port USB-C hub with HDMI, USB-A, and SD card reader',
        imageUrl: '',
        isActive: true,
        createdBy: superAdminId,
      },
      {
        name: 'Mechanical Keyboard RGB',
        sku: 'ELEC-003',
        barcode: '1234567890127',
        sellingPrice: '149.99',
        costPrice: '70.00',
        description: 'Gaming mechanical keyboard with RGB backlighting',
        imageUrl: '',
        isActive: true,
        createdBy: superAdminId,
      },
      {
        name: 'Wireless Mouse Ergonomic',
        sku: 'ELEC-004',
        barcode: '1234567890128',
        sellingPrice: '49.99',
        costPrice: '20.00',
        description: 'Ergonomic wireless mouse with adjustable DPI',
        imageUrl: '',
        isActive: true,
        createdBy: superAdminId,
      },
      {
        name: 'Phone Case Premium',
        sku: 'ACCS-003',
        barcode: '1234567890129',
        sellingPrice: '29.99',
        costPrice: '8.00',
        description: 'Premium protective phone case with MagSafe support',
        imageUrl: '',
        isActive: true,
        createdBy: superAdminId,
      },
      {
        name: 'Webcam HD 1080p',
        sku: 'ELEC-005',
        barcode: '1234567890130',
        sellingPrice: '89.99',
        costPrice: '40.00',
        description: 'HD webcam with built-in microphone for video calls',
        imageUrl: '',
        isActive: true,
        createdBy: superAdminId,
      },
      {
        name: 'Desk Organizer Set',
        sku: 'HOME-001',
        barcode: '1234567890131',
        sellingPrice: '39.99',
        costPrice: '15.00',
        description: 'Complete desk organizer set for office supplies',
        imageUrl: '',
        isActive: true,
        createdBy: superAdminId,
      },
      {
        name: 'LED Desk Lamp',
        sku: 'HOME-002',
        barcode: '1234567890132',
        sellingPrice: '69.99',
        costPrice: '30.00',
        description: 'Adjustable LED desk lamp with multiple brightness levels',
        imageUrl: '',
        isActive: true,
        createdBy: superAdminId,
      },
    ];

    const insertedProducts = await db
      .insert(products)
      .values(productsData)
      .onConflictDoNothing()
      .returning();

    console.log(`   ✅ Inserted ${insertedProducts.length} products`);

    // Seed Stock for each product
    console.log('📊 Seeding stock...');
    const stockData = insertedProducts.map((product, index) => ({
      productId: product.id,
      quantity: [50, 30, 100, 75, 25, 80, 200, 45, 150, 60][index] || 50,
      warehouseLocation: `A-${Math.floor(index / 5) + 1}-${(index % 5) + 1}`,
      minStockLevel: 10,
    }));

    const insertedStock = await db
      .insert(stock)
      .values(stockData)
      .onConflictDoNothing()
      .returning();

    console.log(`   ✅ Inserted ${insertedStock.length} stock records`);

    // Seed Product Delivery Stats
    console.log('📈 Seeding product delivery stats...');
    const statsData = insertedProducts.map(product => ({
      productId: product.id,
      totalOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      returnedOrders: 0,
      inTransitOrders: 0,
    }));

    const insertedStats = await db
      .insert(productDeliveryStats)
      .values(statsData)
      .onConflictDoNothing()
      .returning();

    console.log(`   ✅ Inserted ${insertedStats.length} delivery stats records`);

    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('📝 Default Login Credentials:');
    console.log('   Super Admin: superadmin@magazine.ma / Admin123!');
    console.log('   Admin: admin@magazine.ma / Admin123!');
    console.log('   Shop Agent: shop@magazine.ma / Shop123!');
    console.log('   Warehouse Agent: warehouse@magazine.ma / Warehouse123!');
    console.log('   Confirmer: confirmer@magazine.ma / Confirm123!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log('\n🎉 Seed script finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seed script failed:', error);
    process.exit(1);
  });
