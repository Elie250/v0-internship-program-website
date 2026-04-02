import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next()
  }

  // Check authentication cookie
  const isAuth = request.cookies.get('admin_authenticated')

  if (!isAuth) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}