/**
 * Deterministic server-side scoring for screening session items.
 * AI must never overwrite technical_score.
 */

import type { AnswerSpec } from '@/lib/recruitment/screening-parameters'
import { resolveExpectedNumeric } from '@/lib/recruitment/screening-parameters'
import {
  canAutoMarkGuidedShortText,
  suggestGuidedMarkFromKeyPoints,
} from '@/lib/recruitment/guided-marking'

export type QuestionType = 'multiple_choice' | 'multiple_select' | 'numeric' | 'short_text'

export type ScoringStatus =
  | 'pending'
  | 'correct'
  | 'incorrect'
  | 'partial'
  | 'pending_manual'
  | 'unanswered'

export type ScoreItemResult = {
  pointsAwarded: number
  maxPoints: number
  scoringStatus: ScoringStatus
  /** Present when short_text was auto-marked from key points / model answer */
  autoMark?: {
    method: string
    rationale: string
    coverageRatio: number
    matchedKeyPoints: string[]
    missingKeyPoints: string[]
  }
}

export function scoreMultipleChoice(
  selectedOptionId: string | null | undefined,
  answerSpec: AnswerSpec,
  maxPoints: number
): ScoreItemResult {
  if (!selectedOptionId) {
    return { pointsAwarded: 0, maxPoints, scoringStatus: 'unanswered' }
  }
  const correct = answerSpec.correctOptionId
  if (!correct) {
    return { pointsAwarded: 0, maxPoints, scoringStatus: 'pending_manual' }
  }
  const ok = selectedOptionId === correct
  return {
    pointsAwarded: ok ? maxPoints : 0,
    maxPoints,
    scoringStatus: ok ? 'correct' : 'incorrect',
  }
}

export function scoreMultipleSelect(
  selectedOptionIds: string[] | null | undefined,
  answerSpec: AnswerSpec,
  maxPoints: number
): ScoreItemResult {
  const selected = Array.isArray(selectedOptionIds) ? [...selectedOptionIds].sort() : []
  const correct = Array.isArray(answerSpec.correctOptionIds)
    ? [...answerSpec.correctOptionIds].sort()
    : []
  if (!selected.length) {
    return { pointsAwarded: 0, maxPoints, scoringStatus: 'unanswered' }
  }
  if (!correct.length) {
    return { pointsAwarded: 0, maxPoints, scoringStatus: 'pending_manual' }
  }
  const selectedSet = new Set(selected)
  const correctSet = new Set(correct)
  let hits = 0
  for (const id of correctSet) if (selectedSet.has(id)) hits++
  let extras = 0
  for (const id of selectedSet) if (!correctSet.has(id)) extras++

  if (hits === correctSet.size && extras === 0) {
    return { pointsAwarded: maxPoints, maxPoints, scoringStatus: 'correct' }
  }
  if (hits === 0) {
    return { pointsAwarded: 0, maxPoints, scoringStatus: 'incorrect' }
  }
  const ratio = Math.max(0, (hits - extras) / correctSet.size)
  const points = Math.round(maxPoints * ratio * 1000) / 1000
  return {
    pointsAwarded: Math.max(0, points),
    maxPoints,
    scoringStatus: points > 0 ? 'partial' : 'incorrect',
  }
}

export function scoreNumeric(
  submitted: number | null | undefined,
  answerSpec: AnswerSpec,
  params: Record<string, number>,
  maxPoints: number,
  expectedSnapshot?: { value: number; tolerance: number } | null
): ScoreItemResult {
  if (submitted == null || !Number.isFinite(submitted)) {
    return { pointsAwarded: 0, maxPoints, scoringStatus: 'unanswered' }
  }
  const expected =
    expectedSnapshot ?? resolveExpectedNumeric(answerSpec, params)
  if (!expected) {
    return { pointsAwarded: 0, maxPoints, scoringStatus: 'pending_manual' }
  }
  const ok = Math.abs(submitted - expected.value) <= expected.tolerance + Number.EPSILON
  return {
    pointsAwarded: ok ? maxPoints : 0,
    maxPoints,
    scoringStatus: ok ? 'correct' : 'incorrect',
  }
}

