/** Same units as lib/shop/selling-unit.ts. Staff create/edit must send a listed value. */
export const SELLING_UNITS = [
  'PCS',
  'PACK',
  'SET',
  'PAIR',
  'M',
  'CM',
  'MM',
  'KG',
  'G',
  'L',
  'ML',
] as const

export type SellingUnit = (typeof SELLING_UNITS)[number]
