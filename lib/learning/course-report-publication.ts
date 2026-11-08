export const REPORT_PUBLICATION_STATUSES = ['draft', 'published'] as const
export type ReportPublicationStatus = (typeof REPORT_PUBLICATION_STATUSES)[number]

export const MAX_REPORT_FIELD_LENGTH = 8000

export const REPORT_PROFILE_FIELDS = [
  {
    key: 'overview',
    column: 'overview',
    label: 'Programme overview',
    section: 'Programme overview',
    requiredToPublish: true,
  },
  {
    key: 'purpose',
    column: 'purpose',
    label: 'Programme purpose',
    section: 'Programme overview',
    requiredToPublish: true,
  },
  {
    key: 'targetAudience',
    column: 'target_audience',
    label: 'Target audience',
    section: 'Audience and entry',
    requiredToPublish: false,
  },
  {
    key: 'entryRequirements',
    column: 'entry_requirements',
    label: 'Entry requirements',
    section: 'Audience and entry',
    requiredToPublish: false,
  },
  {
    key: 'learningObjectives',
    column: 'learning_objectives',
    label: 'Learning objectives',
    section: 'Objectives and outcomes',
    requiredToPublish: true,
  },
  {
    key: 'learningOutcomes',
    column: 'learning_outcomes',
    label: 'Learning outcomes',
    section: 'Objectives and outcomes',
    requiredToPublish: true,
  },
  {
    key: 'deliveryMethod',
    column: 'delivery_method',
    label: 'Delivery method',
    section: 'Delivery and workload',
    requiredToPublish: false,
  },
  {
    key: 'workloadDescription',
    column: 'workload_description',
    label: 'Workload description',
    section: 'Delivery and workload',
    requiredToPublish: false,
  },
  {
    key: 'assessmentDescription',
    column: 'assessment_description',
    label: 'Assessment description',
    section: 'Assessment and certification',
    requiredToPublish: false,
  },
  {
    key: 'certificationDescription',
    column: 'certification_description',
    label: 'Certification description',
    section: 'Assessment and certification',
    requiredToPublish: false,
  },
  {
    key: 'additionalInformation',
    column: 'additional_information',
    label: 'Additional information',
    section: 'Additional information',
    requiredToPublish: false,
  },
] as const

export type ReportProfileFieldKey = (typeof REPORT_PROFILE_FIELDS)[number]['key']

export type EditorialReportProfile = Record<ReportProfileFieldKey, string | null>

export function emptyEditorialReportProfile(): EditorialReportProfile {
  return {
    overview: null,
    purpose: null,
    targetAudience: null,
    entryRequirements: null,
    learningObjectives: null,
    learningOutcomes: null,
    deliveryMethod: null,
    workloadDescription: null,
    assessmentDescription: null,
    certificationDescription: null,
    additionalInformation: null,
  }
}

export function readPublicationStatus(value: unknown): ReportPublicationStatus {
  return value === 'published' ? 'published' : 'draft'
}

export function normalizeReportField(value: unknown): string | null {
  const text = String(value ?? '').replace(/\r\n/g, '\n').trim()
  return text ? text : null
}

/**
 * A save must include every editorial field. Omitted keys are rejected so a
 * partial payload cannot clear stored copy. An explicit empty string clears that field.
 */
export function reportProfilePatch(
  input: object
): { ok: true; patch: Record<string, string | null>; profile: EditorialReportProfile } | { ok: false; error: string } {
  const source = input as Record<string, unknown>
  const patch: Record<string, string | null> = {}
  const profile = emptyEditorialReportProfile()

  for (const field of REPORT_PROFILE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(source, field.key)) {
      return { ok: false, error: `Missing ${field.label}. Reload the report before saving.` }
    }
    const value = source[field.key]
    if (value != null && typeof value !== 'string') {
      return { ok: false, error: `${field.label} must be text.` }
    }
    const normalized = normalizeReportField(value)
    if (normalized && normalized.length > MAX_REPORT_FIELD_LENGTH) {
      return { ok: false, error: `${field.label} is too long.` }
    }
    patch[field.column] = normalized
    profile[field.key] = normalized
  }

  return { ok: true, patch, profile }
}

export function editorialProfileFromRow(row: Record<string, unknown> | null): EditorialReportProfile {
  const profile = emptyEditorialReportProfile()
  if (!row) return profile
  for (const field of REPORT_PROFILE_FIELDS) {
    profile[field.key] = normalizeReportField(row[field.column])
  }
  return profile
}

/** Students only receive editorial copy after an administrator publishes it. */
export function studentVisibleEditorialProfile(
  row: Record<string, unknown> | null
): EditorialReportProfile | null {
  if (!row) return null
  if (readPublicationStatus(row.publication_status) !== 'published') return null
  return editorialProfileFromRow(row)
}

export function missingRequiredPublishFields(profile: EditorialReportProfile): string[] {
  return REPORT_PROFILE_FIELDS.filter(
    (field) => field.requiredToPublish && !normalizeReportField(profile[field.key])
  ).map((field) => field.label)
}

export function reportFieldCompletion(profile: EditorialReportProfile): { filled: number; total: number } {
  const total = REPORT_PROFILE_FIELDS.length
  const filled = REPORT_PROFILE_FIELDS.filter((field) => Boolean(profile[field.key])).length
  return { filled, total }
}

export function decideReportPublication(
  profile: EditorialReportProfile,
  requested: ReportPublicationStatus
): { ok: true; status: ReportPublicationStatus } | { ok: false; missing: string[] } {
  if (requested === 'draft') return { ok: true, status: 'draft' }
  const missing = missingRequiredPublishFields(profile)
  if (missing.length > 0) return { ok: false, missing }
  return { ok: true, status: 'published' }
}
