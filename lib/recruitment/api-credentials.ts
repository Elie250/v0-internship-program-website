/**
 * Organization API credentials — secrets hashed, never stored plaintext.
 */

import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { writeRecruitmentAudit } from '@/lib/recruitment/audit'
import {
  DEFAULT_INTEGRATION_SCOPES,
  normalizeScopes,
  type RecruitmentApiScope,
} from '@/lib/recruitment/api-scopes'

const CREDENTIAL_SELECT =
  'id, organization_id, name, key_id, secret_hash, secret_prefix, scopes, status, access_mode, created_by, last_used_at, revoked_at, expires_at, created_at, updated_at'

export type ApiCredentialRow = {
  id: string
  organization_id: string
  name: string
  key_id: string
  secret_hash: string
  secret_prefix: string
  scopes: string[]
  status: 'active' | 'inactive' | 'revoked'
  access_mode: 'organization' | 'restricted'
  created_by: string | null
  last_used_at: string | null
  revoked_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export function hashApiSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex')
}

export function generateApiKeyPair(): { keyId: string; secret: string; prefix: string } {
  const keyId = `rk_${crypto.randomBytes(12).toString('hex')}`
  const secret = `rks_${crypto.randomBytes(24).toString('hex')}`
  return { keyId, secret, prefix: secret.slice(0, 10) }
}

/** Parse Authorization: Bearer <keyId>:<secret> */
export function parseBearerCredential(header: string | null): {
  keyId: string
  secret: string
} | null {
  if (!header) return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) return null
  const token = match[1]!.trim()
  const idx = token.indexOf(':')
  if (idx <= 0) return null
  const keyId = token.slice(0, idx).trim()
  const secret = token.slice(idx + 1).trim()
  if (!keyId.startsWith('rk_') || !secret.startsWith('rks_')) return null
  return { keyId, secret }
}

function sanitizeCredential(row: ApiCredentialRow) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    keyId: row.key_id,
    secretPrefix: row.secret_prefix,
    scopes: Array.isArray(row.scopes) ? row.scopes : [],
    status: row.status,
    accessMode: row.access_mode,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listApiCredentials(organizationId: string) {
  if (!supabaseAdmin) return { credentials: [], error: 'Database not configured' }
  const { data, error } = await supabaseAdmin
    .from('recruitment_api_credentials')
    .select(CREDENTIAL_SELECT)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) return { credentials: [], error: error.message }
  return {
    credentials: (data ?? []).map((row) => sanitizeCredential(row as ApiCredentialRow)),
  }
}

export async function createApiCredential(input: {
  organizationId: string
  name: string
  scopes?: unknown
  accessMode?: 'organization' | 'restricted'
  jobIds?: string[]
  actorUserId: string
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  const name = input.name.trim()
  if (!name) return { error: 'Name is required' }

  const scopes = normalizeScopes(input.scopes ?? DEFAULT_INTEGRATION_SCOPES)
  if (scopes.length === 0) return { error: 'At least one scope is required' }

  const accessMode = input.accessMode === 'restricted' ? 'restricted' : 'organization'
  const { keyId, secret, prefix } = generateApiKeyPair()
  const now = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('recruitment_api_credentials')
    .insert([
      {
        organization_id: input.organizationId,
        name,
        key_id: keyId,
        secret_hash: hashApiSecret(secret),
        secret_prefix: prefix,
        scopes,
        status: 'active',
        access_mode: accessMode,
        created_by: input.actorUserId,
        created_at: now,
        updated_at: now,
      },
    ])
    .select(CREDENTIAL_SELECT)
    .single()

  if (error) return { error: error.message }
  const row = data as ApiCredentialRow

  if (accessMode === 'restricted' && input.jobIds?.length) {
    const uniqueJobs = [...new Set(input.jobIds.map(String))]
    for (const jobId of uniqueJobs) {
      const { data: job } = await supabaseAdmin
        .from('recruitment_jobs')
        .select('id')
        .eq('id', jobId)
        .eq('organization_id', input.organizationId)
        .maybeSingle()
      if (!job) continue
      await supabaseAdmin.from('recruitment_api_credential_jobs').insert([
        {
          credential_id: row.id,
          organization_id: input.organizationId,
          job_id: jobId,
        },
      ])
    }
  }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: 'api_credential_created',
    entityType: 'recruitment_api_credentials',
    entityId: row.id,
    metadata: { keyId, scopes, accessMode },
  })

  return {
    credential: sanitizeCredential(row),
    // Shown once — never stored plaintext
    secret,
    authorizationHint: `Bearer ${keyId}:${secret}`,
  }
}

