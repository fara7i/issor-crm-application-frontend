import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, stock, orders, orderItems } from '@/db/schema';
import { eq, sql, desc, gte, and } from 'drizzle-orm';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { handleApiError, unauthorized, forbidden } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorized();
    }

    if (!hasRole(user.role, ['SUPER_ADMIN', 'ADMIN'])) {
      return forbidden();
    }

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total products count
    const totalProductsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.isActive, true));

    // Total stock value
    const stockValueResult = await db
      .select({
        totalValue: sql<number>`coalesce(sum(${stock.quantity} * ${products.costPrice}::numeric), 0)::numeric`,
        totalUnits: sql<number>`coalesce(sum(${stock.quantity}), 0)::int`,
      })
      .from(stock)
      .innerJoin(products, eq(stock.productId, products.id))
      .where(eq(products.isActive, true));

    // Low stock products count
    const lowStockResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(stock)
      .innerJoin(products, eq(stock.productId, products.id))
      .where(sql`${products.isActive} = true AND ${stock.quantity} < ${stock.minStockLevel}`);

    // Out of stock count
    const outOfStockResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(stock)
      .innerJoin(products, eq(stock.productId, products.id))
      .where(sql`${products.isActive} = true AND ${stock.quantity} = 0`);

    // Total orders count
    const totalOrdersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders);

    // Total revenue (from delivered orders)
    const totalRevenueResult = await db
      .select({ total: sql<number>`coalesce(sum(${orders.totalAmount}::numeric), 0)::numeric` })
      .from(orders)
      .where(eq(orders.status, 'DELIVERED'));

    // Today's revenue
    const todayRevenueResult = await db
      .select({ total: sql<number>`coalesce(sum(${orders.totalAmount}::numeric), 0)::numeric` })
      .from(orders)
      .where(and(eq(orders.status, 'DELIVERED'), gte(orders.createdAt, today)));

    // Today's orders count
    const todayOrdersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(gte(orders.createdAt, today));

    // Pending orders count
    const pendingOrdersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.status, 'PENDING'));

    // Orders by status (for pie chart)
    const ordersByStatus = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .groupBy(orders.status);

    // Revenue by month (last 6 months for line chart)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueByMonth = await db
      .select({
        month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
        revenue: sql<number>`coalesce(sum(${orders.totalAmount}::numeric), 0)::numeric`,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(and(eq(orders.status, 'DELIVERED'), gte(orders.createdAt, sixMonthsAgo)))
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`);

    // Top selling products (top 5)
    const topProducts = await db
      .select({
        productId: orderItems.productId,
        productName: products.name,
        productSku: products.sku,
        totalQuantity: sql<number>`sum(${orderItems.quantity})::int`,
        totalRevenue: sql<number>`sum(${orderItems.subtotal}::numeric)::numeric`,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.status, 'DELIVERED'))
      .groupBy(orderItems.productId, products.name, products.sku)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(5);

    // Recent orders (last 10)
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        totalAmount: orders.totalAmount,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(10);

    // Low stock products (for alerts)
    const lowStockProducts = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        quantity: stock.quantity,
        minStockLevel: stock.minStockLevel,
      })
      .from(stock)
      .innerJoin(products, eq(stock.productId, products.id))
      .where(sql`${products.isActive} = true AND ${stock.quantity} < ${stock.minStockLevel}`)
      .orderBy(stock.quantity)
      .limit(10);

    return NextResponse.json({
      stats: {
        totalProducts: totalProductsResult[0]?.count || 0,
        totalStockValue: stockValueResult[0]?.totalValue || 0,
        totalStockUnits: stockValueResult[0]?.totalUnits || 0,
        lowStockCount: lowStockResult[0]?.count || 0,
        outOfStockCount: outOfStockResult[0]?.count || 0,
        totalOrders: totalOrdersResult[0]?.count || 0,
        pendingOrders: pendingOrdersResult[0]?.count || 0,
        totalRevenue: totalRevenueResult[0]?.total || 0,
        todayRevenue: todayRevenueResult[0]?.total || 0,
        todayOrders: todayOrdersResult[0]?.count || 0,
      },
      charts: {
        ordersByStatus,
        revenueByMonth,
        topProducts,
      },
      recentOrders,
      lowStockProducts,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
