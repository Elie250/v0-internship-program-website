/**
 * Safe client-facing commerce errors.
 * Unexpected / DB internals stay in server logs only.
 */

const BUSINESS_PATTERNS: Array<{ test: RegExp; error: string; httpStatus: number }> = [
  {
    test: /insufficient.?stock|available:\s*\d+/i,
    error: 'Insufficient stock',
    httpStatus: 409,
  },
  {
    test: /cart is empty|invalid cart|invalid cart item|invalid product/i,
    error: 'Invalid cart',
    httpStatus: 400,
  },
  {
    test: /idempotency key is required for refunds/i,
    error: 'Idempotency key is required for refunds (8–128 chars)',
    httpStatus: 400,
  },
  {
    test: /idempotency key is required/i,
    error: 'Idempotency key is required for POS sales (8–128 chars)',
    httpStatus: 400,
  },
  {
    test: /idempotency|request fingerprint|conflict/i,
    error: 'Conflicting sale request',
    httpStatus: 409,
  },
  {
    test: /refund quantity is not available|already fully refunded|cannot be refunded|online orders cannot be refunded/i,
    error: 'This sale cannot be refunded for the requested quantity',
    httpStatus: 409,
  },
  {
    test: /refund amount and stock are calculated/i,
    error: 'Refund amount and stock are calculated by the server',
    httpStatus: 400,
  },
  {
    test: /name, email, and phone are required|delivery address is required/i,
    error: 'Required customer details are missing',
    httpStatus: 400,
  },
]

const LOOKS_LIKE_DB =
  /relation |column |constraint |violates |duplicate key|PGRST|postgres|supabase|syntax error|permission denied for|foreign key|null value in column|could not find/i

export function toSafeCommerceClientError(
  raw: string | null | undefined,
  fallbackStatus = 500
): { error: string; httpStatus: number } {
  const message = String(raw ?? '').trim()
  if (!message) {
    return { error: 'Sale could not be completed.', httpStatus: fallbackStatus }
  }

  for (const rule of BUSINESS_PATTERNS) {
    if (rule.test.test(message)) {
      return { error: rule.error, httpStatus: rule.httpStatus }
    }
  }

  if (LOOKS_LIKE_DB.test(message) || message.length > 180) {
    console.error('[commerce] sanitized internal error:', message)
    return { error: 'Sale could not be completed.', httpStatus: 500 }
  }

  // Already application-level (short, no DB markers)
  if (fallbackStatus >= 500) {
    console.error('[commerce] unexpected error:', message)
    return { error: 'Sale could not be completed.', httpStatus: 500 }
  }

  return { error: message, httpStatus: fallbackStatus }
}
