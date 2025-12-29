import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, products, stock, stockHistory, productDeliveryStats } from '@/db/schema';
import { eq, like, or, sql, desc, and, gte, lte } from 'drizzle-orm';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { createOrderSchema, validateRequest, orderQuerySchema } from '@/lib/api-validations';
import { handleApiError, badRequest, unauthorized, forbidden, notFound } from '@/lib/api-error';

// Generate unique order number
async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  // Get count of orders today
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(and(gte(orders.createdAt, startOfDay), lte(orders.createdAt, endOfDay)));

  const count = (countResult[0]?.count || 0) + 1;
  return `ORD-${dateStr}-${count.toString().padStart(4, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorized();
    }

    if (!hasRole(user.role, ['SUPER_ADMIN', 'ADMIN', 'SHOP_AGENT', 'WAREHOUSE_AGENT'])) {
      return forbidden();
    }

    const { searchParams } = new URL(request.url);
    const queryValidation = validateRequest(orderQuerySchema, {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      paymentStatus: searchParams.get('paymentStatus') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
    });

    if (!queryValidation.success) {
      return badRequest('Invalid query parameters', queryValidation.errors.errors);
    }

    const { page, limit, search, status, paymentStatus, fromDate, toDate } = queryValidation.data;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    // Shop agents can only see their own orders
    if (user.role === 'SHOP_AGENT') {
      conditions.push(eq(orders.createdBy, user.id));
    }

    if (search) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${search}%`),
          like(orders.customerName, `%${search}%`),
          like(orders.customerPhone, `%${search}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(orders.status, status));
    }

    if (paymentStatus) {
      conditions.push(eq(orders.paymentStatus, paymentStatus));
    }

    if (fromDate) {
      conditions.push(gte(orders.createdAt, new Date(fromDate)));
    }

    if (toDate) {
      conditions.push(lte(orders.createdAt, new Date(toDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Get orders
    const ordersList = await db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      ordersList.map(async (order) => {
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
          .where(eq(orderItems.orderId, order.id));

        return { ...order, items };
      })
    );

    return NextResponse.json({
      orders: ordersWithItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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

    if (!hasRole(user.role, ['SUPER_ADMIN', 'ADMIN', 'SHOP_AGENT'])) {
      return forbidden();
    }

    const body = await request.json();
    const validation = validateRequest(createOrderSchema, body);

    if (!validation.success) {
      return badRequest('Validation error', validation.errors.errors);
    }

    const { customerName, customerPhone, customerAddress, customerCity, deliveryPrice, items, notes } = validation.data;

    // Validate all products exist and have enough stock
    const productIds = items.map(item => item.productId);
    const productsData = await db
      .select({
        id: products.id,
        name: products.name,
        sellingPrice: products.sellingPrice,
        stockQuantity: stock.quantity,
      })
      .from(products)
      .leftJoin(stock, eq(products.id, stock.productId))
      .where(sql`${products.id} IN ${productIds}`);

    // Check for missing products
    const foundProductIds = productsData.map(p => p.id);
    const missingProducts = productIds.filter(id => !foundProductIds.includes(id));
    if (missingProducts.length > 0) {
      return notFound(`Products not found: ${missingProducts.join(', ')}`);
    }

    // Check stock availability
    for (const item of items) {
      const product = productsData.find(p => p.id === item.productId);
      if (product && (product.stockQuantity || 0) < item.quantity) {
        return badRequest(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity || 0}, Requested: ${item.quantity}`);
      }
    }

    // Calculate totals
    let subtotal = 0;
    const orderItemsData = items.map(item => {
      const product = productsData.find(p => p.id === item.productId)!;
      const unitPrice = parseFloat(product.sellingPrice);
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: unitPrice.toString(),
        subtotal: itemSubtotal.toString(),
      };
    });

    const totalAmount = subtotal + (deliveryPrice || 0);
    const orderNumber = await generateOrderNumber();

    // Create order
    const newOrder = await db
      .insert(orders)
      .values({
        orderNumber,
        customerName,
        customerPhone,
        customerAddress,
        customerCity: customerCity || null,
        totalAmount: totalAmount.toString(),
        deliveryPrice: (deliveryPrice || 0).toString(),
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        notes: notes || null,
        createdBy: user.id,
      })
      .returning();

    const order = newOrder[0];

    // Create order items
    await db.insert(orderItems).values(
      orderItemsData.map(item => ({
        orderId: order.id,
        ...item,
      }))
    );

    // Decrease stock and create history for each item
    for (const item of items) {
      const currentStock = await db
        .select({ quantity: stock.quantity })
        .from(stock)
        .where(eq(stock.productId, item.productId))
        .limit(1);

      const previousQuantity = currentStock[0]?.quantity || 0;
      const newQuantity = previousQuantity - item.quantity;

      // Update stock
      await db
        .update(stock)
        .set({ quantity: newQuantity, lastUpdated: new Date() })
        .where(eq(stock.productId, item.productId));

      // Create stock history
      await db.insert(stockHistory).values({
        productId: item.productId,
        quantityChange: -item.quantity,
        type: 'REMOVE',
        reason: `Order #${orderNumber}`,
        previousQuantity,
        newQuantity,
        createdBy: user.id,
      });

      // Increment product delivery stats
      await db
        .update(productDeliveryStats)
        .set({
          totalOrders: sql`${productDeliveryStats.totalOrders} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(productDeliveryStats.productId, item.productId));
    }

    // Return order with items
    const createdItems = await db
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
      .where(eq(orderItems.orderId, order.id));

    return NextResponse.json(
      { order: { ...order, items: createdItems } },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
