/**
 * Shop location types and stable codes.
 * Seed data lives in scripts/87-shop-locations-foundation.sql — do not hard-code business rules on Nyanza.
 */

export type ShopLocationStatus = 'active' | 'inactive' | 'archived'

export type ShopLocation = {
  id: string
  name: string
  code: string
  shortCode?: string | null
  status: ShopLocationStatus
  createdAt?: string
  updatedAt?: string
}

/** Stable location codes used in seeds / lookups (not inventory keys). */
export const SHOP_LOCATION_CODES = {
  NYANZA: 'NYANZA',
} as const

/** Public commerce-number segments. Machine code NYANZA stays unchanged. */
export const SHOP_LOCATION_SHORT_CODES = {
  NYANZA: 'NYZ',
} as const

export type ShopLocationCode = (typeof SHOP_LOCATION_CODES)[keyof typeof SHOP_LOCATION_CODES]

export function mapShopLocationRow(row: {
  id: string
  name: string
  code: string
  short_code?: string | null
  status: string
  created_at?: string
  updated_at?: string
}): ShopLocation {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    shortCode: row.short_code != null ? String(row.short_code) : null,
    status: row.status as ShopLocationStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
