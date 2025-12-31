import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// JWT secret as Uint8Array for jose
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
};

interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

// Role to allowed paths mapping
const ROLE_PATHS: Record<string, string[]> = {
  SUPER_ADMIN: ['super-admin'],
  ADMIN: ['admin'],
  SHOP_AGENT: ['shop-agent'],
  WAREHOUSE_AGENT: ['warehouse-agent'],
  CONFIRMER: ['confirmer'],
};

// Default dashboard paths for each role
const DEFAULT_PATHS: Record<string, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  ADMIN: '/admin/dashboard',
  SHOP_AGENT: '/shop-agent/orders',
  WAREHOUSE_AGENT: '/warehouse-agent/scan-orders',
  CONFIRMER: '/confirmer',
};

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and public paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get('auth_token')?.value;

  // Check if path is public
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  // If accessing login page with valid token, redirect to dashboard
  if (pathname === '/login' && token) {
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      const jwtPayload = payload as unknown as JWTPayload;
      const defaultPath = DEFAULT_PATHS[jwtPayload.role] || '/login';
      return NextResponse.redirect(new URL(defaultPath, request.url));
    } catch {
      // Token invalid, let them access login page
      const response = NextResponse.next();
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // Allow public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // For protected pages, check authentication
  const isDashboardPath = pathname.startsWith('/super-admin') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/shop-agent') ||
    pathname.startsWith('/warehouse-agent') ||
    pathname.startsWith('/confirmer');

  if (isDashboardPath) {
    // No token, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      const jwtPayload = payload as unknown as JWTPayload;
      const userRole = jwtPayload.role;

      // Check if user has access to this path
      const pathSegments = pathname.split('/').filter(Boolean);
      const roleFromPath = pathSegments[0];
      const allowedPaths = ROLE_PATHS[userRole] || [];

      if (!allowedPaths.includes(roleFromPath)) {
        // User doesn't have access, redirect to their dashboard
        const defaultPath = DEFAULT_PATHS[userRole] || '/login';
        return NextResponse.redirect(new URL(defaultPath, request.url));
      }

      // Add user info to request headers for server components
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', String(jwtPayload.userId));
      requestHeaders.set('x-user-email', jwtPayload.email);
      requestHeaders.set('x-user-role', jwtPayload.role);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch {
      // Token invalid or expired
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // For API routes (except auth), check token
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    // API routes still use Authorization header, handled in route handlers
    return NextResponse.next();
  }

  // Redirect root to login or dashboard
  if (pathname === '/') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      const jwtPayload = payload as unknown as JWTPayload;
      const defaultPath = DEFAULT_PATHS[jwtPayload.role] || '/login';
      return NextResponse.redirect(new URL(defaultPath, request.url));
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
