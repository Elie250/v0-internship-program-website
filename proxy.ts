import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {

  const pathname = request.nextUrl.pathname

  const adminSession = request.cookies.get('admin_session')
  const studentSession = request.cookies.get('student_session')

  // Allow login pages
  if (pathname === '/admin/login' || pathname === '/student/login') {
    return NextResponse.next()
  }

  // Protect admin dashboard
  if (pathname.startsWith('/admin') && !adminSession) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Protect student portal
  if (pathname.startsWith('/student/portal') && !studentSession) {
    return NextResponse.redirect(new URL('/student/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/student/portal/:path*']
}