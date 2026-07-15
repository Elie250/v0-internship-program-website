'use server'

import { checkUserPermission, getCurrentUser } from '@/app/actions/auth-service'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { BRAIN_GAME_CATALOG } from '@/lib/brain-training/catalog'
import type { GameResultPayload } from '@/lib/brain-training/scoring'
import { xpFromScore } from '@/lib/brain-training/scoring'
import { PERMISSIONS } from '@/lib/admin/permissions'

async function assertBrainGamesAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser()
  if (!user?.id) return { ok: false, error: 'Login required' }
  if (user.role === 'admin') return { ok: true }
  const allowed = await checkUserPermission(user.id, PERMISSIONS.CONTENT_ANNOUNCEMENTS)
  if (!allowed) return { ok: false, error: 'Forbidden' }
  return { ok: true }
}

/** Map extended categories to script-62-safe values when migration 63 is missing. */
function legacySafeCategory(category: string): string {
  if (category === 'cognitive' || category === 'memory' || category === 'logic' || category === 'engineering') {
    return category
  }
  return 'engineering'
}

/**
 * Upsert the static app catalog into `brain_games` so admin always has rows to edit.
 * Tolerates missing thumbnail/sort columns (script 63 not run yet).
 */
async function upsertStaticBrainGamesCatalog(): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' }

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

  const msg = rich.error.message || ''
  const missingTable = msg.includes('does not exist') || msg.includes('schema cache')
  if (missingTable) {
    return {
      ok: false,
      error:
        'Table brain_games is missing. In Supabase → SQL, run scripts/64-brain-games-bootstrap.sql (one paste), then click Sync catalog.',
    }
  }

  // Retry with columns/categories from script 62 only.
  const basicRows = BRAIN_GAME_CATALOG.map((game) => ({
    slug: game.slug,
    name: game.name,
    description: `${game.name}. ${game.shortTagline}`,
    category: legacySafeCategory(game.category),
    difficulty_levels: game.maxLevel,
    is_active: true,
  }))

  const basic = await supabaseAdmin.from('brain_games').upsert(basicRows, { onConflict: 'slug' })
  if (basic.error) {
    return {
      ok: false,
      error: missingTable
        ? 'Run scripts/62-brain-training-academy.sql and scripts/63-brain-training-thumbnails-and-games.sql in Supabase.'
        : basic.error.message,
    }
  }
  return { ok: true, count: basicRows.length }
}

function mapBrainGameAdminRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ''),
    category: String(row.category ?? 'cognitive'),
    thumbnail_url: (row.thumbnail_url as string | null) ?? null,
    is_active: row.is_active !== false,
    sort_order: Number(row.sort_order) || 100,
    short_tagline: String(row.short_tagline ?? ''),
    estimated_minutes: Number(row.estimated_minutes) || 4,
    difficulty_levels: Number(row.difficulty_levels) || 4,
  }
}

async function fetchBrainGamesAdminRows(): Promise<{
  games: ReturnType<typeof mapBrainGameAdminRow>[]
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
      error:
        basic.error.message.includes('does not exist') || full.error.message.includes('does not exist')
          ? 'Run scripts/62-brain-training-academy.sql and scripts/63-brain-training-thumbnails-and-games.sql in Supabase.'
          : basic.error.message,
    }
  }

  return {
    games: ((basic.data ?? []) as Record<string, unknown>[]).map((row) =>
      mapBrainGameAdminRow({ ...row, thumbnail_url: null, sort_order: 100, short_tagline: '', estimated_minutes: 4 })
    ),
  }
}

const STUDENT_ROLES = new Set(['student', 'registered'])

