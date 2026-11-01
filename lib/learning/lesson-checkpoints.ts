import {
  parseLessonBody,
  type CheckpointBlock,
  type LessonBlock,
  type StudentLessonBlock,
} from './lesson-blocks.ts'

export function isCheckpointBlock(block: LessonBlock | StudentLessonBlock): block is CheckpointBlock | Extract<StudentLessonBlock, { type: 'checkpoint' }> {
  return block.type === 'checkpoint'
}

export function checkpointIdsInBlocks(blocks: Array<LessonBlock | StudentLessonBlock>): string[] {
  return blocks
    .filter((block): block is Extract<typeof block, { type: 'checkpoint' }> => block.type === 'checkpoint')
    .map((block) => block.id)
    .filter(Boolean)
}

export function findAuthoredCheckpoint(blocks: LessonBlock[], blockId: string): CheckpointBlock | null {
  const match = blocks.find((block) => block.type === 'checkpoint' && block.id === blockId)
  return match?.type === 'checkpoint' ? match : null
}

export function visibleLessonBlocks<T extends LessonBlock | StudentLessonBlock>(
  blocks: T[],
  clearedBlockIds: Iterable<string>
): T[] {
  const cleared = clearedBlockIds instanceof Set ? clearedBlockIds : new Set(clearedBlockIds)
  const visible: T[] = []

  for (const block of blocks) {
    visible.push(block)
    if (block.type === 'checkpoint' && !cleared.has(block.id)) {
      break
    }
  }

  return visible
}

export function gradeCheckpointChoice(
  checkpoint: CheckpointBlock,
  choiceId: string
): { ok: true; correct: boolean } | { ok: false; error: string } {
  const trimmed = choiceId.trim()
  if (!trimmed) return { ok: false, error: 'Choose an answer' }
  if (!checkpoint.choices.some((choice) => choice.id === trimmed)) {
    return { ok: false, error: 'That answer is not one of the choices' }
  }
  return { ok: true, correct: trimmed === checkpoint.correct_choice_id }
}

export function nextCheckpointProgress(input: {
  existing?: { passed_at?: string | null; attempt_count?: number } | null
  passed: boolean
  now?: string
}): { attempt_count: number; passed_at: string | null; last_attempt_at: string } {
  const now = input.now ?? new Date().toISOString()
  const alreadyPassed = input.existing?.passed_at ?? null
  return {
    attempt_count: Number(input.existing?.attempt_count ?? 0) + 1,
    passed_at: alreadyPassed || (input.passed ? now : null),
    last_attempt_at: now,
  }
}

export function canCompleteCheckpointedLesson(input: {
  alreadyCompleted: boolean
  requiredCheckpointIds: string[]
  clearedBlockIds: string[]
}): { ok: true } | { ok: false; unpassedIds: string[] } {
  if (input.alreadyCompleted) return { ok: true }
  const cleared = new Set(input.clearedBlockIds)
  const unpassedIds = input.requiredCheckpointIds.filter((id) => !cleared.has(id))
  if (unpassedIds.length) return { ok: false, unpassedIds }
  return { ok: true }
}

export function authoredCheckpointsFromBody(raw: unknown): CheckpointBlock[] {
  return parseLessonBody(raw).filter((block): block is CheckpointBlock => block.type === 'checkpoint')
}