export async function rotateApiCredential(input: {
  organizationId: string
  credentialId: string
  actorUserId: string
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  const { data: existing } = await supabaseAdmin
    .from('recruitment_api_credentials')
    .select(CREDENTIAL_SELECT)
    .eq('id', input.credentialId)
    .eq('organization_id', input.organizationId)
    .maybeSingle()
  if (!existing) return { error: 'Credential not found' }
  if (existing.status === 'revoked') return { error: 'Cannot rotate a revoked credential' }

  const { secret, prefix } = generateApiKeyPair()
  const now = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from('recruitment_api_credentials')
    .update({
      secret_hash: hashApiSecret(secret),
      secret_prefix: prefix,
      updated_at: now,
      status: 'active',
    })
    .eq('id', input.credentialId)
    .eq('organization_id', input.organizationId)
    .select(CREDENTIAL_SELECT)
    .single()

  if (error) return { error: error.message }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: 'api_credential_rotated',
    entityType: 'recruitment_api_credentials',
    entityId: input.credentialId,
    metadata: { keyId: data.key_id },
  })

  return {
    credential: sanitizeCredential(data as ApiCredentialRow),
    secret,
    authorizationHint: `Bearer ${data.key_id}:${secret}`,
  }
}

export async function setApiCredentialStatus(input: {
  organizationId: string
  credentialId: string
  status: 'active' | 'inactive' | 'revoked'
  actorUserId: string
}) {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  const now = new Date().toISOString()
  const updates: Record<string, unknown> = {
    status: input.status,
    updated_at: now,
  }
  if (input.status === 'revoked') updates.revoked_at = now

  const { data, error } = await supabaseAdmin
    .from('recruitment_api_credentials')
    .update(updates)
    .eq('id', input.credentialId)
    .eq('organization_id', input.organizationId)
    .select(CREDENTIAL_SELECT)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Credential not found' }

  await writeRecruitmentAudit({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action:
      input.status === 'revoked'
        ? 'api_credential_revoked'
        : 'api_credential_status_changed',
    entityType: 'recruitment_api_credentials',
    entityId: input.credentialId,
    metadata: { status: input.status },
  })

  return { credential: sanitizeCredential(data as ApiCredentialRow) }
}

export async function authenticateApiCredential(
  keyId: string,
  secret: string
): Promise<{ credential: ApiCredentialRow; jobIds: string[] | null } | { error: string }> {
  if (!supabaseAdmin) return { error: 'Database not configured' }
  const { data } = await supabaseAdmin
    .from('recruitment_api_credentials')
    .select(CREDENTIAL_SELECT)
    .eq('key_id', keyId)
    .maybeSingle()

  if (!data) return { error: 'Invalid credentials' }
  const row = data as ApiCredentialRow
  if (row.status !== 'active') return { error: 'Credential is not active' }
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { error: 'Credential expired' }
  }

  const expected = hashApiSecret(secret)
  const a = Buffer.from(expected)
  const b = Buffer.from(row.secret_hash)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { error: 'Invalid credentials' }
  }

  let jobIds: string[] | null = null
  if (row.access_mode === 'restricted') {
    const { data: jobs } = await supabaseAdmin
      .from('recruitment_api_credential_jobs')
      .select('job_id')
      .eq('credential_id', row.id)
      .eq('organization_id', row.organization_id)
    jobIds = (jobs ?? []).map((j) => String(j.job_id))
  }

  // Touch last_used_at (best-effort)
  void supabaseAdmin
    .from('recruitment_api_credentials')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', row.id)

  return {
    credential: {
      ...row,
      scopes: Array.isArray(row.scopes) ? row.scopes : [],
    },
    jobIds,
  }
}

export type AuthenticatedApiCredential = {
  credentialId: string
  organizationId: string
  scopes: RecruitmentApiScope[]
  accessMode: 'organization' | 'restricted'
  /** null = org-wide; empty/array = restricted job allow-list */
  jobIds: string[] | null
  keyId: string
}
