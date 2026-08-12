import { NextRequest, NextResponse } from 'next/server'
import { proxy } from './proxy'
import {
  getMainSiteOrigin,
  isAcademyPath,
  isRecruitmentHost,
  isRecruitmentPath,
} from '@/lib/recruitment/hosts'

/**
 * Edge middleware: Talent subdomain routing + recruitment auth guards.
 * jobs.energyandlogics.com → job board at /jobs; Academy paths redirect to main site.
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')
  const pathname = request.nextUrl.pathname

  if (isRecruitmentHost(hostname)) {
    // Talent home on the jobs subdomain
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/jobs', request.url))
    }

    // Keep Academy/admin on the primary domain
    if (isAcademyPath(pathname) && !pathname.startsWith('/auth/logout')) {
      const target = new URL(pathname + request.nextUrl.search, getMainSiteOrigin())
      return NextResponse.redirect(target)
    }
  } else if (isRecruitmentPath(pathname)) {
    // Optional: main domain /jobs still works; no redirect required
  }

  return proxy(request)
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/student/:path*',
    '/engineer/:path*',
    '/lecturer/:path*',
    '/learning/:path*/enroll',
    '/app',
    '/app/:path*',
    '/employer',
    '/employer/:path*',
    '/',
    '/jobs',
    '/jobs/:path*',
    '/o/:path*',
  ],
}
