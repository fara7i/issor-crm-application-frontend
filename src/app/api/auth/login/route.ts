import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyPassword, generateToken } from '@/lib/auth';
import { loginSchema, validateRequest } from '@/lib/api-validations';
import { handleApiError, badRequest, unauthorized } from '@/lib/api-error';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = validateRequest(loginSchema, body);
    if (!validation.success) {
      return badRequest('Validation error', validation.errors.errors);
    }

    const { phone, password } = validation.data;

    // Find user by phone
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.phone, phone), eq(users.isActive, true)))
      .limit(1);

    if (user.length === 0) {
      return unauthorized('Invalid phone number or password');
    }

    const foundUser = user[0];

    // Verify password
    const isValidPassword = await verifyPassword(password, foundUser.passwordHash);
    if (!isValidPassword) {
      return unauthorized('Invalid phone number or password');
    }

    // Generate JWT token
    const token = generateToken(foundUser.id, foundUser.phone, foundUser.role);

    // Update last login (we won't block on this)
    db.update(users)
      .set({ updatedAt: new Date() })
      .where(eq(users.id, foundUser.id))
      .catch(console.error);

    // Create response with token and user
    const response = NextResponse.json({
      token,
      user: {
        id: foundUser.id,
        phone: foundUser.phone,
        name: foundUser.name,
        role: foundUser.role,
        avatarUrl: foundUser.avatarUrl,
      },
    });

    // Set HTTP-only cookie for middleware authentication
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
