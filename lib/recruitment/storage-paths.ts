/**
 * Object-storage key namespace for recruitment documents (Phase 1 foundation only).
 * Candidate-owned vs organization-owned paths stay separate for future signed URLs.
 */
export function recruitmentCandidateCvObjectKey(
  candidateUserId: string,
  filename: string
): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
  return `recruitment/candidates/${candidateUserId}/cv/${Date.now()}-${safe}`
}

export function recruitmentCandidateObjectKey(
  candidateUserId: string,
  filename: string
): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
  return `recruitment/candidates/${candidateUserId}/${Date.now()}-${safe}`
}

export function recruitmentOrganizationObjectKey(
  organizationId: string,
  filename: string
): string {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
  return `recruitment/organizations/${organizationId}/${Date.now()}-${safe}`
}
