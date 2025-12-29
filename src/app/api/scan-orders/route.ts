import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { scannedOrders, orders, users } from '@/db/schema';
import { eq, desc, sql, gte } from 'drizzle-orm';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { createScannedOrderSchema, validateRequest } from '@/lib/api-validations';
import { handleApiError, badRequest, unauthorized, forbidden, notFound, conflict } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorized();
    }

    if (!hasRole(user.role, ['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_AGENT'])) {
      return forbidden();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(scannedOrders);

    const total = countResult[0]?.count || 0;

    // Get scanned orders with joins
    const scannedOrdersList = await db
      .select({
        id: scannedOrders.id,
        orderId: scannedOrders.orderId,
        deliveryCompany: scannedOrders.deliveryCompany,
        trackingNumber: scannedOrders.trackingNumber,
        scannedAt: scannedOrders.scannedAt,
        notes: scannedOrders.notes,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        orderStatus: orders.status,
        totalAmount: orders.totalAmount,
        scannedByName: users.name,
      })
      .from(scannedOrders)
      .leftJoin(orders, eq(scannedOrders.orderId, orders.id))
      .leftJoin(users, eq(scannedOrders.scannedBy, users.id))
      .orderBy(desc(scannedOrders.scannedAt))
      .limit(limit)
      .offset(offset);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(scannedOrders)
      .where(gte(scannedOrders.scannedAt, today));

    return NextResponse.json({
      scannedOrders: scannedOrdersList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      todayScans: todayStats[0]?.count || 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorized();
    }

    if (!hasRole(user.role, ['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_AGENT'])) {
      return forbidden();
    }

    const body = await request.json();
    const validation = validateRequest(createScannedOrderSchema, body);

    if (!validation.success) {
      return badRequest('Validation error', validation.errors.errors);
    }

    const { orderId, deliveryCompany, trackingNumber, notes } = validation.data;

    // Check if order exists
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      return notFound('Order not found');
    }

    // Check if order is already scanned
    const existingScan = await db
      .select({ id: scannedOrders.id })
      .from(scannedOrders)
      .where(eq(scannedOrders.orderId, orderId))
      .limit(1);

    if (existingScan.length > 0) {
      return conflict('Order has already been scanned');
    }

    // Create scanned order record
    const newScannedOrder = await db
      .insert(scannedOrders)
      .values({
        orderId,
        deliveryCompany: deliveryCompany || null,
        trackingNumber: trackingNumber || null,
        scannedBy: user.id,
        notes: notes || null,
      })
      .returning();

    // Update order status to PICKED_UP
    await db
      .update(orders)
      .set({ status: 'PICKED_UP', updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    // Get the scanned order with joins
    const scannedOrderWithDetails = await db
      .select({
        id: scannedOrders.id,
        orderId: scannedOrders.orderId,
        deliveryCompany: scannedOrders.deliveryCompany,
        trackingNumber: scannedOrders.trackingNumber,
        scannedAt: scannedOrders.scannedAt,
        notes: scannedOrders.notes,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        orderStatus: orders.status,
        totalAmount: orders.totalAmount,
        scannedByName: users.name,
      })
      .from(scannedOrders)
      .leftJoin(orders, eq(scannedOrders.orderId, orders.id))
      .leftJoin(users, eq(scannedOrders.scannedBy, users.id))
      .where(eq(scannedOrders.id, newScannedOrder[0].id))
      .limit(1);

    return NextResponse.json(
      {
        scannedOrder: scannedOrderWithDetails[0],
        message: 'Order scanned and marked as PICKED_UP',
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
