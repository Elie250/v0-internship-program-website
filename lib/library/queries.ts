import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  normalizeLibraryItem,
  type EnergyLibraryItem,
  type LibraryCultureType,
  type LibraryPillar,
} from '@/lib/library/items'
import type { LibrarySort } from '@/lib/library/urls'

const MISSING_TABLE = /energy_library_items|could not find the table/i

type BrowseOptions = {
  pillar?: LibraryPillar
  cultureType?: LibraryCultureType
  language?: string
  sort?: LibrarySort
  limit?: number
}

function applyBrowseFilters<T extends { eq: (col: string, val: string) => T }>(
  query: T,
  options?: BrowseOptions
) {
  let next = query
  if (options?.pillar) next = next.eq('pillar', options.pillar)
  if (options?.cultureType) next = next.eq('culture_type', options.cultureType)
  if (options?.language) next = next.eq('language', options.language)
  return next
}

function applySort<T extends { order: (col: string, opts: { ascending: boolean }) => T }>(
  query: T,
  sort: LibrarySort = 'newest'
) {
  if (sort === 'popular') {
    return query.order('view_count', { ascending: false }).order('published_at', { ascending: false })
  }
  return query.order('sort_order', { ascending: true }).order('published_at', { ascending: false })
}

export async function loadPublishedLibraryItems(options?: BrowseOptions): Promise<EnergyLibraryItem[]> {
  if (!supabaseAdmin) return []

  let query = supabaseAdmin.from('energy_library_items').select('*').eq('status', 'published')
  query = applyBrowseFilters(query, options)
  query = applySort(query, options?.sort)

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

export async function searchPublishedLibraryItems(
  queryText: string,
  options?: BrowseOptions
): Promise<EnergyLibraryItem[]> {
  if (!supabaseAdmin || !queryText.trim()) return []

  const q = queryText.trim().replace(/[%_]/g, '')
  let query = supabaseAdmin
    .from('energy_library_items')
    .select('*')
    .eq('status', 'published')
    .or(
      `title.ilike.%${q}%,description.ilike.%${q}%,body.ilike.%${q}%,author_name.ilike.%${q}%`
    )

  query = applyBrowseFilters(query, options)
  query = applySort(query, options?.sort)
  query = query.limit(options?.limit ?? 48)

  const { data, error } = await query

  if (error) {
    if (MISSING_TABLE.test(error.message)) return []
    throw error
  }

  return (data ?? []).map((row) => normalizeLibraryItem(row as Record<string, unknown>))
}

export async function loadPopularLibraryItems(
  options?: Omit<BrowseOptions, 'sort'> & { days?: number }
): Promise<EnergyLibraryItem[]> {
  if (!supabaseAdmin) return []

  const days = options?.days ?? 30
  const since = new Date()
  since.setDate(since.getDate() - days)

  let query = supabaseAdmin
    .from('energy_library_items')
    .select('*')
    .eq('status', 'published')
    .gte('published_at', since.toISOString())
    .order('view_count', { ascending: false })
    .order('published_at', { ascending: false })

  query = applyBrowseFilters(query, options)

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

export async function loadFeaturedCultureItems(limit = 3): Promise<EnergyLibraryItem[]> {
  return loadPublishedLibraryItems({ pillar: 'culture', limit })
}

export async function loadFeaturedLibraryPicks(limit = 4): Promise<EnergyLibraryItem[]> {
  if (!supabaseAdmin) return []

  const { data, error } = await supabaseAdmin
    .from('energy_library_items')
    .select('*')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (MISSING_TABLE.test(error.message) || error.message.includes('is_featured')) {
      return loadPopularLibraryItems({ limit })
    }
    throw error
  }

  const items = (data ?? []).map((row) => normalizeLibraryItem(row as Record<string, unknown>))
  if (items.length > 0) return items
  return loadPopularLibraryItems({ limit })
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
