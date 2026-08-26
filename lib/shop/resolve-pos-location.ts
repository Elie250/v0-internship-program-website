import { supabaseAdmin } from '@/lib/supabaseAdmin'
import {
  SHOP_LOCATION_CODES,
  mapShopLocationRow,
  type ShopLocation,
} from '@/lib/shop/locations'

/**
 * Resolve the Shop portal POS attribution location (Nyanza).
 * Uses shop_locations.code — never a hard-coded UUID.
 * Returns null when migration 87 is not applied or the row is missing.
 */
export async function resolveShopPortalPosLocation(): Promise<ShopLocation | null> {
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin
    .from('shop_locations')
    .select('id, name, code, status, created_at, updated_at')
    .eq('code', SHOP_LOCATION_CODES.NYANZA)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    if (/shop_locations|schema cache|does not exist/i.test(error.message)) {
      console.warn('[shop-location] shop_locations unavailable — POS sale will omit location_id')
      return null
    }
    console.error('[shop-location] lookup failed', error.message)
    return null
  }
  if (!data) {
    console.warn('[shop-location] NYANZA active location not found')
    return null
  }
  return mapShopLocationRow(data)
}
