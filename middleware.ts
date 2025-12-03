import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Pages that don't require authentication
const publicPaths = ['/login', '/api/auth/login']

// API routes that need protection (webhooks should remain public)
const protectedApiPaths = [
  '/api/services',
  '/api/service-types',
  '/api/sync',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // Allow webhooks (they have their own security)
  if (pathname.includes('webhook')) {
    return NextResponse.next()
  }
  
  // Allow cleanup cron job
  if (pathname === '/api/cleanup-payments') {
    return NextResponse.next()
  }
  
  // Check authentication for protected pages and APIs
  const authToken = request.cookies.get('auth-token')?.value
  
  const isProtectedApi = protectedApiPaths.some(path => pathname.startsWith(path))
  const isPage = !pathname.startsWith('/api/')
  
  if ((isPage || isProtectedApi) && !authToken) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    
    // For pages, redirect to login
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}
