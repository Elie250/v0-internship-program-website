import { NextRequest, NextResponse } from 'next/server'

function getUserSession(request: NextRequest) {
  const session = request.cookies.get('user_session')
  if (!session?.value) return null
  try {
    return JSON.parse(session.value) as { role: string }
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const user = getUserSession(request)
  const adminSession = request.cookies.get('admin_session')

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Protect admin dashboard — accept either legacy admin_session or user_session with admin role
  if (pathname.startsWith('/admin/dashboard')) {
    const isAdmin = adminSession?.value === 'authenticated' || user?.role === 'admin'
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  if (pathname === '/admin' || pathname === '/admin/') {
    const isAdmin = adminSession?.value === 'authenticated' || user?.role === 'admin'
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
}
