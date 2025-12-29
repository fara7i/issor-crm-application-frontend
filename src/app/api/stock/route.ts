import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, stock } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
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

    const { searchParams } = new URL(request.url);
    const lowStockOnly = searchParams.get('lowStock') === 'true';

    let query = db
      .select({
        id: stock.id,
        productId: stock.productId,
        quantity: stock.quantity,
        minStockLevel: stock.minStockLevel,
        warehouseLocation: stock.warehouseLocation,
        lastUpdated: stock.lastUpdated,
        productName: products.name,
        productSku: products.sku,
        productBarcode: products.barcode,
        sellingPrice: products.sellingPrice,
        costPrice: products.costPrice,
      })
      .from(stock)
      .innerJoin(products, eq(stock.productId, products.id))
      .where(eq(products.isActive, true));

    if (lowStockOnly) {
      query = db
        .select({
          id: stock.id,
          productId: stock.productId,
          quantity: stock.quantity,
          minStockLevel: stock.minStockLevel,
          warehouseLocation: stock.warehouseLocation,
          lastUpdated: stock.lastUpdated,
          productName: products.name,
          productSku: products.sku,
          productBarcode: products.barcode,
          sellingPrice: products.sellingPrice,
          costPrice: products.costPrice,
        })
        .from(stock)
        .innerJoin(products, eq(stock.productId, products.id))
        .where(sql`${products.isActive} = true AND ${stock.quantity} < ${stock.minStockLevel}`);
    }

    const stockList = await query;

    // Calculate summary stats
    const stats = await db
      .select({
        totalProducts: sql<number>`count(*)::int`,
        totalUnits: sql<number>`coalesce(sum(${stock.quantity}), 0)::int`,
        lowStockCount: sql<number>`count(*) filter (where ${stock.quantity} < ${stock.minStockLevel})::int`,
        outOfStockCount: sql<number>`count(*) filter (where ${stock.quantity} = 0)::int`,
        totalValue: sql<number>`coalesce(sum(${stock.quantity} * ${products.costPrice}::numeric), 0)::numeric`,
      })
      .from(stock)
      .innerJoin(products, eq(stock.productId, products.id))
      .where(eq(products.isActive, true));

    return NextResponse.json({
      stock: stockList,
      stats: stats[0],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
