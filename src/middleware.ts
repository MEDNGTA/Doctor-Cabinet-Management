import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/patients',
  '/appointments',
  '/prescriptions',
  '/stock',
  '/suppliers',
  '/api',
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip auth checks for public routes and NextAuth API endpoints
  if (
    pathname === '/auth/login' ||
    pathname === '/auth/register' ||
    pathname === '/' ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // Check if session exists via NextAuth session cookie
  const sessionToken = request.cookies.get('authjs.session-token')?.value ||
                      request.cookies.get('__Secure-authjs.session-token')?.value;

  // If no session and trying to access protected route, redirect to login
  if (!sessionToken && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // For simple protected routes, just check if session exists
  // Role-based checks happen on the server side where we have database access
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
