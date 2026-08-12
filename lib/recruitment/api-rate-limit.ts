/**
 * External API rate limiting (per credential + per organization).
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin'

/** Default: 60 requests / minute per credential */
export const API_CREDENTIAL_PER_MINUTE = 60
/** Default: 600 requests / hour per organization */
export const API_ORG_PER_HOUR = 600

function floorWindow(date: Date, windowMs: number): Date {
  return new Date(Math.floor(date.getTime() / windowMs) * windowMs)
}

async function bumpBucket(input: {
  organizationId: string
  credentialId: string | null
  bucketKey: string
  windowStart: Date
  limit: number
}): Promise<{ allowed: boolean; remaining: number; resetAt: string }> {
  if (!supabaseAdmin) {
    return { allowed: true, remaining: input.limit, resetAt: input.windowStart.toISOString() }
  }

  const windowIso = input.windowStart.toISOString()
  const { data: existing } = await supabaseAdmin
    .from('recruitment_api_rate_buckets')
    .select('id, request_count')
    .eq('bucket_key', input.bucketKey)
    .eq('window_start', windowIso)
    .maybeSingle()

  if (!existing) {
    const { error } = await supabaseAdmin.from('recruitment_api_rate_buckets').insert([
      {
        organization_id: input.organizationId,
        credential_id: input.credentialId,
        bucket_key: input.bucketKey,
        window_start: windowIso,
        request_count: 1,
      },
    ])
    if (error) {
      // Fail open on race/insert issues after a re-read
      const { data: again } = await supabaseAdmin
        .from('recruitment_api_rate_buckets')
        .select('request_count')
        .eq('bucket_key', input.bucketKey)
        .eq('window_start', windowIso)
        .maybeSingle()
      const count = (again?.request_count ?? 0) + 1
      if (again) {
        await supabaseAdmin
          .from('recruitment_api_rate_buckets')
          .update({ request_count: count, updated_at: new Date().toISOString() })
          .eq('bucket_key', input.bucketKey)
          .eq('window_start', windowIso)
      }
      return {
        allowed: count <= input.limit,
        remaining: Math.max(0, input.limit - count),
        resetAt: new Date(input.windowStart.getTime() + 60_000).toISOString(),
      }
    }
    return {
      allowed: true,
      remaining: input.limit - 1,
      resetAt: new Date(input.windowStart.getTime() + 60_000).toISOString(),
    }
  }

  const next = Number(existing.request_count) + 1
  await supabaseAdmin
    .from('recruitment_api_rate_buckets')
    .update({ request_count: next, updated_at: new Date().toISOString() })
    .eq('id', existing.id)

  return {
    allowed: next <= input.limit,
    remaining: Math.max(0, input.limit - next),
    resetAt: new Date(input.windowStart.getTime() + 60_000).toISOString(),
  }
}

export async function checkApiRateLimit(input: {
  organizationId: string
  credentialId: string
}): Promise<{
  allowed: boolean
  reason?: 'credential_minute' | 'org_hour'
  remaining: number
  resetAt: string
}> {
  const now = new Date()
  const minuteWindow = floorWindow(now, 60_000)
  const hourWindow = floorWindow(now, 3_600_000)

  const cred = await bumpBucket({
    organizationId: input.organizationId,
    credentialId: input.credentialId,
    bucketKey: `cred:${input.credentialId}:m`,
    windowStart: minuteWindow,
    limit: API_CREDENTIAL_PER_MINUTE,
  })
  if (!cred.allowed) {
    return {
      allowed: false,
      reason: 'credential_minute',
      remaining: cred.remaining,
      resetAt: cred.resetAt,
    }
  }

  const org = await bumpBucket({
    organizationId: input.organizationId,
    credentialId: null,
    bucketKey: `org:${input.organizationId}:h`,
    windowStart: hourWindow,
    limit: API_ORG_PER_HOUR,
  })
  if (!org.allowed) {
    return {
      allowed: false,
      reason: 'org_hour',
      remaining: org.remaining,
      resetAt: new Date(hourWindow.getTime() + 3_600_000).toISOString(),
    }
  }

  return {
    allowed: true,
    remaining: Math.min(cred.remaining, org.remaining),
    resetAt: cred.resetAt,
  }
}

/** Pure helper for unit tests */
export function wouldExceedLimit(count: number, limit: number): boolean {
  return count > limit
}
