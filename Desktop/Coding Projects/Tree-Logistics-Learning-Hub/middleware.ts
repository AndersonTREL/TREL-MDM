import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const intlMiddleware = createMiddleware({
  locales: ['en', 'de'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API routes
  if (
    pathname.includes('/_next') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  // Apply internationalization
  const response = intlMiddleware(request)

  // Check authentication for protected routes
  const protectedPaths = ['/dashboard', '/courses', '/documents', '/profile', '/admin', '/inspector']
  const isProtectedPath = protectedPaths.some(path => pathname.includes(path))

  if (isProtectedPath) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      const url = new URL('/auth/login', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }

    // Role-based access control
    if (pathname.includes('/admin') && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    if (pathname.includes('/inspector') && !['ADMIN', 'INSPECTOR'].includes(token.role as string)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next|api).*)'],
}

