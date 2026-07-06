import { NextResponse } from 'next/server'
import { loadPublicCompanyProfile } from '@/lib/platform/site-settings'

/** Public read-only company profile for client pages. */
export async function GET() {
  try {
    const profile = await loadPublicCompanyProfile()
    return NextResponse.json(profile)
  } catch {
    return NextResponse.json({ error: 'Failed to load site profile' }, { status: 500 })
  }
}
