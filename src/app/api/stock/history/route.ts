import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { stockHistory, products, users } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { stockHistoryQuerySchema, validateRequest } from '@/lib/api-validations';
import { handleApiError, badRequest, unauthorized, forbidden } from '@/lib/api-error';

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
    const queryValidation = validateRequest(stockHistoryQuerySchema, {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
      productId: searchParams.get('productId') || undefined,
    });

    if (!queryValidation.success) {
      return badRequest('Invalid query parameters', queryValidation.errors.errors);
    }

    const { page, limit, productId } = queryValidation.data;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = productId ? eq(stockHistory.productId, productId) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(stockHistory)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Get history with joins
    const history = await db
      .select({
        id: stockHistory.id,
        productId: stockHistory.productId,
        quantityChange: stockHistory.quantityChange,
        type: stockHistory.type,
        reason: stockHistory.reason,
        previousQuantity: stockHistory.previousQuantity,
        newQuantity: stockHistory.newQuantity,
        createdAt: stockHistory.createdAt,
        productName: products.name,
        productSku: products.sku,
        createdByName: users.name,
      })
      .from(stockHistory)
      .leftJoin(products, eq(stockHistory.productId, products.id))
      .leftJoin(users, eq(stockHistory.createdBy, users.id))
      .where(whereClause)
      .orderBy(desc(stockHistory.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      history,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
