import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { COMPANY } from '@/lib/company/constants'

export async function getCompanyLogoUrl(): Promise<string> {
  if (!supabaseAdmin) return COMPANY.logoUrl

  try {
    const { data } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'company_logo_url')
      .maybeSingle()

    return data?.value || COMPANY.logoUrl
  } catch {
    return COMPANY.logoUrl
  }
}
