import { NextResponse } from 'next/server'
import { COMPANY } from '@/lib/company/constants'
import { loadCertificateBranding } from '@/lib/certificate/branding'

export const dynamic = 'force-dynamic'

function toAbsolute(pathOrUrl: string): string {
  const value = pathOrUrl.trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value
  const base = COMPANY.publicSiteUrl.replace(/\/$/, '')
  return `${base}${value.startsWith('/') ? '' : '/'}${value}`
}

export async function GET() {
  const branding = await loadCertificateBranding()
  return NextResponse.json({
    logoUrl: toAbsolute(branding.logoUrl) || branding.logoUrl,
    stampUrl: toAbsolute(branding.stampUrl) || branding.stampUrl,
    signatoryName: branding.signatoryName,
    signatoryTitle: branding.signatoryTitle,
  })
}
