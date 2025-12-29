import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { charges } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { updateChargeSchema, validateRequest } from '@/lib/api-validations';
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
    const chargeId = parseInt(id, 10);

    if (isNaN(chargeId)) {
      return badRequest('Invalid charge ID');
    }

    // Check if charge exists
    const existingCharge = await db
      .select()
      .from(charges)
      .where(eq(charges.id, chargeId))
      .limit(1);

    if (existingCharge.length === 0) {
      return notFound('Charge not found');
    }

    const body = await request.json();
    const validation = validateRequest(updateChargeSchema, body);

    if (!validation.success) {
      return badRequest('Validation error', validation.errors.errors);
    }

    const { type, customType, amount, description, chargeDate } = validation.data;

    // Update charge
    const updateData: Record<string, unknown> = {};
    if (type !== undefined) updateData.type = type;
    if (customType !== undefined) updateData.customType = customType || null;
    if (amount !== undefined) updateData.amount = amount.toString();
    if (description !== undefined) updateData.description = description || null;
    if (chargeDate !== undefined) updateData.chargeDate = chargeDate;

    const updatedCharge = await db
      .update(charges)
      .set(updateData)
      .where(eq(charges.id, chargeId))
      .returning();

    return NextResponse.json({ charge: updatedCharge[0] });
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
    const chargeId = parseInt(id, 10);

    if (isNaN(chargeId)) {
      return badRequest('Invalid charge ID');
    }

    // Check if charge exists
    const existingCharge = await db
      .select({ id: charges.id })
      .from(charges)
      .where(eq(charges.id, chargeId))
      .limit(1);

    if (existingCharge.length === 0) {
      return notFound('Charge not found');
    }

    // Delete charge
    await db.delete(charges).where(eq(charges.id, chargeId));

    return NextResponse.json({ success: true, message: 'Charge deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
