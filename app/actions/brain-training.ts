'use server'

import { getCurrentUser } from '@/app/actions/auth-service'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { GameResultPayload } from '@/lib/brain-training/scoring'
import { xpFromScore } from '@/lib/brain-training/scoring'

const SAVE_ROLES = new Set([
  'student',
  'registered',
  'admin',
  'lecturer',
  'instructor',
  'engineer',
  'mentor',
])

export async function saveBrainTrainingSession(
  result: GameResultPayload
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user?.id) {
    return { success: false, error: 'Login required to save progress' }
  }
  if (!SAVE_ROLES.has(String(user.role || ''))) {
    return { success: false, error: 'Your account type cannot save Brain Training progress' }
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
