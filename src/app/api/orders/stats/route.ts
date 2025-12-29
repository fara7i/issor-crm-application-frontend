import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, sql, gte, and } from 'drizzle-orm';
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

    // Total orders count
    const totalOrdersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders);

    // Pending orders count
    const pendingOrdersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.status, 'PENDING'));

    // Delivered orders count
    const deliveredOrdersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.status, 'DELIVERED'));

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

    return NextResponse.json({
      stats: {
        totalOrders: totalOrdersResult[0]?.count || 0,
        pendingOrders: pendingOrdersResult[0]?.count || 0,
        deliveredOrders: deliveredOrdersResult[0]?.count || 0,
        totalRevenue: totalRevenueResult[0]?.total || 0,
        todayRevenue: todayRevenueResult[0]?.total || 0,
        todayOrders: todayOrdersResult[0]?.count || 0,
        ordersByStatus,
        revenueByMonth,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
