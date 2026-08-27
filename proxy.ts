import { NextRequest, NextResponse } from 'next/server'
import {
  getMainSiteOrigin,
  isAcademyPath,
  isRecruitmentHost,
  isRecruitmentPath,
} from '@/lib/recruitment/hosts'
import {
  getShopPublicOrigin,
  isPublicStorefrontPath,
  isShopHost,
  isShopPortalPath,
  isShopStaffApiPath,
} from '@/lib/shop/hosts'
import { STAFF_SESSION_COOKIE } from '@/lib/staff/session-cookie'
import { sanitizeShopReturnPath } from '@/lib/shop/safe-return-path'

function getTalentOrigin(): string {
  const url =
    process.env.RECRUITMENT_PUBLIC_BASE_URL?.trim() || 'https://jobs.energyandlogics.com'
  return url.replace(/\/$/, '')
}

function getUserSession(request: NextRequest) {
  const session = request.cookies.get('user_session')
  if (!session?.value) return null
  try {
    return JSON.parse(session.value) as {
      role: string
      permissions?: string[]
    }
  } catch {
    return null
  }
}

function isAdminUser(
  user: ReturnType<typeof getUserSession>,
  adminSession: ReturnType<NextRequest['cookies']['get']>
) {
  if (adminSession?.value === 'authenticated') return true
  if (!user) return false
  if (user.role === 'admin') return true
  return user.permissions?.includes('admin:access') ?? false
}

function hasStaffSessionCookie(request: NextRequest): boolean {
  const value = request.cookies.get(STAFF_SESSION_COOKIE)?.value?.trim()
  return Boolean(value)
}

function isShopLoginPath(pathname: string): boolean {
  return pathname === '/login' || pathname.startsWith('/login/')
}

function isShopPublicPortalPath(pathname: string): boolean {
  return (
    isShopLoginPath(pathname) ||
    pathname === '/manage/login' ||
    pathname.startsWith('/manage/login/')
  )
}

