import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This is the required export function
export function proxy(request: NextRequest) {
  const cookies = request.cookies
  const adminSession = cookies.get('admin_session')
  const studentSession = cookies.get('student_session')

  const pathname = request.nextUrl.pathname

  // Protect /admin routes
  if (pathname.startsWith('/admin') && !adminSession) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Protect /student/portal routes
  if (pathname.startsWith('/student/portal') && !studentSession) {
    return NextResponse.redirect(new URL('/student/login', request.url))
  }

  // Allow all other requests
  return NextResponse.next()
}

// Paths this proxy applies to
export const config = {
  matcher: ['/admin/:path*', '/student/portal/:path*']
}