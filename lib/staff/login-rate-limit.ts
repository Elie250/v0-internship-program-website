/**
 * In-memory staff login rate limiter (email + IP).
 *
 * Limitation: on multi-instance / serverless deployments each instance has its
 * own counters. This still slows brute force on a single instance and is the
 * safest dependency-free protection available without a new migration/store.
 */

import { createHash } from 'crypto'

export const STAFF_LOGIN_EMAIL_MAX_ATTEMPTS = 8
export const STAFF_LOGIN_IP_MAX_ATTEMPTS = 40
export const STAFF_LOGIN_WINDOW_MS = 15 * 60 * 1000

type Bucket = { count: number; windowStartedAt: number }

const emailBuckets = new Map<string, Bucket>()
const ipBuckets = new Map<string, Bucket>()

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function hashStaffLoginIp(ip: string): string {
  return createHash('sha256').update(ip.trim() || 'unknown').digest('hex')
}

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

function touchBucket(
  map: Map<string, Bucket>,
  key: string,
  max: number,
  now: number
): { allowed: boolean; retryAfterSec: number } {
  const existing = map.get(key)
  if (!existing || now - existing.windowStartedAt >= STAFF_LOGIN_WINDOW_MS) {
    map.set(key, { count: 1, windowStartedAt: now })
    return { allowed: true, retryAfterSec: 0 }
  }
  if (existing.count >= max) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((STAFF_LOGIN_WINDOW_MS - (now - existing.windowStartedAt)) / 1000)
    )
    return { allowed: false, retryAfterSec }
  }
  existing.count += 1
  map.set(key, existing)
  return { allowed: true, retryAfterSec: 0 }
}

export type StaffLoginRateLimitResult = {
  allowed: boolean
  reason?: 'email' | 'ip'
  retryAfterSec?: number
}

/** Record an attempt and decide whether it is allowed. Call before verifying password. */
export function checkStaffLoginRateLimit(input: {
  email: string
  clientIp: string
  now?: number
}): StaffLoginRateLimitResult {
  const now = input.now ?? Date.now()
  const emailKey = normalizeEmail(input.email) || 'unknown'
  const ipKey = hashStaffLoginIp(input.clientIp)

  const email = touchBucket(emailBuckets, emailKey, STAFF_LOGIN_EMAIL_MAX_ATTEMPTS, now)
  if (!email.allowed) {
    return { allowed: false, reason: 'email', retryAfterSec: email.retryAfterSec }
  }

  const ip = touchBucket(ipBuckets, ipKey, STAFF_LOGIN_IP_MAX_ATTEMPTS, now)
  if (!ip.allowed) {
    return { allowed: false, reason: 'ip', retryAfterSec: ip.retryAfterSec }
  }

  return { allowed: true }
}

/** Test helper — clears in-memory buckets. */
export function resetStaffLoginRateLimitForTests() {
  emailBuckets.clear()
  ipBuckets.clear()
}
