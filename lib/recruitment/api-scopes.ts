/**
 * External Recruitment API scopes (least privilege).
 */

export const RECRUITMENT_API_SCOPES = [
  'jobs:read',
  'jobs:write',
  'applications:read',
  'applications:write',
  'candidates:read',
  'documents:read',
  'screening:read',
  'interviews:read',
  'interviews:write',
  'notes:read',
  'webhooks:manage',
] as const

export type RecruitmentApiScope = (typeof RECRUITMENT_API_SCOPES)[number]

export function isRecruitmentApiScope(value: string): value is RecruitmentApiScope {
  return (RECRUITMENT_API_SCOPES as readonly string[]).includes(value)
}

export function normalizeScopes(input: unknown): RecruitmentApiScope[] {
  if (!Array.isArray(input)) return []
  const out: RecruitmentApiScope[] = []
  for (const item of input) {
    const s = String(item)
    if (isRecruitmentApiScope(s) && !out.includes(s)) out.push(s)
  }
  return out
}

export function hasScope(
  granted: readonly string[] | null | undefined,
  required: RecruitmentApiScope
): boolean {
  if (!granted) return false
  return granted.includes(required)
}

export function hasAnyScope(
  granted: readonly string[] | null | undefined,
  required: readonly RecruitmentApiScope[]
): boolean {
  return required.some((scope) => hasScope(granted, scope))
}

/** Default scopes for a new org integration credential (read-heavy). */
export const DEFAULT_INTEGRATION_SCOPES: RecruitmentApiScope[] = [
  'jobs:read',
  'applications:read',
  'candidates:read',
  'screening:read',
  'interviews:read',
]
