import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { ne, sql, desc } from 'drizzle-orm';
import { getCurrentUser, hasRole, hashPassword } from '@/lib/auth';
import { createUserSchema, validateRequest, paginationSchema } from '@/lib/api-validations';
import { handleApiError, badRequest, unauthorized, forbidden, conflict } from '@/lib/api-error';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return unauthorized();
    }

    // Only SUPER_ADMIN can manage admins
    if (!hasRole(user.role, ['SUPER_ADMIN'])) {
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

    // Get total count (excluding SHOP_AGENT role)
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(ne(users.role, 'SHOP_AGENT'));

    const total = countResult[0]?.count || 0;

    // Get admins (all users except SHOP_AGENT, don't return password hash)
    const adminsList = await db
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
      .where(ne(users.role, 'SHOP_AGENT'))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      admins: adminsList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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

    // Only SUPER_ADMIN can create admins
    if (!hasRole(user.role, ['SUPER_ADMIN'])) {
      return forbidden();
    }

    const body = await request.json();
    const validation = validateRequest(createUserSchema, body);

    if (!validation.success) {
      return badRequest('Validation error', validation.errors.errors);
    }

    const { email, password, name, role } = validation.data;

    // Check for duplicate email
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return conflict('A user with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name,
        role,
        isActive: true,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    return NextResponse.json({ admin: newUser[0] }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
