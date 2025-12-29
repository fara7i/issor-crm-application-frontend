import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adsCosts } from '@/db/schema';
import { sql, desc } from 'drizzle-orm';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { createAdsCostSchema, validateRequest, paginationSchema } from '@/lib/api-validations';
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
    const queryValidation = validateRequest(paginationSchema, {
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
    });

    if (!queryValidation.success) {
      return badRequest('Invalid query parameters', queryValidation.errors.errors);
    }

    const { page, limit } = queryValidation.data;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(adsCosts);

    const total = countResult[0]?.count || 0;

    // Get ads costs
    const adsCostsList = await db
      .select()
      .from(adsCosts)
      .orderBy(desc(adsCosts.campaignDate), desc(adsCosts.createdAt))
      .limit(limit)
      .offset(offset);

    // Get summary by platform
    const summaryByPlatform = await db
      .select({
        platform: adsCosts.platform,
        totalCost: sql<number>`coalesce(sum(${adsCosts.cost}::numeric), 0)::numeric`,
        totalResults: sql<number>`coalesce(sum(${adsCosts.results}), 0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(adsCosts)
      .groupBy(adsCosts.platform);

    // Get total stats
    const totalStats = await db
      .select({
        totalCost: sql<number>`coalesce(sum(${adsCosts.cost}::numeric), 0)::numeric`,
        totalResults: sql<number>`coalesce(sum(${adsCosts.results}), 0)::int`,
        avgCostPerResult: sql<number>`case when sum(${adsCosts.results}) > 0 then (sum(${adsCosts.cost}::numeric) / sum(${adsCosts.results}))::numeric else 0 end`,
      })
      .from(adsCosts);

    return NextResponse.json({
      adsCosts: adsCostsList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        byPlatform: summaryByPlatform,
        ...totalStats[0],
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
    const validation = validateRequest(createAdsCostSchema, body);

    if (!validation.success) {
      return badRequest('Validation error', validation.errors.errors);
    }

    const { campaignName, platform, cost, results, campaignDate, notes } = validation.data;

    // Calculate cost per result
    const costPerResult = results && results > 0 ? cost / results : 0;

    // Create ads cost record
    const newAdsCost = await db
      .insert(adsCosts)
      .values({
        campaignName,
        platform,
        cost: cost.toString(),
        results: results || 0,
        costPerResult: costPerResult.toFixed(2),
        campaignDate,
        notes: notes || null,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ adsCost: newAdsCost[0] }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
