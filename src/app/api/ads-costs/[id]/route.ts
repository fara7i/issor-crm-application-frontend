import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adsCosts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { updateAdsCostSchema, validateRequest } from '@/lib/api-validations';
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

    if (!hasRole(user.role, ['SUPER_ADMIN', 'ADMIN'])) {
      return forbidden();
    }

    const { id } = await params;
    const adsCostId = parseInt(id, 10);

    if (isNaN(adsCostId)) {
      return badRequest('Invalid ads cost ID');
    }

    // Check if ads cost exists
    const existingAdsCost = await db
      .select()
      .from(adsCosts)
      .where(eq(adsCosts.id, adsCostId))
      .limit(1);

    if (existingAdsCost.length === 0) {
      return notFound('Ads cost not found');
    }

    const body = await request.json();
    const validation = validateRequest(updateAdsCostSchema, body);

    if (!validation.success) {
      return badRequest('Validation error', validation.errors.errors);
    }

    const { campaignName, platform, cost, results, campaignDate, notes } = validation.data;

    // Calculate new cost per result
    const newCost = cost !== undefined ? cost : parseFloat(existingAdsCost[0].cost);
    const newResults = results !== undefined ? results : (existingAdsCost[0].results || 0);
    const costPerResult = newResults > 0 ? newCost / newResults : 0;

    // Update ads cost
    const updateData: Record<string, unknown> = { costPerResult: costPerResult.toFixed(2) };
    if (campaignName !== undefined) updateData.campaignName = campaignName;
    if (platform !== undefined) updateData.platform = platform;
    if (cost !== undefined) updateData.cost = cost.toString();
    if (results !== undefined) updateData.results = results;
    if (campaignDate !== undefined) updateData.campaignDate = campaignDate;
    if (notes !== undefined) updateData.notes = notes || null;

    const updatedAdsCost = await db
      .update(adsCosts)
      .set(updateData)
      .where(eq(adsCosts.id, adsCostId))
      .returning();

    return NextResponse.json({ adsCost: updatedAdsCost[0] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorized();
    }

    if (!hasRole(user.role, ['SUPER_ADMIN', 'ADMIN'])) {
      return forbidden();
    }

    const { id } = await params;
    const adsCostId = parseInt(id, 10);

    if (isNaN(adsCostId)) {
      return badRequest('Invalid ads cost ID');
    }

    // Check if ads cost exists
    const existingAdsCost = await db
      .select({ id: adsCosts.id })
      .from(adsCosts)
      .where(eq(adsCosts.id, adsCostId))
      .limit(1);

    if (existingAdsCost.length === 0) {
      return notFound('Ads cost not found');
    }

    // Delete ads cost
    await db.delete(adsCosts).where(eq(adsCosts.id, adsCostId));

    return NextResponse.json({ success: true, message: 'Ads cost deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
