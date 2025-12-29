import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, products, stock, stockHistory, productDeliveryStats } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { updateOrderStatusSchema, validateRequest } from '@/lib/api-validations';
import { handleApiError, badRequest, unauthorized, forbidden, notFound } from '@/lib/api-error';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorized();
    }

    if (!hasRole(user.role, ['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_AGENT'])) {
      return forbidden();
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return badRequest('Invalid order ID');
    }

    // Check if order exists
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (existingOrder.length === 0) {
      return notFound('Order not found');
    }

    const body = await request.json();
    const validation = validateRequest(updateOrderStatusSchema, body);

    if (!validation.success) {
      return badRequest('Validation error', validation.errors.errors);
    }

    const { status } = validation.data;
    const previousStatus = existingOrder[0].status;

    // Update order status
    await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    // Get order items for stats updates
    const items = await db
      .select({
        productId: orderItems.productId,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Update product delivery stats based on status change
    for (const item of items) {
      const statsUpdate: Record<string, unknown> = { updatedAt: new Date() };

      // Handle previous status (decrement if it was a tracked status)
      if (previousStatus === 'DELIVERED') {
        statsUpdate.deliveredOrders = sql`${productDeliveryStats.deliveredOrders} - 1`;
      } else if (previousStatus === 'CANCELLED') {
        statsUpdate.cancelledOrders = sql`${productDeliveryStats.cancelledOrders} - 1`;
      } else if (previousStatus === 'RETURNED') {
        statsUpdate.returnedOrders = sql`${productDeliveryStats.returnedOrders} - 1`;
      } else if (previousStatus === 'IN_TRANSIT') {
        statsUpdate.inTransitOrders = sql`${productDeliveryStats.inTransitOrders} - 1`;
      }

      // Handle new status (increment)
      if (status === 'DELIVERED') {
        await db
          .update(productDeliveryStats)
          .set({
            deliveredOrders: sql`${productDeliveryStats.deliveredOrders} + 1`,
            ...statsUpdate,
          })
          .where(eq(productDeliveryStats.productId, item.productId));

        // Update payment status to PAID when delivered
        await db
          .update(orders)
          .set({ paymentStatus: 'PAID' })
          .where(eq(orders.id, orderId));

      } else if (status === 'CANCELLED') {
        await db
          .update(productDeliveryStats)
          .set({
            cancelledOrders: sql`${productDeliveryStats.cancelledOrders} + 1`,
            ...statsUpdate,
          })
          .where(eq(productDeliveryStats.productId, item.productId));

      } else if (status === 'RETURNED') {
        // Add stock back when returned
        const currentStock = await db
          .select({ quantity: stock.quantity })
          .from(stock)
          .where(eq(stock.productId, item.productId))
          .limit(1);

        const previousQuantity = currentStock[0]?.quantity || 0;
        const newQuantity = previousQuantity + item.quantity;

        // Update stock
        await db
          .update(stock)
          .set({ quantity: newQuantity, lastUpdated: new Date() })
          .where(eq(stock.productId, item.productId));

        // Create stock history
        await db.insert(stockHistory).values({
          productId: item.productId,
          quantityChange: item.quantity,
          type: 'ADD',
          reason: `Returned order #${existingOrder[0].orderNumber}`,
          previousQuantity,
          newQuantity,
          createdBy: user.id,
        });

        // Update delivery stats
        await db
          .update(productDeliveryStats)
          .set({
            returnedOrders: sql`${productDeliveryStats.returnedOrders} + 1`,
            ...statsUpdate,
          })
          .where(eq(productDeliveryStats.productId, item.productId));

        // Update payment status to REFUNDED when returned
        await db
          .update(orders)
          .set({ paymentStatus: 'REFUNDED' })
          .where(eq(orders.id, orderId));

      } else if (status === 'IN_TRANSIT') {
        await db
          .update(productDeliveryStats)
          .set({
            inTransitOrders: sql`${productDeliveryStats.inTransitOrders} + 1`,
            ...statsUpdate,
          })
          .where(eq(productDeliveryStats.productId, item.productId));
      }
    }

    // Get updated order with items
    const finalOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    const orderItemsData = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        subtotal: orderItems.subtotal,
        productName: products.name,
        productSku: products.sku,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    return NextResponse.json({
      order: { ...finalOrder[0], items: orderItemsData },
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
