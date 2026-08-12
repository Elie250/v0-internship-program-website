/**
 * External API request audit (never logs secrets / CV contents / answer keys).
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { hashClientIp } from '@/lib/recruitment/auth-rate-limit'

export async function writeApiAuditLog(input: {
  organizationId?: string | null
  credentialId?: string | null
  requestId: string
  method: string
  path: string
  statusCode: number
  success: boolean
  resourceType?: string | null
  resourceId?: string | null
  errorCode?: string | null
  clientIp?: string | null
}): Promise<void> {
  if (!supabaseAdmin) return
  await supabaseAdmin.from('recruitment_api_audit_logs').insert([
    {
      organization_id: input.organizationId ?? null,
      credential_id: input.credentialId ?? null,
      request_id: input.requestId,
      method: input.method,
      path: input.path.slice(0, 500),
      status_code: input.statusCode,
      success: input.success,
      resource_type: input.resourceType ?? null,
      resource_id: input.resourceId ?? null,
      error_code: input.errorCode ?? null,
      ip_hash: input.clientIp ? hashClientIp(input.clientIp) : null,
    },
  ])
}

export function createRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}
