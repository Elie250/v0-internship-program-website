/**
 * Guided open-ended marking for Talent short_text items.
 * Local heuristic can auto-award points at submit when a model answer / key points exist.
 * Optional AI may refine suggestions for HM override; AI never writes scores alone.
 */

import { completeRecruitmentAi, getRecruitmentAiConfig } from '@/lib/recruitment/ai-provider'
import type { AnswerSpec } from '@/lib/recruitment/screening-parameters'

export type GuidedMarkSuggestion = {
  suggestedPoints: number
  maxPoints: number
  suggestedStatus: 'correct' | 'partial' | 'incorrect'
  coverageRatio: number
  matchedKeyPoints: string[]
  missingKeyPoints: string[]
  rationale: string
  method: 'key_points' | 'ai_assisted' | 'heuristic'
  isAuthoritative: false
  requiresHumanConfirmation: true
}

const STOP = new Set([
  'the',
  'and',
  'for',
  'that',
  'with',
  'this',
  'from',
  'are',
  'was',
  'were',
  'been',
  'have',
  'has',
  'had',
  'not',
  'but',
  'they',
  'their',
  'them',
  'then',
  'than',
  'into',
  'onto',
  'also',
  'only',
  'just',
  'very',
  'will',
  'would',
  'could',
  'should',
  'can',
  'may',
  'might',
  'must',
  'about',
  'over',
  'under',
  'between',
  'because',
  'while',
  'where',
  'when',
  'which',
  'what',
  'who',
  'how',
  'why',
  'such',
  'each',
  'other',
  'more',
  'most',
  'some',
  'any',
  'all',
  'both',
  'few',
  'own',
  'same',
  'too',
  'out',
  'off',
  'up',
  'down',
  'in',
  'on',
  'to',
  'of',
  'a',
  'an',
  'or',
  'as',
  'by',
  'at',
  'is',
  'it',
  'be',
  'if',
  'do',
  'does',
  'did',
  'so',
  'no',
  'yes',
])

