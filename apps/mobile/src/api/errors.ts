/** Production shop host. Overridable in development via EXPO_PUBLIC_API_BASE_URL. */
export const PRODUCTION_API_BASE_URL = 'https://shop.energyandlogics.com'

export const USER_MESSAGES = {
  network: 'Unable to connect. Check your internet connection.',
  forbidden: "You don't have permission to perform this action.",
  expired: 'Your session has expired. Please sign in again.',
  generic: 'Something went wrong. Please try again.',
  signIn: 'Unable to sign in. Check your email and password.',
} as const

const SAFE_BUSINESS_MESSAGES = new Set([
  'Insufficient stock',
  'Invalid cart',
  'Conflicting sale request',
  'Sale could not be completed.',
  'Idempotency key is required for POS sales (8–128 chars)',
  'Too many login attempts. Please try again later.',
  'This payment is not a shop order',
  'Invalid email or password',
  USER_MESSAGES.network,
  USER_MESSAGES.forbidden,
  USER_MESSAGES.expired,
  USER_MESSAGES.generic,
  USER_MESSAGES.signIn,
])

const LOOKS_INTERNAL =
  /supabase|postgres|pgrst|stack|at\s+\w+\s+\(|relation |column |constraint |service.?role|bearer\s+[a-z0-9]|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i

export type ApiErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'network'
  | 'timeout'
  | 'not_found'
  | 'http'

export function sanitizeApiErrorMessage(input: {
  status: number
  code: ApiErrorCode
  serverMessage?: string
  isLogin?: boolean
}): string {
  if (input.code === 'network' || input.code === 'timeout' || input.status === 0) {
    return USER_MESSAGES.network
  }
  if (input.status === 401) {
    return input.isLogin ? USER_MESSAGES.signIn : USER_MESSAGES.expired
  }
  if (input.status === 403 || input.code === 'forbidden') {
    return USER_MESSAGES.forbidden
  }

  const raw = String(input.serverMessage ?? '').trim()
  if (raw && SAFE_BUSINESS_MESSAGES.has(raw) && !LOOKS_INTERNAL.test(raw)) {
    return raw
  }
  if (raw === 'Insufficient stock' || /insufficient stock/i.test(raw)) {
    return 'Insufficient stock'
  }
  return USER_MESSAGES.generic
}