export async function saveBrainTrainingSession(
  result: GameResultPayload
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user?.id) {
    return { success: false, error: 'Login required to save progress' }
  }
  if (!STUDENT_ROLES.has(String(user.role || '')) && user.role !== 'admin') {
    // Lecturers/engineers can practice but optional save — allow any authenticated user
  }
  if (!supabaseAdmin) {
    return { success: false, error: 'Database not configured' }
  }

  const { data: game } = await supabaseAdmin
    .from('brain_games')
    .select('id, category')
    .eq('slug', result.gameSlug)
    .maybeSingle()

  if (!game?.id) {
    return {
      success: false,
      error: 'Brain games are not set up yet. Run scripts/62-brain-training-academy.sql and scripts/63-brain-training-thumbnails-and-games.sql in Supabase.',
    }
  }

  const { error: sessionError } = await supabaseAdmin.from('game_sessions').insert({
    user_id: user.id,
    game_id: game.id,
    score: result.score,
    accuracy: result.accuracy,
    average_response_ms: result.averageResponseMs,
    time_taken_ms: result.timeTakenMs,
    level_completed: result.levelCompleted,
    correct_count: result.correctCount,
    total_questions: result.totalQuestions,
    is_guest: false,
    attempt_date: new Date().toISOString(),
  })

  if (sessionError) {
    return { success: false, error: sessionError.message }
  }

  const xp = xpFromScore(result.score)
  const { data: profile } = await supabaseAdmin
    .from('brain_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const attentionDelta = result.gameSlug === 'color-word' ? result.score : 0
  const memoryDelta = result.gameSlug === 'sequence-match' ? result.score : 0
  const speedDelta = Math.max(0, 200 - Math.round(result.averageResponseMs / 10))

  if (profile) {
    const attention = Math.round((Number(profile.attention_score) + attentionDelta) / 2)
    const memory = Math.round((Number(profile.memory_score) + memoryDelta) / 2)
    const speed = Math.round((Number(profile.speed_score) + speedDelta) / 2)
    const logic = Number(profile.logic_score) || 0
    const overall = Math.round((attention + memory + logic + speed) / 4)
    await supabaseAdmin
      .from('brain_profiles')
      .update({
        attention_score: attention,
        memory_score: memory,
        speed_score: speed,
        overall_score: overall,
        total_sessions: Number(profile.total_sessions || 0) + 1,
        total_xp: Number(profile.total_xp || 0) + xp,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
  } else {
    const attention = attentionDelta
    const memory = memoryDelta
    const speed = speedDelta
    const overall = Math.round((attention + memory + speed) / 3)
    await supabaseAdmin.from('brain_profiles').insert({
      user_id: user.id,
      attention_score: attention,
      memory_score: memory,
      logic_score: 0,
      speed_score: speed,
      overall_score: overall,
      total_sessions: 1,
      total_xp: xp,
    })
  }

  // Lightweight achievement unlocks (ignore if table missing)
  try {
    if (result.accuracy >= 90) {
      await supabaseAdmin.from('brain_achievements').upsert(
        {
          user_id: user.id,
          achievement_key: `accuracy-90-${result.gameSlug}`,
          achievement_name: `Sharp shot · ${result.gameSlug}`,
        },
        { onConflict: 'user_id,achievement_key', ignoreDuplicates: true }
      )
    }
    if (result.levelCompleted >= 4) {
      await supabaseAdmin.from('brain_achievements').upsert(
        {
          user_id: user.id,
          achievement_key: `expert-${result.gameSlug}`,
          achievement_name: `Expert clear · ${result.gameSlug}`,
        },
        { onConflict: 'user_id,achievement_key', ignoreDuplicates: true }
      )
    }
  } catch {
    // achievements are optional in first release
  }

  return { success: true }
}

export async function getBrainTrainingLeaderboard(gameSlug: string, limit = 10) {
  if (!supabaseAdmin) return []
  const { data: game } = await supabaseAdmin
    .from('brain_games')
    .select('id')
    .eq('slug', gameSlug)
    .maybeSingle()
  if (!game?.id) return []

  const { data: sessions } = await supabaseAdmin
    .from('game_sessions')
    .select('score, accuracy, level_completed, attempt_date, user_id')
    .eq('game_id', game.id)
    .not('user_id', 'is', null)
    .order('score', { ascending: false })
    .limit(limit)

  const rows = sessions ?? []
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[]
  const nameById = new Map<string, string>()
  if (userIds.length) {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, first_name, last_name')
      .in('id', userIds)
    for (const u of users ?? []) {
      nameById.set(
        u.id,
        [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Student'
      )
    }
  }

  return rows.map((row) => ({
    name: (row.user_id && nameById.get(row.user_id)) || 'Student',
    score: Number(row.score) || 0,
    accuracy: Number(row.accuracy) || 0,
    level: Number(row.level_completed) || 1,
    date: row.attempt_date as string,
  }))
}

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

/** Public hub: merge static catalog with DB thumbnails / flags when available. */
export async function getBrainGamesForHub(): Promise<
  Array<{ slug: string; thumbnailUrl: string | null; isActive: boolean }>
> {
  try {
    if (!supabaseAdmin) return []

    const withSort = await supabaseAdmin
      .from('brain_games')
      .select('slug, thumbnail_url, is_active, sort_order')
      .order('sort_order', { ascending: true })

    const rows =
      withSort.error || !withSort.data
        ? (
            await supabaseAdmin.from('brain_games').select('slug, is_active')
          ).data
        : withSort.data

    if (!rows) return []

    return rows.map((row) => {
      const thumb = (row as { thumbnail_url?: unknown }).thumbnail_url
      const thumbStr = typeof thumb === 'string' ? thumb.trim() : ''
      return {
        slug: String(row.slug),
        thumbnailUrl: /^https?:\/\//i.test(thumbStr) ? thumbStr : null,
        isActive: row.is_active !== false,
      }
    })
  } catch {
    return []
  }
}

export async function listBrainGamesAdmin(): Promise<{
  success: boolean
  games: BrainGameCatalogRow[]
  error?: string
  seeded?: boolean
}> {
  try {
    const auth = await assertBrainGamesAdmin()
    if (!auth.ok) return { success: false, games: [], error: auth.error }

    let fetched = await fetchBrainGamesAdminRows()
    if (fetched.error) return { success: false, games: [], error: fetched.error }

    let seeded = false
    if (fetched.games.length === 0) {
      const seed = await upsertStaticBrainGamesCatalog()
      if (!seed.ok) return { success: false, games: [], error: seed.error }
      seeded = true
      fetched = await fetchBrainGamesAdminRows()
      if (fetched.error) return { success: false, games: [], error: fetched.error }
    }

    return { success: true, games: fetched.games, seeded }
  } catch (err) {
    return {
      success: false,
      games: [],
      error: err instanceof Error ? err.message : 'Failed to load brain games',
    }
  }
}

/** Admin button: force-sync app catalog into Supabase (creates missing drills). */
export async function seedBrainGamesCatalogAdmin(): Promise<{
  success: boolean
  count?: number
  error?: string
}> {
  try {
    const auth = await assertBrainGamesAdmin()
    if (!auth.ok) return { success: false, error: auth.error }
    const seed = await upsertStaticBrainGamesCatalog()
    if (!seed.ok) return { success: false, error: seed.error }
    return { success: true, count: seed.count }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Seed failed',
    }
  }
}

export async function updateBrainGameAdmin(input: {
  id: string
  name?: string
  description?: string
  short_tagline?: string
  thumbnail_url?: string | null
  is_active?: boolean
  sort_order?: number
  estimated_minutes?: number
}): Promise<{ success: boolean; error?: string }> {
  const auth = await assertBrainGamesAdmin()
  if (!auth.ok) return { success: false, error: auth.error }

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
  if (error) {
    return {
      success: false,
      error:
        error.message.includes('thumbnail_url') || error.message.includes('does not exist')
          ? 'Run scripts/63-brain-training-thumbnails-and-games.sql in Supabase first.'
          : error.message,
    }
  }
  return { success: true }
}

export type MyBrainProgressRow = {
  slug: string
  name: string
  bestScore: number
  bestAccuracy: number
  sessions: number
  lastPlayed: string | null
}

/** Logged-in user's personal bests per game. */
export async function getMyBrainProgress(): Promise<MyBrainProgressRow[]> {
  const user = await getCurrentUser()
  if (!user?.id || !supabaseAdmin) return []

  const { data: sessions } = await supabaseAdmin
    .from('game_sessions')
    .select('score, accuracy, attempt_date, game_id')
    .eq('user_id', user.id)
    .order('attempt_date', { ascending: false })
    .limit(200)

  if (!sessions?.length) return []

  const gameIds = [...new Set(sessions.map((s) => s.game_id).filter(Boolean))] as string[]
  const { data: games } = await supabaseAdmin
    .from('brain_games')
    .select('id, slug, name')
    .in('id', gameIds)

  const gameById = new Map((games ?? []).map((g) => [g.id as string, g]))
  const bySlug = new Map<string, MyBrainProgressRow>()

  for (const s of sessions) {
    const g = gameById.get(s.game_id as string)
    if (!g?.slug) continue
    const slug = String(g.slug)
    const existing = bySlug.get(slug)
    const score = Number(s.score) || 0
    const accuracy = Number(s.accuracy) || 0
    const date = (s.attempt_date as string) || null
    if (!existing) {
      bySlug.set(slug, {
        slug,
        name: String(g.name),
        bestScore: score,
        bestAccuracy: accuracy,
        sessions: 1,
        lastPlayed: date,
      })
    } else {
      existing.sessions += 1
      if (score > existing.bestScore) existing.bestScore = score
      if (accuracy > existing.bestAccuracy) existing.bestAccuracy = accuracy
    }
  }

  return [...bySlug.values()].sort((a, b) => b.bestScore - a.bestScore)
}

export type CohortGameStat = {
  slug: string
  name: string
  attempts: number
  avgAccuracy: number
  avgScore: number
  uniquePlayers: number
}

/** Lecturer/admin cohort snapshot across brain drills. */
export async function getBrainCohortStats(): Promise<{
  success: boolean
  stats: CohortGameStat[]
  error?: string
}> {
  const user = await getCurrentUser()
  if (!user?.id) return { success: false, stats: [], error: 'Login required' }
  const role = String(user.role || '')
  const allowed = new Set(['lecturer', 'admin', 'engineer', 'mentor'])
  if (!allowed.has(role)) return { success: false, stats: [], error: 'Forbidden' }
  if (!supabaseAdmin) return { success: false, stats: [], error: 'Database not configured' }

  const { data: games } = await supabaseAdmin
    .from('brain_games')
    .select('id, slug, name')
    .eq('is_active', true)

  const stats: CohortGameStat[] = []
  for (const g of games ?? []) {
    const { data: sessions } = await supabaseAdmin
      .from('game_sessions')
      .select('score, accuracy, user_id')
      .eq('game_id', g.id)
      .not('user_id', 'is', null)
      .limit(500)

    const rows = sessions ?? []
    if (!rows.length) {
      stats.push({
        slug: String(g.slug),
        name: String(g.name),
        attempts: 0,
        avgAccuracy: 0,
        avgScore: 0,
        uniquePlayers: 0,
      })
      continue
    }
    const avgAccuracy =
      rows.reduce((a, r) => a + (Number(r.accuracy) || 0), 0) / rows.length
    const avgScore = rows.reduce((a, r) => a + (Number(r.score) || 0), 0) / rows.length
    const uniquePlayers = new Set(rows.map((r) => r.user_id)).size
    stats.push({
      slug: String(g.slug),
      name: String(g.name),
      attempts: rows.length,
      avgAccuracy: Math.round(avgAccuracy * 10) / 10,
      avgScore: Math.round(avgScore),
      uniquePlayers,
    })
  }

  return { success: true, stats: stats.sort((a, b) => b.attempts - a.attempts) }
}