function lightStem(token: string): string {
  if (token.length <= 4) return token
  if (token.endsWith('ing') && token.length > 5) return token.slice(0, -3)
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`
  if (token.endsWith('es') && token.length > 4) return token.slice(0, -2)
  if (token.endsWith('s') && !token.endsWith('ss') && token.length > 3) return token.slice(0, -1)
  if (token.endsWith('ed') && token.length > 4) return token.slice(0, -2)
  return token
}

export function normalizeTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9.%\s-]/g, ' ')
      .split(/[\s-]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 1 && !STOP.has(t))
      .map(lightStem)
  )
}

function answerContainsPhrase(answerLower: string, phrase: string): boolean {
  const compact = (s: string) => s.replace(/\s+/g, ' ').trim()
  const a = compact(answerLower)
  const p = compact(phrase.toLowerCase())
  if (!p) return false
  if (a.includes(p)) return true
  // Allow punctuation differences: "ohm's law" vs "ohms law"
  const strip = (s: string) => s.replace(/[^a-z0-9%\s]/g, '')
  return strip(a).includes(strip(p))
}

function keyPointMatched(point: string, answerTokens: Set<string>, answerLower: string): boolean {
  const trimmed = point.trim()
  if (!trimmed) return false
  if (answerContainsPhrase(answerLower, trimmed)) return true

  const pointTokens = [...normalizeTokens(trimmed)]
  if (!pointTokens.length) return false

  const hits = pointTokens.filter((t) => answerTokens.has(t)).length
  const ratio = hits / pointTokens.length

  // Short points need near-full token hit; longer points allow partial
  if (pointTokens.length <= 2) return ratio >= 1
  if (pointTokens.length <= 4) return ratio >= 0.75
  return ratio >= 0.6
}

function tokenF1(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0
  let hits = 0
  for (const t of a) if (b.has(t)) hits += 1
  const precision = hits / a.size
  const recall = hits / b.size
  if (precision + recall === 0) return 0
  return (2 * precision * recall) / (precision + recall)
}

function statusFromCoverage(coverage: number): GuidedMarkSuggestion['suggestedStatus'] {
  if (coverage >= 0.85) return 'correct'
  if (coverage >= 0.35) return 'partial'
  return 'incorrect'
}

/** Deterministic suggestion / auto-mark from key points + optional model answer. */
export function suggestGuidedMarkFromKeyPoints(input: {
  candidateAnswer: string
  answerSpec: AnswerSpec
  maxPoints: number
}): GuidedMarkSuggestion {
  const maxPoints = Math.max(0, Number(input.maxPoints) || 0)
  const answer = input.candidateAnswer.trim()
  const answerLower = answer.toLowerCase()
  const answerTokens = normalizeTokens(answer)

  const keyPoints = (input.answerSpec.keyPoints ?? [])
    .map((p) => String(p).trim())
    .filter(Boolean)

  if (!answer) {
    return {
      suggestedPoints: 0,
      maxPoints,
      suggestedStatus: 'incorrect',
      coverageRatio: 0,
      matchedKeyPoints: [],
      missingKeyPoints: keyPoints,
      rationale: 'Empty answer.',
      method: 'heuristic',
      isAuthoritative: false,
      requiresHumanConfirmation: true,
    }
  }

  if (keyPoints.length > 0) {
    const matched: string[] = []
    const missing: string[] = []
    for (const point of keyPoints) {
      if (keyPointMatched(point, answerTokens, answerLower)) matched.push(point)
      else missing.push(point)
    }

    let coverage = matched.length / keyPoints.length

    // Soft boost when model answer also overlaps strongly
    const model = input.answerSpec.modelAnswer?.trim()
    if (model) {
      const modelTokens = normalizeTokens(model)
      const f1 = tokenF1(answerTokens, modelTokens)
      coverage = Math.min(1, coverage * 0.85 + f1 * 0.15)
    }

    // Very short answers vs many key points: cap credit
    if (answerTokens.size < Math.max(3, Math.ceil(keyPoints.length * 1.5)) && coverage > 0.5) {
      coverage = Math.min(coverage, 0.5)
    }

    const suggestedPoints = Math.round(maxPoints * coverage * 100) / 100
    return {
      suggestedPoints,
      maxPoints,
      suggestedStatus: statusFromCoverage(coverage),
      coverageRatio: Math.round(coverage * 1000) / 1000,
      matchedKeyPoints: matched,
      missingKeyPoints: missing,
      rationale:
        matched.length === 0
          ? 'No configured key points were detected in the answer.'
          : `Auto-marked from ${matched.length} of ${keyPoints.length} key points.`,
      method: 'key_points',
      isAuthoritative: false,
      requiresHumanConfirmation: true,
    }
  }

  if (input.answerSpec.modelAnswer?.trim()) {
    const modelTokens = normalizeTokens(input.answerSpec.modelAnswer)
    const f1 = tokenF1(answerTokens, modelTokens)
    // Also reward containment of distinctive model phrases (first 8 content tokens as soft check)
    const distinctive = [...modelTokens].filter((t) => t.length > 3).slice(0, 12)
    const hitDistinct = distinctive.filter((t) => answerTokens.has(t)).length
    const distinctRatio = distinctive.length ? hitDistinct / distinctive.length : 0
    const coverage = Math.min(1, f1 * 0.65 + distinctRatio * 0.35)
    const suggestedPoints = Math.round(maxPoints * coverage * 100) / 100
    return {
      suggestedPoints,
      maxPoints,
      suggestedStatus: statusFromCoverage(coverage),
      coverageRatio: Math.round(coverage * 1000) / 1000,
      matchedKeyPoints: [],
      missingKeyPoints: [],
      rationale:
        'Auto-marked from overlap with the model answer. Hiring staff can override.',
      method: 'heuristic',
      isAuthoritative: false,
      requiresHumanConfirmation: true,
    }
  }

  return {
    suggestedPoints: 0,
    maxPoints,
    suggestedStatus: 'incorrect',
    coverageRatio: 0,
    matchedKeyPoints: [],
    missingKeyPoints: [],
    rationale: 'No key points or model answer configured. Mark manually.',
    method: 'heuristic',
    isAuthoritative: false,
    requiresHumanConfirmation: true,
  }
}

/** Whether guided fields are enough to auto-mark at submit. */
export function canAutoMarkGuidedShortText(answerSpec: AnswerSpec): boolean {
  if (answerSpec.manualReview === true) return false
  return (
    Boolean(answerSpec.modelAnswer?.trim()) ||
    (Array.isArray(answerSpec.keyPoints) &&
      answerSpec.keyPoints.some((p) => String(p).trim().length > 0))
  )
}

/** Optional AI enrichment — falls back to key-point suggestion if AI unavailable. */
export async function suggestGuidedMark(input: {
  prompt: string
  candidateAnswer: string
  answerSpec: AnswerSpec
  maxPoints: number
  preferAi?: boolean
}): Promise<GuidedMarkSuggestion> {
  const baseline = suggestGuidedMarkFromKeyPoints({
    candidateAnswer: input.candidateAnswer,
    answerSpec: input.answerSpec,
    maxPoints: input.maxPoints,
  })

  const config = getRecruitmentAiConfig()
  if (!input.preferAi || !config.enabled) return baseline

  const system = `You are an assessment marking assistant for technical hiring.
You suggest a score for ONE open-ended answer using the guided model answer / key points / rubric.
You do NOT make hiring decisions. You do NOT invent facts not in the answer.
Return JSON only:
{
  "suggestedPoints": number,
  "suggestedStatus": "correct" | "partial" | "incorrect",
  "matchedKeyPoints": string[],
  "missingKeyPoints": string[],
  "rationale": string
}
suggestedPoints must be between 0 and maxPoints.`

  const user = JSON.stringify({
    maxPoints: input.maxPoints,
    question: input.prompt,
    modelAnswer: input.answerSpec.modelAnswer ?? null,
    keyPoints: input.answerSpec.keyPoints ?? [],
    markingRubric: input.answerSpec.markingRubric ?? null,
    candidateAnswer: input.candidateAnswer,
    heuristicBaseline: {
      suggestedPoints: baseline.suggestedPoints,
      coverageRatio: baseline.coverageRatio,
      matchedKeyPoints: baseline.matchedKeyPoints,
      missingKeyPoints: baseline.missingKeyPoints,
    },
  })

  const completion = await completeRecruitmentAi(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { maxTokens: 500, temperature: 0.1 }
  )

  if (!completion.ok || !completion.content) return baseline

  try {
    const parsed = JSON.parse(completion.content) as {
      suggestedPoints?: number
      suggestedStatus?: string
      matchedKeyPoints?: string[]
      missingKeyPoints?: string[]
      rationale?: string
    }
    const pts = Number(parsed.suggestedPoints)
    const clamped = Number.isFinite(pts)
      ? Math.max(0, Math.min(input.maxPoints, Math.round(pts * 100) / 100))
      : baseline.suggestedPoints
    const status =
      parsed.suggestedStatus === 'correct' ||
      parsed.suggestedStatus === 'partial' ||
      parsed.suggestedStatus === 'incorrect'
        ? parsed.suggestedStatus
        : baseline.suggestedStatus

    return {
      suggestedPoints: clamped,
      maxPoints: input.maxPoints,
      suggestedStatus: status,
      coverageRatio: baseline.coverageRatio,
      matchedKeyPoints: Array.isArray(parsed.matchedKeyPoints)
        ? parsed.matchedKeyPoints.map(String)
        : baseline.matchedKeyPoints,
      missingKeyPoints: Array.isArray(parsed.missingKeyPoints)
        ? parsed.missingKeyPoints.map(String)
        : baseline.missingKeyPoints,
      rationale:
        String(parsed.rationale || '').trim() ||
        'AI-assisted suggestion. Confirm before applying.',
      method: 'ai_assisted',
      isAuthoritative: false,
      requiresHumanConfirmation: true,
    }
  } catch {
    return baseline
  }
}

export function statusFromPoints(points: number, maxPoints: number): 'correct' | 'partial' | 'incorrect' {
  if (maxPoints <= 0) return 'incorrect'
  const ratio = points / maxPoints
  if (ratio >= 0.999) return 'correct'
  if (ratio <= 0) return 'incorrect'
  return 'partial'
}
