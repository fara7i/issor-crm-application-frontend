import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { updateOrderSchema, validateRequest } from '@/lib/api-validations';
import { handleApiError, badRequest, unauthorized, forbidden, notFound } from '@/lib/api-error';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorized();
    }

    if (!hasRole(user.role, ['SUPER_ADMIN', 'ADMIN', 'SHOP_AGENT', 'WAREHOUSE_AGENT'])) {
      return forbidden();
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return badRequest('Invalid order ID');
    }

    // Get order
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (order.length === 0) {
      return notFound('Order not found');
    }

    // Shop agents can only see their own orders
    if (user.role === 'SHOP_AGENT' && order[0].createdBy !== user.id) {
      return forbidden('You can only view your own orders');
    }

    // Get order items
    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        subtotal: orderItems.subtotal,
        productName: products.name,
        productSku: products.sku,
        productBarcode: products.barcode,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    return NextResponse.json({
      order: { ...order[0], items },
    });
  } catch (error) {
    return handleApiError(error);
  }
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
    const validation = validateRequest(updateOrderSchema, body);

    if (!validation.success) {
      return badRequest('Validation error', validation.errors.errors);
    }

    const { status, paymentStatus, notes } = validation.data;

    // Warehouse agents can only update status
    if (user.role === 'WAREHOUSE_AGENT' && (paymentStatus || notes)) {
      return forbidden('Warehouse agents can only update order status');
    }

    // Update order
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (notes !== undefined) updateData.notes = notes;

    const updatedOrder = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    // Get order items
    const items = await db
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
      order: { ...updatedOrder[0], items },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
