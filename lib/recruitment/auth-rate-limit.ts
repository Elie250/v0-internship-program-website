import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/** Max magic-link requests per normalized email per hour. */
export const RECRUITMENT_AUTH_EMAIL_HOURLY_LIMIT = 5
/** Min seconds between magic-link sends for the same email. */
export const RECRUITMENT_AUTH_EMAIL_COOLDOWN_SEC = 60
/** Max magic-link requests per IP hash per hour. */
export const RECRUITMENT_AUTH_IP_HOURLY_LIMIT = 30

const ONE_HOUR_MS = 60 * 60 * 1000

export function hashClientIp(ip: string): string {
  const trimmed = ip.trim() || 'unknown'
  return crypto.createHash('sha256').update(trimmed).digest('hex')
}

/** Best-effort client IP from reverse-proxy headers (Vercel-compatible). */
export function getClientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  return 'unknown'
}

export type RecruitmentAuthRateLimitResult = {
  allowed: boolean
  reason?: 'email_cooldown' | 'email_hourly' | 'ip_hourly'
}

/**
 * Rate limits magic-link requests using recruitment_login_tokens history.
 * Requires scripts/69-recruitment-auth-hardening.sql for IP hashing column.
 */
export async function checkRecruitmentAuthRateLimit(
  normalizedEmail: string,
  clientIp: string
): Promise<RecruitmentAuthRateLimitResult> {
  if (!supabaseAdmin) return { allowed: true }

  const now = Date.now()
  const oneHourAgo = new Date(now - ONE_HOUR_MS).toISOString()
  const cooldownSince = new Date(now - RECRUITMENT_AUTH_EMAIL_COOLDOWN_SEC * 1000).toISOString()

  const { data: recentEmailTokens, error: emailError } = await supabaseAdmin
    .from('recruitment_login_tokens')
    .select('created_at')
    .eq('email', normalizedEmail)
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })
    .limit(RECRUITMENT_AUTH_EMAIL_HOURLY_LIMIT + 1)

  if (emailError) {
    // Fail open if DB unavailable — do not block legitimate login
    return { allowed: true }
  }

  const emailRows = recentEmailTokens ?? []
  if (emailRows.length > 0 && emailRows[0]!.created_at >= cooldownSince) {
    return { allowed: false, reason: 'email_cooldown' }
  }
  if (emailRows.length >= RECRUITMENT_AUTH_EMAIL_HOURLY_LIMIT) {
    return { allowed: false, reason: 'email_hourly' }
  }

  const ipHash = hashClientIp(clientIp)
  if (ipHash) {
    const { data: recentIpTokens, error: ipError } = await supabaseAdmin
      .from('recruitment_login_tokens')
      .select('id')
      .eq('request_ip_hash', ipHash)
      .gte('created_at', oneHourAgo)
      .limit(RECRUITMENT_AUTH_IP_HOURLY_LIMIT + 1)

    if (!ipError && (recentIpTokens?.length ?? 0) >= RECRUITMENT_AUTH_IP_HOURLY_LIMIT) {
      return { allowed: false, reason: 'ip_hourly' }
    }
  }

  return { allowed: true }
}
