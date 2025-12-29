import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { charges } from '@/db/schema';
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { createChargeSchema, validateRequest, chargeQuerySchema } from '@/lib/api-validations';
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
    const queryValidation = validateRequest(chargeQuerySchema, {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
      type: searchParams.get('type') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
    });

    if (!queryValidation.success) {
      return badRequest('Invalid query parameters', queryValidation.errors.errors);
    }

    const { page, limit, type, fromDate, toDate } = queryValidation.data;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (type) conditions.push(eq(charges.type, type));
    if (fromDate) conditions.push(gte(charges.chargeDate, fromDate));
    if (toDate) conditions.push(lte(charges.chargeDate, toDate));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(charges)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Get charges
    const chargesList = await db
      .select()
      .from(charges)
      .where(whereClause)
      .orderBy(desc(charges.chargeDate), desc(charges.createdAt))
      .limit(limit)
      .offset(offset);

    // Get summary by type
    const summaryByType = await db
      .select({
        type: charges.type,
        total: sql<number>`coalesce(sum(${charges.amount}::numeric), 0)::numeric`,
        count: sql<number>`count(*)::int`,
      })
      .from(charges)
      .where(whereClause)
      .groupBy(charges.type);

    // Get total amount
    const totalAmount = await db
      .select({ total: sql<number>`coalesce(sum(${charges.amount}::numeric), 0)::numeric` })
      .from(charges)
      .where(whereClause);

    return NextResponse.json({
      charges: chargesList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        byType: summaryByType,
        totalAmount: totalAmount[0]?.total || 0,
      },
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
    const validation = validateRequest(createChargeSchema, body);

    if (!validation.success) {
      return badRequest('Validation error', validation.errors.errors);
    }

    const { type, customType, amount, description, chargeDate } = validation.data;

    // Create charge record
    const newCharge = await db
      .insert(charges)
      .values({
        type,
        customType: type === 'OTHER' ? customType : null,
        amount: amount.toString(),
        description: description || null,
        chargeDate,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ charge: newCharge[0] }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
