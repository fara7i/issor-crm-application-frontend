import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { salaries } from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { createSalarySchema, validateRequest, salaryQuerySchema } from '@/lib/api-validations';
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
    const queryValidation = validateRequest(salaryQuerySchema, {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
      month: searchParams.get('month') || undefined,
      year: searchParams.get('year') || undefined,
    });

    if (!queryValidation.success) {
      return badRequest('Invalid query parameters', queryValidation.errors.errors);
    }

    const { page, limit, month, year } = queryValidation.data;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (month) conditions.push(eq(salaries.month, month));
    if (year) conditions.push(eq(salaries.year, year));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(salaries)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    // Get salaries
    const salariesList = await db
      .select()
      .from(salaries)
      .where(whereClause)
      .orderBy(desc(salaries.year), desc(salaries.month), desc(salaries.createdAt))
      .limit(limit)
      .offset(offset);

    // Get summary stats
    const stats = await db
      .select({
        totalPaid: sql<number>`coalesce(sum(case when ${salaries.paidAt} is not null then ${salaries.totalAmount}::numeric else 0 end), 0)::numeric`,
        totalPending: sql<number>`coalesce(sum(case when ${salaries.paidAt} is null then ${salaries.totalAmount}::numeric else 0 end), 0)::numeric`,
        paidCount: sql<number>`count(*) filter (where ${salaries.paidAt} is not null)::int`,
        pendingCount: sql<number>`count(*) filter (where ${salaries.paidAt} is null)::int`,
      })
      .from(salaries)
      .where(whereClause);

    return NextResponse.json({
      salaries: salariesList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: stats[0],
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
    const validation = validateRequest(createSalarySchema, body);

    if (!validation.success) {
      return badRequest('Validation error', validation.errors.errors);
    }

    const { employeeName, position, baseAmount, bonus, deductions, month, year, notes } = validation.data;

    // Calculate total amount
    const totalAmount = baseAmount + (bonus || 0) - (deductions || 0);

    // Create salary record
    const newSalary = await db
      .insert(salaries)
      .values({
        employeeName,
        position: position || null,
        baseAmount: baseAmount.toString(),
        bonus: (bonus || 0).toString(),
        deductions: (deductions || 0).toString(),
        totalAmount: totalAmount.toString(),
        month,
        year,
        notes: notes || null,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ salary: newSalary[0] }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
