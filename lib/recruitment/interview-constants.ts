/** Shared interview scorecard defaults (safe for client + server). */

export const DEFAULT_INTERVIEW_CRITERIA = [
  'Technical Knowledge',
  'Problem Solving',
  'Communication',
  'Practical Experience',
  'Role Fit',
] as const

export type DefaultInterviewCriterion = (typeof DEFAULT_INTERVIEW_CRITERIA)[number]
