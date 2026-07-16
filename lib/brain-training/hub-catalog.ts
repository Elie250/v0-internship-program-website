import { unstable_noStore as noStore } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { normalizePublicMediaUrl } from '@/lib/media/safe-url'

export type BrainGameHubRow = {
  slug: string
  thumbnailUrl: string | null
  isActive: boolean
}

/**
 * Public hub catalog overlay (thumbnails + active flags).
 * Kept outside `use server` so RSC pages can call it without Server Action quirks.
 */
export async function fetchBrainGamesForHub(): Promise<BrainGameHubRow[]> {
  noStore()
  try {
    if (!supabaseAdmin) return []

    // Keep thumbnail_url in every fallback — never drop it on a sort_order miss.
    let rows: Record<string, unknown>[] | null = null

    const withThumbSort = await supabaseAdmin
      .from('brain_games')
      .select('slug, thumbnail_url, is_active, sort_order')
      .order('sort_order', { ascending: true })

    if (!withThumbSort.error && withThumbSort.data) {
      rows = withThumbSort.data as Record<string, unknown>[]
    } else {
      const withThumb = await supabaseAdmin
        .from('brain_games')
        .select('slug, thumbnail_url, is_active')
        .order('name', { ascending: true })

      if (!withThumb.error && withThumb.data) {
        rows = withThumb.data as Record<string, unknown>[]
      } else {
        const basic = await supabaseAdmin.from('brain_games').select('slug, is_active')
        if (basic.error || !basic.data) return []
        rows = basic.data as Record<string, unknown>[]
      }
    }

    return rows.map((row) => {
      const thumb = row.thumbnail_url
      const thumbStr = typeof thumb === 'string' ? thumb : null
      return {
        slug: String(row.slug),
        thumbnailUrl: normalizePublicMediaUrl(thumbStr),
        isActive: row.is_active !== false,
      }
    })
  } catch {
    return []
  }
}
