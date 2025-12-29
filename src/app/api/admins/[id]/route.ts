import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, hasRole, hashPassword } from '@/lib/auth';
import { updateUserSchema, validateRequest } from '@/lib/api-validations';
import { handleApiError, badRequest, unauthorized, forbidden, notFound, conflict } from '@/lib/api-error';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorized();
    }

    if (!hasRole(user.role, ['SUPER_ADMIN'])) {
      return forbidden();
    }

    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return badRequest('Invalid user ID');
    }

    const foundUser = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (foundUser.length === 0) {
      return notFound('User not found');
    }

    return NextResponse.json({ admin: foundUser[0] });
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

    if (!hasRole(user.role, ['SUPER_ADMIN'])) {
      return forbidden();
    }

    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return badRequest('Invalid user ID');
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return notFound('User not found');
    }

    const body = await request.json();
    const validation = validateRequest(updateUserSchema, body);

    if (!validation.success) {
      return badRequest('Validation error', validation.errors.errors);
    }

    const { email, password, name, role, isActive } = validation.data;

    // Check for duplicate email if changed
    if (email && email !== existingUser[0].email) {
      const duplicateEmail = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (duplicateEmail.length > 0) {
        return conflict('A user with this email already exists');
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return NextResponse.json({ admin: updatedUser[0] });
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

    if (!hasRole(user.role, ['SUPER_ADMIN'])) {
      return forbidden();
    }

    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return badRequest('Invalid user ID');
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return badRequest('You cannot delete your own account');
    }

    // Check if user exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return notFound('User not found');
    }

    // Soft delete - set is_active to false
    await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
