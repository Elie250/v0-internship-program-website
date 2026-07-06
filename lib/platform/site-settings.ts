import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getActiveHero } from '@/lib/platform/queries'
import {
  DEFAULT_WEB_SETTINGS,
  mapSettingsToForm,
  SITE_SETTING_KEYS,
  toPublicCompanyProfile,
  type PublicCompanyProfile,
  type WebSettingsForm,
} from '@/lib/platform/site-settings-schema'
import type { HeroContent } from '@/types/platform'

export async function loadAllSiteSettingRows(): Promise<Record<string, string>> {
  if (!supabaseAdmin) return {}
  const { data } = await supabaseAdmin.from('site_settings').select('key, value')
  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    map[String(row.key)] = String(row.value ?? '')
  }
  return map
}

export async function loadWebSettings(): Promise<WebSettingsForm> {
  const [rows, hero] = await Promise.all([loadAllSiteSettingRows(), getActiveHero()])
  return mapSettingsToForm(rows, hero)
}

export async function loadPublicCompanyProfile(): Promise<PublicCompanyProfile> {
  const form = await loadWebSettings()
  return toPublicCompanyProfile(form)
}

export async function saveWebSettings(
  input: WebSettingsForm
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const now = new Date().toISOString()
  const upserts = SITE_SETTING_KEYS.map((key) => ({
    key,
    value: String(input[key] ?? '').trim(),
    updated_at: now,
  }))

  const { error: settingsError } = await supabaseAdmin
    .from('site_settings')
    .upsert(upserts, { onConflict: 'key' })

  if (settingsError) return { success: false, error: settingsError.message }

  const heroPayload = {
    title: input.hero.title.trim(),
    subtitle: input.hero.subtitle.trim() || null,
    background_image: input.hero.background_image.trim() || null,
    cta_primary_label: input.hero.cta_primary_label.trim() || null,
    cta_primary_url: input.hero.cta_primary_url.trim() || null,
    cta_secondary_label: input.hero.cta_secondary_label.trim() || null,
    cta_secondary_url: input.hero.cta_secondary_url.trim() || null,
    is_active: true,
    updated_at: now,
  }

  if (input.hero.id) {
    const { error } = await supabaseAdmin
      .from('site_hero')
      .update(heroPayload)
      .eq('id', input.hero.id)
    if (error) return { success: false, error: error.message }
  } else {
    await supabaseAdmin.from('site_hero').update({ is_active: false }).eq('is_active', true)
    const { error } = await supabaseAdmin.from('site_hero').insert([heroPayload])
    if (error) return { success: false, error: error.message }
  }

  return { success: true }
}

export function heroFromForm(form: WebSettingsForm): HeroContent {
  const d = DEFAULT_WEB_SETTINGS.hero
  return {
    id: form.hero.id ?? 'settings',
    title: form.hero.title || d.title,
    subtitle: form.hero.subtitle || d.subtitle,
    background_image: form.hero.background_image || d.background_image,
    cta_primary_label: form.hero.cta_primary_label || d.cta_primary_label,
    cta_primary_url: form.hero.cta_primary_url || d.cta_primary_url,
    cta_secondary_label: form.hero.cta_secondary_label || d.cta_secondary_label,
    cta_secondary_url: form.hero.cta_secondary_url || d.cta_secondary_url,
    is_active: true,
  }
}
