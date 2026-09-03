/**
 * Product barcode for till scanning. Separate from SKU.
 * Empty values are stored as null so the unique index stays unused.
 */

export const PRODUCT_BARCODE_MAX_LENGTH = 64

export const INVALID_BARCODE_MESSAGE =
  'Barcode can only contain letters and numbers (no spaces). Leave blank if there is none.'

export const DUPLICATE_BARCODE_MESSAGE = 'That barcode is already used on another product'

export function isDuplicateBarcodeError(message: string | undefined): boolean {
  return /products_barcode_unique|duplicate key.*barcode/i.test(message || '')
}

/**
 * Normalize a barcode for storage and scanner match.
 * Strips spaces and hyphens. Empty becomes null.
 */
export function parseProductBarcode(
  raw: unknown
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, value: null }
  const value = String(raw).replace(/[\s-]/g, '').trim()
  if (!value) return { ok: true, value: null }
  if (value.length > PRODUCT_BARCODE_MAX_LENGTH) {
    return { ok: false, error: 'Barcode is too long' }
  }
  if (!/^[A-Za-z0-9]+$/.test(value)) {
    return { ok: false, error: INVALID_BARCODE_MESSAGE }
  }
  return { ok: true, value }
}

export function applyBarcodeToProductPayload(
  body: Record<string, unknown>,
  mode: 'create' | 'update'
):
  | { ok: true; payload: Record<string, unknown>; wroteBarcode: boolean }
  | { ok: false; error: string } {
  const rest = { ...body }
  delete rest.barcode

  const raw = body.barcode
  if (mode === 'update' && raw === undefined) {
    return { ok: true, payload: rest, wroteBarcode: false }
  }

  const parsed = parseProductBarcode(raw)
  if (!parsed.ok) return parsed
  return {
    ok: true,
    wroteBarcode: true,
    payload: { ...rest, barcode: parsed.value },
  }
}
