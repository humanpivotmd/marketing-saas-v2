import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Auth routes are protected on client side via sessionStorage
// Middleware handles redirects for known patterns
const publicPaths = [
  '/landing',
  '/login',
  '/register',
  '/verify-email',
  '/reset-password',
  '/forgot-password',
  '/terms',
  '/privacy',
  '/help',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-email',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/public/',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Root redirects to landing
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/landing', request.url))
  }

  // For API routes that need auth, check Authorization header
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // For protected pages (dashboard, etc.), client-side handles auth check
  // Middleware just passes through - sessionStorage check happens in layout
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
