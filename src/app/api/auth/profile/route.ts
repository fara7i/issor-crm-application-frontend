import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { updateProfileSchema, validateRequest } from '@/lib/api-validations';
import { handleApiError, badRequest, unauthorized } from '@/lib/api-error';

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorized('Not authenticated');
    }

    const body = await request.json();
    const validation = validateRequest(updateProfileSchema, body);

    if (!validation.success) {
      return badRequest('Validation error', validation.errors.errors);
    }

    const { name, password, avatarUrl } = validation.data;

    // Build update object
    const updateData: {
      name?: string;
      passwordHash?: string;
      avatarUrl?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updateData.name = name;
    }

    if (password !== undefined) {
      updateData.passwordHash = await hashPassword(password);
    }

    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl;
    }

    // Update user
    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        phone: users.phone,
        name: users.name,
        role: users.role,
        avatarUrl: users.avatarUrl,
      });

    if (updatedUser.length === 0) {
      return badRequest('Failed to update profile');
    }

    return NextResponse.json({
      user: updatedUser[0],
      message: 'Profile updated successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
