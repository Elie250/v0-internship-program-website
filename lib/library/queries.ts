import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  normalizeLibraryItem,
  type EnergyLibraryItem,
  type LibraryPillar,
} from '@/lib/library/items'

const MISSING_TABLE = /energy_library_items|could not find the table/i

export async function loadPublishedLibraryItems(options?: {
  pillar?: LibraryPillar
  limit?: number
}): Promise<EnergyLibraryItem[]> {
  if (!supabaseAdmin) return []

  let query = supabaseAdmin
    .from('energy_library_items')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false })

  if (options?.pillar) {
    query = query.eq('pillar', options.pillar)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    if (MISSING_TABLE.test(error.message)) return []
    throw error
  }

  return (data ?? []).map((row) => normalizeLibraryItem(row as Record<string, unknown>))
}

export async function loadPublishedLibraryItemBySlug(slug: string): Promise<EnergyLibraryItem | null> {
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin
    .from('energy_library_items')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    if (MISSING_TABLE.test(error.message)) return null
    throw error
  }

  return data ? normalizeLibraryItem(data as Record<string, unknown>) : null
}

export async function recordLibraryItemView(slug: string): Promise<void> {
  if (!supabaseAdmin) return

  const { data } = await supabaseAdmin
    .from('energy_library_items')
    .select('id, view_count')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!data) return

  await supabaseAdmin
    .from('energy_library_items')
    .update({
      view_count: Number((data as { view_count?: number }).view_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', (data as { id: string }).id)
}
