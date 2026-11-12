export type LessonEditorSnapshot = {
  title: string
  content_type: string
  content_url: string
  blocks: unknown
  estimated_minutes?: string
  activity_kind?: string
}

export type UnsavedNavigationChoice = 'save' | 'discard' | 'stay'

export type UnsavedNavigationDecision = {
  allow: boolean
  persist: boolean
  discard: boolean
}

export const EMPTY_LESSON_EDITOR_SNAPSHOT: LessonEditorSnapshot = {
  title: '',
  content_type: 'video',
  content_url: '',
  blocks: [],
  estimated_minutes: '',
  activity_kind: '',
}

export function isLessonEditorDirty(
  current: LessonEditorSnapshot,
  baseline: LessonEditorSnapshot
): boolean {
  return (
    current.title !== baseline.title ||
    current.content_type !== baseline.content_type ||
    current.content_url !== baseline.content_url ||
    (current.estimated_minutes ?? '') !== (baseline.estimated_minutes ?? '') ||
    (current.activity_kind ?? '') !== (baseline.activity_kind ?? '') ||
    JSON.stringify(current.blocks ?? []) !== JSON.stringify(baseline.blocks ?? [])
  )
}

export function shouldPromptUnsavedNavigation(dirty: boolean): boolean {
  return dirty
}

export function resolveUnsavedNavigation(
  choice: UnsavedNavigationChoice
): UnsavedNavigationDecision {
  if (choice === 'stay') return { allow: false, persist: false, discard: false }
  if (choice === 'discard') return { allow: true, persist: false, discard: true }
  return { allow: true, persist: true, discard: false }
}

export function snapshotAfterSuccessfulSave(current: LessonEditorSnapshot): LessonEditorSnapshot {
  return {
    title: current.title,
    content_type: current.content_type,
    content_url: current.content_url,
    blocks: current.blocks,
    estimated_minutes: current.estimated_minutes ?? '',
    activity_kind: current.activity_kind ?? '',
  }
}
