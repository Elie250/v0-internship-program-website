import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { parseLessonBody } from '@/lib/learning/lesson-blocks'
import {
  authoredCheckpointsFromBody,
  canCompleteCheckpointedLesson,
  findAuthoredCheckpoint,
  gradeCheckpointChoice,
  nextCheckpointProgress,
} from '@/lib/learning/lesson-checkpoints'
import { isPublishedLessonVisibility } from '@/lib/learning/lesson-visibility'

export const LESSON_CHECKPOINT_HINT =
  'Checkpoint progress is not enabled yet. Run scripts/96-lesson-checkpoints.sql in Supabase.'

function isMissingCheckpointTable(message: string | undefined): boolean {
  const msg = message ?? ''
  return (
    msg.includes('lesson_checkpoint_progress') &&
    (msg.includes('does not exist') || msg.includes('schema cache'))
  )
}

export async function queryClearedCheckpointIds(
  userId: string,
  contentId: string
): Promise<{ ok: true; ids: string[]; tableReady: boolean } | { ok: false; error: string; tableReady?: boolean }> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('lesson_checkpoint_progress')
    .select('block_id, passed_at')
    .eq('user_id', userId)
    .eq('content_id', contentId)

  if (error) {
    if (isMissingCheckpointTable(error.message)) {
      return { ok: false, error: LESSON_CHECKPOINT_HINT, tableReady: false }
    }
    return { ok: false, error: error.message }
  }

  return {
    ok: true,
    tableReady: true,
    ids: (data ?? [])
      .filter((row) => row.passed_at)
      .map((row) => String(row.block_id))
      .filter(Boolean),
  }
}

export async function loadPublishedLessonCheckpoints(
  courseId: string,
  contentId: string
): Promise<
  | { ok: true; blocks: ReturnType<typeof parseLessonBody> }
  | { ok: false; error: string }
> {
  if (!supabaseAdmin) return { ok: false, error: 'Database not configured' }

  const { data, error } = await supabaseAdmin
    .from('course_content')
    .select('id, course_id, body, visibility')
    .eq('id', contentId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'Lesson not found in this course' }
  if (!isPublishedLessonVisibility(data.visibility)) {
    return { ok: false, error: 'Lesson not found in this course' }
  }

  return { ok: true, blocks: parseLessonBody(data.body) }
}

export async function submitLessonCheckpoint(input: {
  userId: string
  courseId: string
  contentId: string
  blockId: string
  choiceId: string
}): Promise<
  | { ok: true; correct: true; clearedBlockIds: string[]; hint?: undefined }
  | { ok: true; correct: false; hint: string; clearedBlockIds: string[] }
  | { ok: false; error: string; status: number; tableReady?: boolean }
> {
  const lesson = await loadPublishedLessonCheckpoints(input.courseId, input.contentId)
  if (!lesson.ok) return { ok: false, error: lesson.error, status: 404 }

  const checkpoint = findAuthoredCheckpoint(lesson.blocks, input.blockId)
  if (!checkpoint) {
    return { ok: false, error: 'Checkpoint not found in this lesson', status: 404 }
  }

  const graded = gradeCheckpointChoice(checkpoint, input.choiceId)
  if (!graded.ok) return { ok: false, error: graded.error, status: 400 }

  if (!supabaseAdmin) return { ok: false, error: 'Database not configured', status: 500 }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('lesson_checkpoint_progress')
    .select('passed_at, attempt_count')
    .eq('user_id', input.userId)
    .eq('content_id', input.contentId)
    .eq('block_id', input.blockId)
    .maybeSingle()

  if (existingError) {
    if (isMissingCheckpointTable(existingError.message)) {
      return { ok: false, error: LESSON_CHECKPOINT_HINT, status: 503, tableReady: false }
    }
    return { ok: false, error: existingError.message, status: 500 }
  }

  const now = new Date().toISOString()
  const next = nextCheckpointProgress({
    existing,
    passed: graded.correct,
    now,
  })

  const { error } = await supabaseAdmin.from('lesson_checkpoint_progress').upsert(
    {
      user_id: input.userId,
      content_id: input.contentId,
      block_id: input.blockId,
      attempt_count: next.attempt_count,
      last_attempt_at: next.last_attempt_at,
      passed_at: next.passed_at,
      updated_at: now,
    },
    { onConflict: 'user_id,content_id,block_id' }
  )

  if (error) {
    if (isMissingCheckpointTable(error.message)) {
      return { ok: false, error: LESSON_CHECKPOINT_HINT, status: 503, tableReady: false }
    }
    return { ok: false, error: error.message, status: 500 }
  }

  const cleared = await queryClearedCheckpointIds(input.userId, input.contentId)
  if (!cleared.ok) {
    return {
      ok: false,
      error: cleared.error,
      status: cleared.tableReady === false ? 503 : 500,
      tableReady: cleared.tableReady,
    }
  }

  if (graded.correct) {
    return { ok: true, correct: true, clearedBlockIds: cleared.ids }
  }

  return {
    ok: true,
    correct: false,
    hint: checkpoint.hint,
    clearedBlockIds: cleared.ids,
  }
}

export async function assertLessonCheckpointsPassed(input: {
  userId: string
  courseId: string
  contentId: string
  alreadyCompleted: boolean
}): Promise<{ ok: true } | { ok: false; error: string; tableReady?: boolean }> {
  if (input.alreadyCompleted) return { ok: true }

  const lesson = await loadPublishedLessonCheckpoints(input.courseId, input.contentId)
  if (!lesson.ok) return { ok: false, error: lesson.error }

  const required = authoredCheckpointsFromBody(lesson.blocks).map((block) => block.id)
  if (!required.length) return { ok: true }

  const cleared = await queryClearedCheckpointIds(input.userId, input.contentId)
  if (!cleared.ok) {
    return { ok: false, error: cleared.error, tableReady: cleared.tableReady }
  }

  const gate = canCompleteCheckpointedLesson({
    alreadyCompleted: false,
    requiredCheckpointIds: required,
    clearedBlockIds: cleared.ids,
  })
  if (!gate.ok) {
    return {
      ok: false,
      error: 'Answer the checkpoint questions in this lesson before marking it complete.',
    }
  }

  return { ok: true }
}