export function scoreShortText(
  submitted: string | null | undefined,
  answerSpec: AnswerSpec,
  maxPoints: number
): ScoreItemResult {
  const text = submitted?.trim() ?? ''
  if (!text) {
    return { pointsAwarded: 0, maxPoints, scoringStatus: 'unanswered' }
  }

  // Exact accepted answers still win full marks when provided
  if (answerSpec.acceptedAnswers?.length) {
    const normalized = text.toLowerCase()
    const ok = answerSpec.acceptedAnswers.some((a) => a.trim().toLowerCase() === normalized)
    if (ok) {
      return {
        pointsAwarded: maxPoints,
        maxPoints,
        scoringStatus: 'correct',
      }
    }
    // Exact list only (no guided guide) → miss is incorrect
    if (!canAutoMarkGuidedShortText(answerSpec) && answerSpec.manualReview !== true) {
      return { pointsAwarded: 0, maxPoints, scoringStatus: 'incorrect' }
    }
  }

  // Explicit opt-out: human marks only
  if (answerSpec.manualReview === true) {
    return { pointsAwarded: 0, maxPoints, scoringStatus: 'pending_manual' }
  }

  // Guided open-ended: auto-mark from local heuristic so sessions finish with a score
  if (canAutoMarkGuidedShortText(answerSpec)) {
    const suggestion = suggestGuidedMarkFromKeyPoints({
      candidateAnswer: text,
      answerSpec,
      maxPoints,
    })
    return {
      pointsAwarded: suggestion.suggestedPoints,
      maxPoints,
      scoringStatus: suggestion.suggestedStatus,
      autoMark: {
        method: suggestion.method,
        rationale: suggestion.rationale,
        coverageRatio: suggestion.coverageRatio,
        matchedKeyPoints: suggestion.matchedKeyPoints,
        missingKeyPoints: suggestion.missingKeyPoints,
      },
    }
  }

  return { pointsAwarded: 0, maxPoints, scoringStatus: 'pending_manual' }
}

export function scoreAnswer(input: {
  questionType: QuestionType
  answerPayload: Record<string, unknown>
  answerSpec: AnswerSpec
  params: Record<string, number>
  maxPoints: number
  expectedSnapshot?: { value: number; tolerance: number } | null
}): ScoreItemResult {
  const { questionType, answerPayload, answerSpec, params, maxPoints, expectedSnapshot } = input
  switch (questionType) {
    case 'multiple_choice':
      return scoreMultipleChoice(
        typeof answerPayload.optionId === 'string' ? answerPayload.optionId : null,
        answerSpec,
        maxPoints
      )
    case 'multiple_select':
      return scoreMultipleSelect(
        Array.isArray(answerPayload.optionIds) ? answerPayload.optionIds.map(String) : [],
        answerSpec,
        maxPoints
      )
    case 'numeric':
      return scoreNumeric(
        typeof answerPayload.value === 'number'
          ? answerPayload.value
          : answerPayload.value != null
            ? Number(answerPayload.value)
            : null,
        answerSpec,
        params,
        maxPoints,
        expectedSnapshot
      )
    case 'short_text':
      return scoreShortText(
        typeof answerPayload.text === 'string' ? answerPayload.text : null,
        answerSpec,
        maxPoints
      )
    default:
      return { pointsAwarded: 0, maxPoints, scoringStatus: 'pending_manual' }
  }
}

export type SectionScores = Record<string, { earned: number; max: number; percent: number }>

export function computeOverallAndSections(
  items: Array<{
    section: string | null
    pointsAwarded: number | null
    maxPoints: number
    scoringStatus: ScoringStatus
  }>
): {
  technicalScore: number
  maxScore: number
  percent: number
  sectionScores: SectionScores
  hasPendingManual: boolean
  answeredCount: number
} {
  let earned = 0
  let max = 0
  let hasPendingManual = false
  let answeredCount = 0
  const sections: Record<string, { earned: number; max: number }> = {}

  for (const item of items) {
    max += item.maxPoints
    const pts = item.pointsAwarded ?? 0
    if (item.scoringStatus !== 'unanswered' && item.scoringStatus !== 'pending') {
      answeredCount++
    }
    if (item.scoringStatus === 'pending_manual') hasPendingManual = true
    else earned += pts

    const section = item.section?.trim() || 'General'
    if (!sections[section]) sections[section] = { earned: 0, max: 0 }
    sections[section].max += item.maxPoints
    if (item.scoringStatus !== 'pending_manual') {
      sections[section].earned += pts
    }
  }

  const sectionScores: SectionScores = {}
  for (const [name, s] of Object.entries(sections)) {
    sectionScores[name] = {
      earned: s.earned,
      max: s.max,
      percent: s.max > 0 ? Math.round((s.earned / s.max) * 10000) / 100 : 0,
    }
  }

  const percent = max > 0 ? Math.round((earned / max) * 10000) / 100 : 0
  return {
    technicalScore: earned,
    maxScore: max,
    percent,
    sectionScores,
    hasPendingManual,
    answeredCount,
  }
}

export function evaluatePassCriteria(input: {
  percent: number
  sectionScores: SectionScores
  passingScore: number | null
  sectionMinimums: Record<string, number>
}): boolean {
  if (input.passingScore != null && input.percent < input.passingScore) return false
  for (const [section, min] of Object.entries(input.sectionMinimums)) {
    const score = input.sectionScores[section]
    if (!score || score.percent < min) return false
  }
  return true
}

export function maxAttemptsFromPolicy(policy: string, explicitMax?: number | null): number {
  if (explicitMax != null && explicitMax > 0) return explicitMax
  if (policy === 'unlimited') return 100
  if (policy === 'retry_once') return 2
  return 1
}
