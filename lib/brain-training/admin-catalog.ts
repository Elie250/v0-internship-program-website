import { supabaseAdmin, supabaseAdminConfig } from '@/lib/supabaseAdmin'
import { BRAIN_GAME_CATALOG } from '@/lib/brain-training/catalog'
import { normalizePublicMediaUrl } from '@/lib/media/safe-url'
import { revalidatePath } from 'next/cache'

export type BrainGameCatalogRow = {
  id?: string
  slug: string
  name: string
  description: string
  category: string
  thumbnail_url: string | null
  is_active: boolean
  sort_order: number
  short_tagline: string
  estimated_minutes: number
  difficulty_levels: number
}

export type BrainGamesDiagReport = {
  supabaseClientReady: boolean
  urlSet: boolean
  serviceRoleKeySet: boolean
  urlValid: boolean
  hostname?: string
  urlIssue?: string
  selectOk: boolean
  selectCount: number
  selectError?: string
}

function formatSupabaseError(error: {
  message?: string
  code?: string
  details?: string
  hint?: string
} | null): string {
  if (!error?.message) return 'Unknown database error'
  const parts = [error.message]
  if (error.code) parts.push(`code=${error.code}`)
  if (error.hint) parts.push(error.hint)
  if (error.details) parts.push(error.details)
  const joined = parts.join(' · ')
  if (
    joined.includes('schema cache') ||
    joined.toLowerCase().includes('could not find the table')
  ) {
    return `${joined} — In Supabase SQL run: NOTIFY pgrst, 'reload schema'; then wait ~10s and Sync again.`
  }
  return joined
}

function legacySafeCategory(category: string): string {
  if (
    category === 'cognitive' ||
    category === 'memory' ||
    category === 'logic' ||
    category === 'engineering'
  ) {
    return category
  }
  return 'engineering'
}

function mapBrainGameAdminRow(row: Record<string, unknown>): BrainGameCatalogRow {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ''),
    category: String(row.category ?? 'cognitive'),
    thumbnail_url: normalizePublicMediaUrl((row.thumbnail_url as string | null) ?? null),
    is_active: row.is_active !== false,
    sort_order: Number(row.sort_order) || 100,
    short_tagline: String(row.short_tagline ?? ''),
    estimated_minutes: Number(row.estimated_minutes) || 4,
    difficulty_levels: Number(row.difficulty_levels) || 4,
  }
}

async function upsertOneBrainGame(
  row: Record<string, unknown>
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' }

  const existing = await supabaseAdmin
    .from('brain_games')
    .select('id')
    .eq('slug', String(row.slug))
    .maybeSingle()

  if (existing.data?.id) {
    const { error } = await supabaseAdmin.from('brain_games').update(row).eq('id', existing.data.id)
    if (error) return { ok: false, error: formatSupabaseError(error) }
    return { ok: true }
  }

  const { error } = await supabaseAdmin.from('brain_games').insert(row)
  if (error) return { ok: false, error: formatSupabaseError(error) }
  return { ok: true }
}

export async function upsertStaticBrainGamesCatalog(): Promise<
  { ok: true; count: number } | { ok: false; error: string }
> {
  if (!supabaseAdmin) {
    return {
      ok: false,
      error:
        'Database not configured on the server (SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL). Check Vercel env vars.',
    }
  }

  const richRows = BRAIN_GAME_CATALOG.map((game, index) => ({
    slug: game.slug,
    name: game.name,
    description: `${game.name}. ${game.shortTagline}`,
    category: game.category,
    difficulty_levels: game.maxLevel,
    is_active: true,
    sort_order: (index + 1) * 10,
    estimated_minutes: game.estimatedMinutes,
    short_tagline: game.shortTagline,
  }))

  const rich = await supabaseAdmin.from('brain_games').upsert(richRows, { onConflict: 'slug' })
  if (!rich.error) return { ok: true, count: richRows.length }

  let wrote = 0
  let lastError = formatSupabaseError(rich.error)

  for (let index = 0; index < BRAIN_GAME_CATALOG.length; index += 1) {
    const game = BRAIN_GAME_CATALOG[index]!
    let one = await upsertOneBrainGame({
      slug: game.slug,
      name: game.name,
      description: `${game.name}. ${game.shortTagline}`,
      category: game.category,
      difficulty_levels: game.maxLevel,
      is_active: true,
      sort_order: (index + 1) * 10,
      estimated_minutes: game.estimatedMinutes,
      short_tagline: game.shortTagline,
    })
    if (!one.ok) {
      one = await upsertOneBrainGame({
        slug: game.slug,
        name: game.name,
        description: `${game.name}. ${game.shortTagline}`,
        category: legacySafeCategory(game.category),
        difficulty_levels: game.maxLevel,
        is_active: true,
      })
    }
    if (one.ok) wrote += 1
    else lastError = one.error
  }

  if (wrote > 0) return { ok: true, count: wrote }

  return {
    ok: false,
    error:
      lastError.includes('does not exist') || lastError.includes('schema cache')
        ? `${lastError} Run scripts/64-brain-games-bootstrap.sql in the SAME Supabase project as your production env, then Sync.`
        : lastError,
  }
}