/** Map public shop-host paths to internal /manage/* App Router pages. */
function rewriteShopModulePath(pathname: string): string | null {
  const modules = ['pos', 'products', 'inventory', 'sales', 'settings', 'users'] as const
  for (const name of modules) {
    if (pathname === `/${name}`) return `/manage/${name}`
    if (pathname.startsWith(`/${name}/`)) {
      return `/manage/${name}${pathname.slice(name.length + 1)}`
    }
  }
  return null
}

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host')
  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search
  const onShopHost = isShopHost(hostname)
  const onTalentHost = isRecruitmentHost(hostname)

  // jobs.energyandlogics.com → Talent at /jobs; Academy paths on main domain
  if (onTalentHost) {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/jobs', request.url))
    }
    if (isShopPortalPath(pathname) || isShopStaffApiPath(pathname)) {
      const target = new URL(pathname + search, getShopPublicOrigin())
      return NextResponse.redirect(target)
    }
    if (isAcademyPath(pathname) && !pathname.startsWith('/auth/logout')) {
      const target = new URL(pathname + search, getMainSiteOrigin())
      return NextResponse.redirect(target)
    }
  }

  // shop.energyandlogics.com → Shop Management Portal
  if (onShopHost) {
    const staffCookie = hasStaffSessionCookie(request)

    if (pathname === '/') {
      return NextResponse.redirect(new URL(staffCookie ? '/dashboard' : '/login', request.url))
    }

    if (isPublicStorefrontPath(pathname)) {
      const target = new URL(pathname + search, getMainSiteOrigin())
      return NextResponse.redirect(target)
    }

    // Canonical public URLs → internal /manage/* pages (avoid colliding with Academy /login,/dashboard)
    if (isShopLoginPath(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = '/manage/login'
      return NextResponse.rewrite(url)
    }

    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
      if (!staffCookie) {
        const login = new URL('/login', request.url)
        login.searchParams.set('returnTo', sanitizeShopReturnPath(pathname + search))
        return NextResponse.redirect(login)
      }
      const url = request.nextUrl.clone()
      url.pathname = pathname.replace(/^\/dashboard/, '/manage/dashboard') || '/manage/dashboard'
      return NextResponse.rewrite(url)
    }

    const shopModuleRewrite = rewriteShopModulePath(pathname)
    if (shopModuleRewrite) {
      if (!staffCookie) {
        const login = new URL('/login', request.url)
        login.searchParams.set('returnTo', sanitizeShopReturnPath(pathname + search))
        return NextResponse.redirect(login)
      }
      const url = request.nextUrl.clone()
      url.pathname = shopModuleRewrite
      return NextResponse.rewrite(url)
    }

    if (
      isShopPortalPath(pathname) &&
      !isShopPublicPortalPath(pathname) &&
      pathname !== '/manage' &&
      !pathname.startsWith('/manage/')
    ) {
      if (!staffCookie) {
        const login = new URL('/login', request.url)
        login.searchParams.set('returnTo', sanitizeShopReturnPath(pathname + search))
        return NextResponse.redirect(login)
      }
    }

    if (pathname === '/manage' || pathname === '/manage/') {
      return NextResponse.redirect(new URL(staffCookie ? '/dashboard' : '/login', request.url))
    }

    if (pathname.startsWith('/manage/dashboard')) {
      if (!staffCookie) {
        const login = new URL('/login', request.url)
        login.searchParams.set('returnTo', '/dashboard')
        return NextResponse.redirect(login)
      }
    }

    if (isShopPortalPath(pathname) || isShopStaffApiPath(pathname) || pathname.startsWith('/manage')) {
      // stay on shop host
    } else if (isRecruitmentPath(pathname)) {
      const target = new URL(pathname + search, getTalentOrigin())
      return NextResponse.redirect(target)
    } else if (isAcademyPath(pathname) && !pathname.startsWith('/auth/logout')) {
      const target = new URL(pathname + search, getMainSiteOrigin())
      return NextResponse.redirect(target)
    }
  }

  const skipAcademyAuthGates =
    onShopHost &&
    (isShopPortalPath(pathname) ||
      isShopStaffApiPath(pathname) ||
      pathname.startsWith('/manage'))

  const user = getUserSession(request)
  const adminSession = request.cookies.get('admin_session')

  if (!skipAcademyAuthGates && pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (pathname.startsWith('/student') && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const enrollMatch = pathname.match(/^\/learning\/([^/]+)\/enroll\/?$/)
  if (enrollMatch && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', `/student/courses/${enrollMatch[1]}/enroll`)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/engineer') && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/lecturer') && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    const roleParam = request.nextUrl.searchParams.get('role')
    loginUrl.searchParams.set('role', roleParam === 'mentor' ? 'mentor' : 'lecturer')
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/app') && !user) {
    const loginUrl = new URL('/jobs/auth/continue', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/employer') && !user) {
    const loginUrl = new URL('/jobs/auth/continue', request.url)
    const dest = pathname.startsWith('/employer/auth') ? '/employer' : pathname
    loginUrl.searchParams.set('redirect', dest)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname.startsWith('/admin/dashboard')) {
    const isAdmin = isAdminUser(user, adminSession)
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  if (pathname === '/admin' || pathname === '/admin/') {
    const isAdmin = isAdminUser(user, adminSession)
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/manage',
    '/manage/:path*',
    '/login',
    '/login/:path*',
    '/pos',
    '/pos/:path*',
    '/products',
    '/products/:path*',
    '/inventory',
    '/inventory/:path*',
    '/sales',
    '/sales/:path*',
    '/settings',
    '/settings/:path*',
    '/shop',
    '/shop/:path*',
    '/admin/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/student/:path*',
    '/engineer/:path*',
    '/lecturer/:path*',
    '/learning/:path*/enroll',
    '/jobs',
    '/jobs/:path*',
    '/app',
    '/app/:path*',
    '/employer',
    '/employer/:path*',
    '/o/:path*',
    '/api/staff',
    '/api/staff/:path*',
  ],
}
