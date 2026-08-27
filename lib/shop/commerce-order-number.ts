import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { resolveShopPortalPosLocation } from '@/lib/shop/resolve-pos-location'

/** EL-NYZ-20260827-0001 (sequence may grow past 4 digits). */
export const UNIFIED_COMMERCE_ORDER_NUMBER_RE =
  /^EL-[A-Z0-9]{2,4}-\d{8}-\d{4,}$/

/** Historical POS / online codes: POS-M5K8X2-AB3F or EL-M5K8X2-XY9Z. */
const HISTORICAL_COMMERCE_ORDER_NUMBER_RE = /^(POS|EL)-[A-Z0-9]+-[A-Z0-9]+$/

export function normalizeCommerceOrderNumber(raw: string): string {
  return raw.trim().toUpperCase()
}

export function isUnifiedCommerceOrderNumber(raw: string): boolean {
  return UNIFIED_COMMERCE_ORDER_NUMBER_RE.test(normalizeCommerceOrderNumber(raw))
}

export function isHistoricalCommerceOrderNumber(raw: string): boolean {
  const value = normalizeCommerceOrderNumber(raw)
  if (isUnifiedCommerceOrderNumber(value)) return false
  return HISTORICAL_COMMERCE_ORDER_NUMBER_RE.test(value)
}

/** Format helper for tests — production numbers come from shop_next_order_number. */
export function formatUnifiedCommerceOrderNumber(
  shortCode: string,
  yyyymmdd: string,
  sequence: number
): string {
  const short = shortCode.trim().toUpperCase()
  const seq = Math.trunc(sequence)
  return `EL-${short}-${yyyymmdd}-${String(seq).padStart(4, '0')}`
}

/**
 * Allocate the next unified commerce number from PostgreSQL.
 * Uses the caller's server-resolved location when present; otherwise Nyanza
 * so POS and online share one daily sequence (Phase 1E.1).
 * Does not write orders.location_id — that is Phase 1E.2.
 */
export async function allocateCommerceOrderNumber(
  locationId?: string | null
): Promise<{ orderNumber: string } | { error: string }> {
  if (!supabaseAdmin) return { error: 'Sale could not be completed.' }

  let resolvedId = typeof locationId === 'string' ? locationId.trim() : ''
  if (!resolvedId) {
    const nyanza = await resolveShopPortalPosLocation()
    resolvedId = nyanza?.id ?? ''
  }
  if (!resolvedId) {
    return { error: 'Sale could not be completed.' }
  }

  const { data, error } = await supabaseAdmin.rpc('shop_next_order_number', {
    p_location_id: resolvedId,
  })

  if (error || data == null) {
    if (error?.message) {
      console.error('[commerce] shop_next_order_number failed:', error.message)
    }
    return { error: 'Sale could not be completed.' }
  }

  const orderNumber = normalizeCommerceOrderNumber(String(data))
  if (!isUnifiedCommerceOrderNumber(orderNumber)) {
    console.error('[commerce] unexpected order number from RPC:', orderNumber)
    return { error: 'Sale could not be completed.' }
  }

  return { orderNumber }
}
