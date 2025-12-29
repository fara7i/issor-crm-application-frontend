import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products, stock, productDeliveryStats } from '@/db/schema';
import { eq, like, or, sql, desc, asc } from 'drizzle-orm';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { createProductSchema, validateRequest, productQuerySchema } from '@/lib/api-validations';
import { handleApiError, badRequest, unauthorized, forbidden, conflict } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorized();
    }

    if (!hasRole(user.role, ['SUPER_ADMIN', 'ADMIN', 'SHOP_AGENT'])) {
      return forbidden();
    }

    const { searchParams } = new URL(request.url);
    const queryValidation = validateRequest(productQuerySchema, {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
      search: searchParams.get('search') || undefined,
      sort: searchParams.get('sort') || undefined,
      order: searchParams.get('order') || undefined,
    });

    if (!queryValidation.success) {
      return badRequest('Invalid query parameters', queryValidation.errors.errors);
    }

    const { page, limit, search, sort, order } = queryValidation.data;
    const offset = (page - 1) * limit;

    // Build where clause
    let whereClause;
    if (search) {
      whereClause = or(
        like(products.name, `%${search}%`),
        like(products.sku, `%${search}%`),
        like(products.barcode, `%${search}%`)
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClause ? sql`${whereClause} AND ${products.isActive} = true` : eq(products.isActive, true));

    const total = countResult[0]?.count || 0;

    // Get products with stock
    let orderByClause;
    const orderDirection = order === 'desc' ? desc : asc;

    switch (sort) {
      case 'name':
        orderByClause = orderDirection(products.name);
        break;
      case 'sku':
        orderByClause = orderDirection(products.sku);
        break;
      case 'sellingPrice':
        orderByClause = orderDirection(products.sellingPrice);
        break;
      case 'createdAt':
        orderByClause = orderDirection(products.createdAt);
        break;
      default:
        orderByClause = desc(products.createdAt);
    }

    const productsList = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        barcode: products.barcode,
        sellingPrice: products.sellingPrice,
        costPrice: products.costPrice,
        description: products.description,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        stockQuantity: stock.quantity,
        minStockLevel: stock.minStockLevel,
        warehouseLocation: stock.warehouseLocation,
      })
      .from(products)
      .leftJoin(stock, eq(products.id, stock.productId))
      .where(whereClause ? sql`${whereClause} AND ${products.isActive} = true` : eq(products.isActive, true))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      products: productsList,
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

    if (!hasRole(user.role, ['SUPER_ADMIN', 'ADMIN'])) {
      return forbidden();
    }

    const body = await request.json();
    const validation = validateRequest(createProductSchema, body);

    if (!validation.success) {
      return badRequest('Validation error', validation.errors.errors);
    }

    const { name, sku, barcode, sellingPrice, costPrice, description, imageUrl } = validation.data;

    // Check for duplicate SKU
    const existingSku = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.sku, sku))
      .limit(1);

    if (existingSku.length > 0) {
      return conflict('A product with this SKU already exists');
    }

    // Check for duplicate barcode if provided
    if (barcode) {
      const existingBarcode = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.barcode, barcode))
        .limit(1);

      if (existingBarcode.length > 0) {
        return conflict('A product with this barcode already exists');
      }
    }

    // Insert product
    const newProduct = await db
      .insert(products)
      .values({
        name,
        sku,
        barcode: barcode || null,
        sellingPrice: sellingPrice.toString(),
        costPrice: costPrice.toString(),
        description: description || null,
        imageUrl: imageUrl || null,
        createdBy: user.id,
      })
      .returning();

    const product = newProduct[0];

    // Create initial stock record
    await db.insert(stock).values({
      productId: product.id,
      quantity: 0,
      minStockLevel: 10,
    });

    // Create product delivery stats record
    await db.insert(productDeliveryStats).values({
      productId: product.id,
      totalOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      returnedOrders: 0,
      inTransitOrders: 0,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
