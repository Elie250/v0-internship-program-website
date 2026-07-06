import { COMPANY } from '@/lib/company/constants'import { loadPublicCompanyProfile } from '@/lib/platform/site-settings'

export async function getCompanyLogoUrl(): Promise<string> {
  try {
    const profile = await loadPublicCompanyProfile()
    return profile.logoUrl || COMPANY.logoUrl
  } catch {
    return COMPANY.logoUrl
  }
}
