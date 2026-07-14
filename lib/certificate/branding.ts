import { COMPANY } from '@/lib/company/constants'
import { getCompanyLogoUrl } from '@/lib/platform/branding'

export type CertificateBranding = {
  logoUrl: string
  stampUrl: string
  signatoryName: string
  signatoryTitle: string
}

const DEFAULTS: CertificateBranding = {
  logoUrl: COMPANY.logoUrl,
  stampUrl: '/images/company-stamp.png',
  signatoryName: 'Elie BISAMAZA',
  signatoryTitle: `Managing Director · ${COMPANY.legalName}`,
}

/** Certificate / receipt / report stamp assets (logo from settings; stamp from public). */
export async function loadCertificateBranding(): Promise<CertificateBranding> {
  try {
    const logoUrl = (await getCompanyLogoUrl()) || DEFAULTS.logoUrl
    return {
      ...DEFAULTS,
      logoUrl,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function resolveCertificateAsset(assetBaseUrl: string, pathOrUrl: string): string {
  const value = pathOrUrl.trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value
  const base = assetBaseUrl.replace(/\/$/, '')
  return `${base}${value.startsWith('/') ? '' : '/'}${value}`
}
