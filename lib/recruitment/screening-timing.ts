/** Suggested time per question from total duration / question count. */
export function secondsPerQuestionFromDuration(
  durationMinutes: number | null | undefined,
  questionCount: number | null | undefined
): number | null {
  const minutes = Number(durationMinutes)
  const count = Number(questionCount)
  if (!Number.isFinite(minutes) || minutes <= 0) return null
  if (!Number.isFinite(count) || count < 1) return null
  return Math.max(1, Math.round((minutes * 60) / count))
}

export function formatPerQuestionTime(seconds: number | null | undefined) {
  const value = Number(seconds)
  if (!Number.isFinite(value) || value <= 0) return null
  const total = Math.round(value)
  if (total < 60) return `${total} sec`
  const minutes = Math.floor(total / 60)
  const remainder = total % 60
  if (remainder === 0) return `${minutes} min`
  return `${minutes} min ${remainder} sec`
}
