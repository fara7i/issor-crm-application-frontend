import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { salaries } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { updateSalarySchema, validateRequest } from '@/lib/api-validations';
import { handleApiError, badRequest, unauthorized, forbidden, notFound } from '@/lib/api-error';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorized();
    }

    if (!hasRole(user.role, ['SUPER_ADMIN', 'ADMIN'])) {
      return forbidden();
    }

    const { id } = await params;
    const salaryId = parseInt(id, 10);

    if (isNaN(salaryId)) {
      return badRequest('Invalid salary ID');
    }

    const salary = await db
      .select()
      .from(salaries)
      .where(eq(salaries.id, salaryId))
      .limit(1);

    if (salary.length === 0) {
      return notFound('Salary record not found');
    }

    return NextResponse.json({ salary: salary[0] });
  } catch (error) {
    return handleApiError(error);
  }
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
    const salaryId = parseInt(id, 10);

    if (isNaN(salaryId)) {
      return badRequest('Invalid salary ID');
    }

    // Check if salary exists
    const existingSalary = await db
      .select()
      .from(salaries)
      .where(eq(salaries.id, salaryId))
      .limit(1);

    if (existingSalary.length === 0) {
      return notFound('Salary record not found');
    }

    const body = await request.json();
    const validation = validateRequest(updateSalarySchema, body);

    if (!validation.success) {
      return badRequest('Validation error', validation.errors.errors);
    }

    const { employeeName, position, baseAmount, bonus, deductions, month, year, notes, paidAt } = validation.data;

    // Calculate total amount if base/bonus/deductions changed
    const newBase = baseAmount !== undefined ? baseAmount : parseFloat(existingSalary[0].baseAmount);
    const newBonus = bonus !== undefined ? bonus : parseFloat(existingSalary[0].bonus || '0');
    const newDeductions = deductions !== undefined ? deductions : parseFloat(existingSalary[0].deductions || '0');
    const totalAmount = newBase + newBonus - newDeductions;

    // Update salary
    const updateData: Record<string, unknown> = {};
    if (employeeName !== undefined) updateData.employeeName = employeeName;
    if (position !== undefined) updateData.position = position || null;
    if (baseAmount !== undefined) updateData.baseAmount = baseAmount.toString();
    if (bonus !== undefined) updateData.bonus = bonus.toString();
    if (deductions !== undefined) updateData.deductions = deductions.toString();
    if (month !== undefined) updateData.month = month;
    if (year !== undefined) updateData.year = year;
    if (notes !== undefined) updateData.notes = notes || null;
    if (paidAt !== undefined) updateData.paidAt = paidAt ? new Date(paidAt) : null;
    updateData.totalAmount = totalAmount.toString();

    const updatedSalary = await db
      .update(salaries)
      .set(updateData)
      .where(eq(salaries.id, salaryId))
      .returning();

    return NextResponse.json({ salary: updatedSalary[0] });
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
    const salaryId = parseInt(id, 10);

    if (isNaN(salaryId)) {
      return badRequest('Invalid salary ID');
    }

    // Check if salary exists
    const existingSalary = await db
      .select({ id: salaries.id })
      .from(salaries)
      .where(eq(salaries.id, salaryId))
      .limit(1);

    if (existingSalary.length === 0) {
      return notFound('Salary record not found');
    }

    // Delete salary
    await db.delete(salaries).where(eq(salaries.id, salaryId));

    return NextResponse.json({ success: true, message: 'Salary record deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
