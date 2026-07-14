'use server'

import { getCurrentUser } from '@/app/actions/auth-service'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { GameResultPayload } from '@/lib/brain-training/scoring'
import { xpFromScore } from '@/lib/brain-training/scoring'

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
      error: 'Brain games are not set up yet. Run scripts/62-brain-training-academy.sql in Supabase.',
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