export async function fetchBrainGamesAdminRows(): Promise<{
  games: BrainGameCatalogRow[]
  error?: string
}> {
  if (!supabaseAdmin) return { games: [], error: 'Database not configured' }

  const full = await supabaseAdmin
    .from('brain_games')
    .select(
      'id, slug, name, description, category, thumbnail_url, is_active, sort_order, short_tagline, estimated_minutes, difficulty_levels'
    )
    .order('sort_order', { ascending: true })

  if (!full.error) {
    return {
      games: ((full.data ?? []) as Record<string, unknown>[]).map(mapBrainGameAdminRow),
    }
  }

  const basic = await supabaseAdmin
    .from('brain_games')
    .select('id, slug, name, description, category, is_active, difficulty_levels')
    .order('name', { ascending: true })

  if (basic.error) {
    return {
      games: [],
      error: formatSupabaseError(basic.error),
    }
  }

  return {
    games: ((basic.data ?? []) as Record<string, unknown>[]).map((row) =>
      mapBrainGameAdminRow({
        ...row,
        thumbnail_url: null,
        sort_order: 100,
        short_tagline: '',
        estimated_minutes: 4,
      })
    ),
  }
}

export async function listBrainGamesCatalogWithSeed(): Promise<{
  success: boolean
  games: BrainGameCatalogRow[]
  error?: string
  seeded?: boolean
  report: BrainGamesDiagReport
}> {
  const report = buildDiagReport()

  let fetched = await fetchBrainGamesAdminRows()
  if (fetched.error) {
    report.selectOk = false
    report.selectError = fetched.error
    return { success: false, games: [], error: fetched.error, report }
  }

  report.selectOk = true
  report.selectCount = fetched.games.length

  let seeded = false
  if (fetched.games.length === 0) {
    const seed = await upsertStaticBrainGamesCatalog()
    if (!seed.ok) {
      report.selectError = seed.error
      return { success: false, games: [], error: seed.error, report }
    }
    seeded = true
    fetched = await fetchBrainGamesAdminRows()
    if (fetched.error) {
      report.selectError = fetched.error
      return { success: false, games: [], error: fetched.error, report }
    }
    report.selectCount = fetched.games.length
  }

  return { success: true, games: fetched.games, seeded, report }
}

export function buildDiagReport(selectError?: string, selectCount = 0, selectOk = false): BrainGamesDiagReport {
  return {
    supabaseClientReady: Boolean(supabaseAdmin),
    urlSet: supabaseAdminConfig.urlSet,
    serviceRoleKeySet: supabaseAdminConfig.serviceRoleKeySet,
    urlValid: supabaseAdminConfig.urlValidation.valid,
    hostname: supabaseAdminConfig.urlValidation.hostname,
    urlIssue: supabaseAdminConfig.urlValidation.issue,
    selectOk,
    selectCount,
    selectError,
  }
}

export async function diagnoseBrainGamesCatalog(): Promise<BrainGamesDiagReport> {
  const report = buildDiagReport()
  if (!supabaseAdmin) {
    report.selectError =
      'Supabase admin client is null — set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL on the host.'
    return report
  }

  const probe = await supabaseAdmin.from('brain_games').select('id, slug', { count: 'exact' })
  if (probe.error) {
    report.selectError = formatSupabaseError(probe.error)
  } else {
    report.selectOk = true
    report.selectCount = probe.count ?? probe.data?.length ?? 0
  }
  return report
}

export async function updateBrainGameRow(input: {
  id: string
  name?: string
  description?: string
  short_tagline?: string
  thumbnail_url?: string | null
  is_active?: boolean
  sort_order?: number
  estimated_minutes?: number
}): Promise<{ success: boolean; error?: string }> {
  if (!supabaseAdmin) return { success: false, error: 'Database not configured' }

  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.description !== undefined) patch.description = input.description
  if (input.short_tagline !== undefined) patch.short_tagline = input.short_tagline
  if (input.thumbnail_url !== undefined) patch.thumbnail_url = input.thumbnail_url || null
  if (input.is_active !== undefined) patch.is_active = input.is_active
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order
  if (input.estimated_minutes !== undefined) patch.estimated_minutes = input.estimated_minutes

  const { error } = await supabaseAdmin.from('brain_games').update(patch).eq('id', input.id)
  if (error) return { success: false, error: formatSupabaseError(error) }

  try {
    revalidatePath('/')
    revalidatePath('/tools/brain-training')
    revalidatePath('/api/public/brain-games')
  } catch {
    /* ignore — not all runtimes support path revalidation */
  }

  return { success: true }
}
