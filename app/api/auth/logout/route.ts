import { NextResponse } from 'next/server'
import { clearAuthCookies } from '@/lib/auth/session-cookies'

export async function POST() {
  await clearAuthCookies()
  return NextResponse.json({ success: true })
}

export async function GET(request: Request) {
  await clearAuthCookies()
  const url = new URL('/auth/login', request.url)
  url.searchParams.set('logout', '1')
  return NextResponse.redirect(url)
}
