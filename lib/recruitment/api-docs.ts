/**
 * Machine-readable Recruitment External API documentation foundation.
 */

import { RECRUITMENT_API_SCOPES } from '@/lib/recruitment/api-scopes'
import { WEBHOOK_EVENT_TYPES } from '@/lib/recruitment/api-webhooks'
import { API_CREDENTIAL_PER_MINUTE, API_ORG_PER_HOUR } from '@/lib/recruitment/api-rate-limit'

export const RECRUITMENT_API_DOCS = {
  version: 'v1',
  basePath: '/api/v1/recruitment',
  authentication: {
    type: 'http',
    scheme: 'bearer',
    format: 'Bearer <key_id>:<secret>',
    notes: [
      'Do not use browser session cookies for the external API.',
      'Secrets are shown once at create/rotate and stored hashed only.',
      'Organization is resolved from the credential server-side — never send organization_id as authority.',
    ],
  },
  scopes: RECRUITMENT_API_SCOPES,
  rateLimits: {
    perCredentialPerMinute: API_CREDENTIAL_PER_MINUTE,
    perOrganizationPerHour: API_ORG_PER_HOUR,
    responseOnExceed: 429,
  },
  pagination: {
    style: 'limit_offset',
    defaultLimit: 50,
    maxLimit: 100,
    params: ['limit', 'offset'],
  },
  webhookEvents: WEBHOOK_EVENT_TYPES,
  webhookSignatures: {
    headers: [
      'X-EL-Webhook-Id',
      'X-EL-Webhook-Timestamp',
      'X-EL-Webhook-Signature',
    ],
    algorithm: 'HMAC-SHA256',
    signedPayload: '{timestamp}.{raw_body}',
    signaturePrefix: 'sha256=',
    replayToleranceSeconds: 300,
  },
  endpoints: [
    {
      method: 'GET',
      path: '/jobs',
      scopes: ['jobs:read'],
      summary: 'List jobs for the credential organization',
    },
    {
      method: 'GET',
      path: '/jobs/{id}',
      scopes: ['jobs:read'],
      summary: 'Get a job by id',
    },
    {
      method: 'POST',
      path: '/jobs',
      scopes: ['jobs:write'],
      summary: 'Create a job',
    },
    {
      method: 'PATCH',
      path: '/jobs/{id}',
      scopes: ['jobs:write'],
      summary: 'Update a job (including publish/close via status)',
    },
    {
      method: 'GET',
      path: '/applications',
      scopes: ['applications:read'],
      summary: 'List applications',
    },
    {
      method: 'GET',
      path: '/applications/{id}',
      scopes: ['applications:read'],
      summary: 'Get application + candidate profile snapshot',
    },
    {
      method: 'PATCH',
      path: '/applications/{id}',
      scopes: ['applications:write'],
      summary: 'Update application status (pipeline rules enforced)',
    },
    {
      method: 'GET',
      path: '/applications/{id}/cv',
      scopes: ['documents:read'],
      summary: 'Issue a short-lived signed CV URL',
    },
    {
      method: 'GET',
      path: '/applications/{id}/screening',
      scopes: ['screening:read'],
      summary: 'Get screening results (no answer keys)',
    },
    {
      method: 'GET',
      path: '/interviews',
      scopes: ['interviews:read'],
      summary: 'List interviews',
    },
    {
      method: 'POST',
      path: '/interviews',
      scopes: ['interviews:write'],
      summary: 'Create an interview invitation',
    },
    {
      method: 'GET',
      path: '/openapi',
      scopes: [],
      summary: 'This documentation document (requires any valid credential)',
    },
  ],
  errors: [
    { status: 401, code: 'unauthorized' },
    { status: 403, code: 'insufficient_scope' },
    { status: 403, code: 'forbidden' },
    { status: 404, code: 'not_found' },
    { status: 429, code: 'rate_limited' },
    { status: 400, code: 'validation_error' },
  ],
} as const

export function renderRecruitmentApiMarkdown(): string {
  const d = RECRUITMENT_API_DOCS
  const lines: string[] = [
    `# Energy & Logics Recruitment API (${d.version})`,
    '',
    `Base path: \`${d.basePath}\``,
    '',
    '## Authentication',
    '',
    `\`${d.authentication.format}\``,
    '',
    ...d.authentication.notes.map((n) => `- ${n}`),
    '',
    '## Scopes',
    '',
    ...d.scopes.map((s) => `- \`${s}\``),
    '',
    '## Rate limits',
    '',
    `- ${d.rateLimits.perCredentialPerMinute} requests / minute / credential`,
    `- ${d.rateLimits.perOrganizationPerHour} requests / hour / organization`,
    `- Exceeding limits returns HTTP ${d.rateLimits.responseOnExceed}`,
    '',
    '## Pagination',
    '',
    `Query params: \`${d.pagination.params.join('`, `')}\` (default ${d.pagination.defaultLimit}, max ${d.pagination.maxLimit})`,
    '',
    '## Endpoints',
    '',
  ]
  for (const ep of d.endpoints) {
    lines.push(`### ${ep.method} ${d.basePath}${ep.path}`)
    lines.push('')
    lines.push(ep.summary)
    lines.push('')
    lines.push(
      ep.scopes.length
        ? `Required scopes: ${ep.scopes.map((s) => `\`${s}\``).join(', ')}`
        : 'Requires a valid credential.'
    )
    lines.push('')
  }
  lines.push('## Webhooks')
  lines.push('')
  lines.push('Events:')
  for (const e of d.webhookEvents) lines.push(`- \`${e}\``)
  lines.push('')
  lines.push('Signature:')
  lines.push(`- Headers: ${d.webhookSignatures.headers.map((h) => `\`${h}\``).join(', ')}`)
  lines.push(`- Signed payload: \`${d.webhookSignatures.signedPayload}\``)
  lines.push(`- Header value: \`${d.webhookSignatures.signaturePrefix}<hex>\``)
  lines.push('')
  lines.push('## Errors')
  lines.push('')
  for (const e of d.errors) lines.push(`- HTTP ${e.status}: \`${e.code}\``)
  lines.push('')
  return lines.join('\n')
}
