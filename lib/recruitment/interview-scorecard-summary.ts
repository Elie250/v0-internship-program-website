import { DEFAULT_INTERVIEW_CRITERIA } from '@/lib/recruitment/interview-constants'
import {
  averageScores,
  formatRecommendationLabel,
} from '@/lib/recruitment/employer-report-branding'
import type { InterviewResultMark } from '@/lib/recruitment/interview-stage-report-types'

export type ScorecardSource = {
  criteria_scores?: unknown
  overall_rating?: unknown
  recommendation?: unknown
  feedback?: unknown
  status?: unknown
}

export type SubmittedScorecardSummary = {
  criteriaMarks: InterviewResultMark[]
  marksLabel: string
  overallRating: number | null
  overallLabel: string
  recommendation: string | null
  recommendationLabel: string
  scorecardCount: number
  feedback: string | null
  criteria: string[]
}

function asScore(value: unknown): number | null {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 1 || n > 5) return null
  return Math.round(n * 10) / 10
}

export function collectCriteriaKeys(sources: ScorecardSource[]): string[] {
  const keys = new Set<string>(DEFAULT_INTERVIEW_CRITERIA)
  for (const source of sources) {
    const scores =
      source.criteria_scores && typeof source.criteria_scores === 'object'
        ? (source.criteria_scores as Record<string, unknown>)
        : {}
    for (const key of Object.keys(scores)) {
      if (key.trim()) keys.add(key.trim())
    }
  }
  return Array.from(keys)
}

export function summarizeSubmittedScorecards(sources: ScorecardSource[]): SubmittedScorecardSummary {
  const submitted = sources.filter((row) => String(row.status || '') === 'submitted')
  const criteria = collectCriteriaKeys(submitted.length ? submitted : sources)
  const criteriaMarks: InterviewResultMark[] = criteria.map((criterion) => {
    const values = submitted
      .map((row) => {
        const scores =
          row.criteria_scores && typeof row.criteria_scores === 'object'
            ? (row.criteria_scores as Record<string, unknown>)
            : {}
        return asScore(scores[criterion])
      })
      .filter((n): n is number => n != null)
    return { criterion, score: averageScores(values) }
  })

  const overallValues = submitted
    .map((row) => asScore(row.overall_rating))
    .filter((n): n is number => n != null)
  const criteriaAverages = criteriaMarks
    .map((mark) => mark.score)
    .filter((n): n is number => n != null)
  const overallRating = averageScores(overallValues) ?? averageScores(criteriaAverages)

  const recommendations = submitted
    .map((row) => String(row.recommendation || '').trim())
    .filter(Boolean)
  const recommendation = recommendations[0] || null
  const uniqueRecs = Array.from(new Set(recommendations))
  const recommendationLabel =
    uniqueRecs.length > 1
      ? uniqueRecs.map((value) => formatRecommendationLabel(value)).join(', ')
      : formatRecommendationLabel(recommendation)

  const feedback = submitted
    .map((row) => String(row.feedback || '').trim())
    .filter(Boolean)
    .join('\n')

  const marksLabel =
    submitted.length === 0
      ? 'No submitted interview marks'
      : criteriaMarks
          .filter((mark) => mark.score != null)
          .map((mark) => `${mark.criterion} ${mark.score}/5`)
          .join(' · ') || 'Scorecard submitted without criterion marks'

  return {
    criteriaMarks,
    marksLabel,
    overallRating,
    overallLabel: overallRating != null ? `${overallRating}/5` : '—',
    recommendation,
    recommendationLabel,
    scorecardCount: submitted.length,
    feedback: feedback || null,
    criteria,
  }
}
