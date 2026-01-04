import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

export interface JWTPayload {
  userId: number;
  phone: string;
  role: string;
}

export interface AuthUser {
  id: number;
  phone: string;
  name: string | null;
  role: string;
  avatarUrl: string | null;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token
 */
export function generateToken(userId: number, phone: string, role: string): string {
  const payload: JWTPayload = { userId, phone, role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Get current user from request
 */
export async function getCurrentUser(request: Request): Promise<AuthUser | null> {
  const token = extractToken(request);
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  try {
    const user = await db
      .select({
        id: users.id,
        phone: users.phone,
        name: users.name,
        role: users.role,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (user.length === 0) {
      return null;
    }

    return user[0];
  } catch {
    return null;
  }
}

/**
 * Verify user has required role
 */
export function hasRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}
