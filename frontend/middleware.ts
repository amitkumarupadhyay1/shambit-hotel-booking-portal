import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Define protected routes
const PROTECTED_ROUTES = [
  '/onboarding',
  '/dashboard',
  '/admin',
];

// JWT payload interface (matching backend)
interface JwtPayload {
  sub: string; // user id
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

/**
 * Extract token from request cookies and headers
 * Priority: Authorization header > cookies
 */
function extractToken(request: NextRequest): string | null {
  try {
    // 1. Check Authorization header first (Bearer token)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token && token !== 'null' && token !== 'undefined') {
        return token;
      }
    }

    // 2. Check cookies for access token
    const cookieToken = request.cookies.get('accessToken')?.value;
    if (cookieToken && cookieToken !== 'null' && cookieToken !== 'undefined') {
      return cookieToken;
    }

    // 3. Check for token in custom header (for API calls)
    const customToken = request.headers.get('x-access-token');
    if (customToken && customToken !== 'null' && customToken !== 'undefined') {
      return customToken;
    }

    return null;
  } catch (error) {
    console.error('❌ Token extraction error:', error);
    return null;
  }
}

/**
 * Validate JWT token structure and expiry
 * Note: We can't verify signature in middleware due to environment limitations
 */
function validateTokenStructure(token: string): JwtPayload | null {
  try {
    // Decode without verification (we'll rely on backend for signature verification)
    const decoded = jwt.decode(token) as JwtPayload;
    
    if (!decoded || typeof decoded !== 'object') {
      console.log('❌ Invalid token structure');
      return null;
    }

    // Check required fields
    if (!decoded.sub || !decoded.email) {
      console.log('❌ Missing required token fields');
      return null;
    }

    // Check expiry
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      console.log('❌ Token expired');
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('❌ Token validation error:', error);
    return null;
  }
}

/**
 * Check if the current path is a protected route
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

/**
 * Create redirect response to login page
 */
function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/login', request.url);
  
  // Add redirect parameter to return user to original page after login
  if (request.nextUrl.pathname !== '/login') {
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  }
  
  console.log('🔄 Redirecting to login:', loginUrl.toString());
  return NextResponse.redirect(loginUrl);
}

/**
 * Handle token validation failures with appropriate error responses
 */
function handleTokenValidationFailure(
  request: NextRequest, 
  reason: string
): NextResponse {
  console.log(`❌ Token validation failed: ${reason}`);
  
  // For API requests, return JSON error
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { 
        error: 'Unauthorized', 
        message: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      },
      { status: 401 }
    );
  }
  
  // For page requests, redirect to login
  return redirectToLogin(request);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log(`🔍 Middleware checking: ${pathname}`);
  
  // Skip middleware for public routes
  if (!isProtectedRoute(pathname)) {
    console.log('✅ Public route, allowing access');
    return NextResponse.next();
  }
  
  console.log('🔒 Protected route detected, validating token');
  
  // Extract token from request
  const token = extractToken(request);
  
  if (!token) {
    return handleTokenValidationFailure(request, 'No token found');
  }
  
  // Validate token structure and expiry
  const payload = validateTokenStructure(token);
  
  if (!payload) {
    return handleTokenValidationFailure(request, 'Invalid token structure or expired');
  }
  
  console.log(`✅ Token valid for user: ${payload.email}`);
  
  // Add user info to headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.sub);
  response.headers.set('x-user-email', payload.email);
  response.headers.set('x-user-roles', JSON.stringify(payload.roles));
  
  return response;
}

export const config = {
  matcher: [
    '/onboarding',
    '/dashboard',
    '/admin',
  ],
};
