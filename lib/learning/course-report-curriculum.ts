import {
  isMissingLessonSchemaColumn,
  isPublishedLessonVisibility,
} from './lesson-visibility.ts'

export type ReportCurriculumFallback = 'retry-without-module' | 'empty' | 'throw'

/**
 * A missing module column can be retried while visibility is still selected.
 * Any failure that would drop the visibility column returns an empty curriculum.
 */
export function planReportCurriculumFallback(message: string | undefined): ReportCurriculumFallback {
  const msg = message ?? ''
  if (/relation .* does not exist|could not find the table/i.test(msg) && !/\bcolumn\b/i.test(msg)) {
    return 'empty'
  }

  const visibility = /\bvisibility\b/i.test(msg)
  const moduleId = /\bmodule_id\b/i.test(msg)
  const missingColumn = isMissingLessonSchemaColumn(msg)

  if (visibility) return 'empty'
  if (moduleId && missingColumn) return 'retry-without-module'
  if (missingColumn || /schema cache/i.test(msg)) return 'empty'
  return 'throw'
}

/**
 * Published titles only. Rows that do not carry a visibility field are dropped
 * entirely so a missing column cannot be treated as "published".
 * Null or blank visibility stays published, matching pre-migration lessons.
 */
export function selectPublishedReportLessons<T extends object>(rows: T[]): T[] {
  if (rows.length === 0) return []
  if (rows.some((row) => !Object.prototype.hasOwnProperty.call(row, 'visibility'))) return []
  return rows.filter((row) => isPublishedLessonVisibility((row as { visibility?: unknown }).visibility))
}
