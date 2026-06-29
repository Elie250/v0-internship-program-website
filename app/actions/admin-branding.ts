'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'

export async function getSiteBranding() {
  await requireAdminPermission(PERMISSIONS.SETTINGS_MANAGE)
  if (!supabaseAdmin) return { logoUrl: '/images/energy-logics-logo.png' }

  const { data } = await supabaseAdmin
    .from('site_settings')
    .select('value')
    .eq('key', 'company_logo_url')
    .maybeSingle()

  return { logoUrl: data?.value || '/images/energy-logics-logo.png' }
}

export async function updateCompanyLogo(logoUrl: string) {
  await requireAdminPermission(PERMISSIONS.SETTINGS_MANAGE)
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const url = logoUrl.trim()
  if (!url) return { success: false, error: 'Logo URL is required' }

  const { error } = await supabaseAdmin.from('site_settings').upsert(
    { key: 'company_logo_url', value: url, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )

  if (error) return { success: false, error: error.message }
  return { success: true, logoUrl: url }
}
