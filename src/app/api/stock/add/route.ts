import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { stock, stockHistory, products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { stockAddRemoveSchema, validateRequest } from '@/lib/api-validations';
import { handleApiError, badRequest, unauthorized, forbidden, notFound } from '@/lib/api-error';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorized();
    }

    if (!hasRole(user.role, ['SUPER_ADMIN', 'ADMIN'])) {
      return forbidden();
    }

    const body = await request.json();
    const validation = validateRequest(stockAddRemoveSchema, body);

    if (!validation.success) {
      return badRequest('Validation error', validation.errors.errors);
    }

    const { productId, quantity, reason } = validation.data;

    // Check if product exists
    const product = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (product.length === 0) {
      return notFound('Product not found');
    }

    // Get current stock
    const currentStock = await db
      .select()
      .from(stock)
      .where(eq(stock.productId, productId))
      .limit(1);

    if (currentStock.length === 0) {
      return notFound('Stock record not found');
    }

    const previousQuantity = currentStock[0].quantity;
    const newQuantity = previousQuantity + quantity;

    // Update stock
    await db
      .update(stock)
      .set({
        quantity: newQuantity,
        lastUpdated: new Date(),
      })
      .where(eq(stock.productId, productId));

    // Create stock history record
    await db.insert(stockHistory).values({
      productId,
      quantityChange: quantity,
      type: 'ADD',
      reason: reason || `Added ${quantity} units`,
      previousQuantity,
      newQuantity,
      createdBy: user.id,
    });

    // Return updated stock
    const updatedStock = await db
      .select({
        id: stock.id,
        productId: stock.productId,
        quantity: stock.quantity,
        minStockLevel: stock.minStockLevel,
        warehouseLocation: stock.warehouseLocation,
        lastUpdated: stock.lastUpdated,
        productName: products.name,
        productSku: products.sku,
      })
      .from(stock)
      .innerJoin(products, eq(stock.productId, products.id))
      .where(eq(stock.productId, productId))
      .limit(1);

    return NextResponse.json({
      stock: updatedStock[0],
      message: `Added ${quantity} units to ${product[0].name}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
