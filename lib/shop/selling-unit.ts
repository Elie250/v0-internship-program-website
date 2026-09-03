/**
 * Customer selling unit — display and validation.
 * Price/discount apply to one selling unit. Stock is a count of sellable units.
 * No unit conversion.
 */

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

export const DEFAULT_SELLING_QUANTITY = 1
export const DEFAULT_SELLING_UNIT: SellingUnit = 'PCS'

const SELLING_UNIT_SET = new Set<string>(SELLING_UNITS)

export function isSellingUnit(value: string): value is SellingUnit {
  return SELLING_UNIT_SET.has(value)
}

/** Presentation only — does not change the stored numeric value. */
export function formatSellingQuantity(quantity: number): string {
  const n = Number(quantity)
  if (!Number.isFinite(n)) return String(DEFAULT_SELLING_QUANTITY)
  const rounded = Math.round(n * 1000) / 1000
  if (Number.isInteger(rounded)) return String(rounded)
  return rounded.toFixed(3).replace(/\.?0+$/, '')
}

export function parseSellingQuantity(
  raw: unknown
): { ok: true; value: number } | { ok: false } {
  if (raw === undefined || raw === null || raw === '') return { ok: false }
  const n = typeof raw === 'number' ? raw : Number(String(raw).trim())
  if (!Number.isFinite(n) || n <= 0) return { ok: false }
  const value = Math.round(n * 1000) / 1000
  if (!(value > 0) || value > 999_999_999.999) return { ok: false }
  return { ok: true, value }
}

export function parseSellingUnit(raw: unknown): { ok: true; value: SellingUnit } | { ok: false } {
  if (raw === undefined || raw === null) return { ok: false }
  const unit = String(raw).trim().toUpperCase()
  if (!isSellingUnit(unit)) return { ok: false }
  return { ok: true, value: unit }
}

export function resolveSellingUnitFields(input?: {
  sellingQuantity?: unknown
  selling_quantity?: unknown
  sellingUnit?: unknown
  selling_unit?: unknown
}): { sellingQuantity: number; sellingUnit: SellingUnit } {
  const qtyParsed = parseSellingQuantity(input?.sellingQuantity ?? input?.selling_quantity)
  const unitParsed = parseSellingUnit(input?.sellingUnit ?? input?.selling_unit)
  return {
    sellingQuantity: qtyParsed.ok ? qtyParsed.value : DEFAULT_SELLING_QUANTITY,
    sellingUnit: unitParsed.ok ? unitParsed.value : DEFAULT_SELLING_UNIT,
  }
}

/** `formatSellingUnit(1, "PCS") → "1 PCS"` — never `20 × ML`. */
export function formatSellingUnit(quantity: number, unit: string): string {
  const resolved = resolveSellingUnitFields({
    sellingQuantity: quantity,
    sellingUnit: unit,
  })
  return `${formatSellingQuantity(resolved.sellingQuantity)} ${resolved.sellingUnit}`
}

export type SellingUnitWriteResult =
  | { ok: true; sellingQuantity: number; sellingUnit: SellingUnit }
  | { ok: false; error: string }

const INVALID_SELLING_UNIT_MESSAGE = 'Invalid selling quantity or unit'

/**
 * Validate write payloads. Create may omit fields (defaults to 1 PCS).
 * Patch with neither field leaves selling columns untouched when overlaying.
 */
export function applySellingUnitToProductPayload(
  body: Record<string, unknown>,
  mode: 'create' | 'update'
):
  | { ok: true; payload: Record<string, unknown>; wroteSellingUnit: boolean }
  | { ok: false; error: string } {
  const rest = { ...body }
  delete rest.sellingQuantity
  delete rest.selling_quantity
  delete rest.sellingUnit
  delete rest.selling_unit

  const qtyRaw = body.sellingQuantity ?? body.selling_quantity
  const unitRaw = body.sellingUnit ?? body.selling_unit

  if (mode === 'update' && qtyRaw === undefined && unitRaw === undefined) {
    return { ok: true, payload: rest, wroteSellingUnit: false }
  }

  const qty =
    qtyRaw === undefined
      ? ({ ok: true, value: DEFAULT_SELLING_QUANTITY } as const)
      : parseSellingQuantity(qtyRaw)
  const unit =
    unitRaw === undefined
      ? ({ ok: true, value: DEFAULT_SELLING_UNIT } as const)
      : parseSellingUnit(unitRaw)

  if (!qty.ok || !unit.ok) {
    return { ok: false, error: INVALID_SELLING_UNIT_MESSAGE }
  }

  return {
    ok: true,
    wroteSellingUnit: true,
    payload: {
      ...rest,
      selling_quantity: qty.value,
      selling_unit: unit.value,
    },
  }
}

export function parseSellingUnitPatch(body: Record<string, unknown>): SellingUnitWriteResult {
  const qtyRaw = body.sellingQuantity ?? body.selling_quantity
  const unitRaw = body.sellingUnit ?? body.selling_unit
  const qty = parseSellingQuantity(qtyRaw)
  const unit = parseSellingUnit(unitRaw)
  if (!qty.ok || !unit.ok) {
    return { ok: false, error: INVALID_SELLING_UNIT_MESSAGE }
  }
  return { ok: true, sellingQuantity: qty.value, sellingUnit: unit.value }
}
