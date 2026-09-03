import { ApiError } from '@/src/api/client'
import { USER_MESSAGES } from '@/src/api/errors'
import { fetchProducts } from '@/src/api/staff'
import type { StaffProduct } from '@/src/api/types'
import { pickBarcodeMatch } from '@/src/features/pos/barcode-match'
import { stockState } from '@/src/features/pos/stock'

export const SCAN_NOT_FOUND_MESSAGE = 'No product found for this barcode.'
export const SCAN_NETWORK_MESSAGE = 'Unable to find product. Check your connection.'

export type BarcodeLookupResult =
  | { kind: 'found'; product: StaffProduct; canSell: boolean }
  | { kind: 'none'; message: string }
  | { kind: 'network'; message: string }
  | { kind: 'error'; message: string }

export async function lookupProductByBarcode(barcode: string): Promise<BarcodeLookupResult> {
  const code = barcode.trim()
  if (!code) return { kind: 'none', message: SCAN_NOT_FOUND_MESSAGE }

  try {
    const result = await fetchProducts({ barcode: code, limit: 5, page: 1 })
    const product = pickBarcodeMatch(result.items ?? [], code)
    if (!product) return { kind: 'none', message: SCAN_NOT_FOUND_MESSAGE }
    const stock = stockState(product.stock, product.lowStockThreshold)
    return { kind: 'found', product, canSell: stock.canSell }
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.code === 'network' || error.code === 'timeout' || error.status === 0)
    ) {
      return { kind: 'network', message: SCAN_NETWORK_MESSAGE }
    }
    return { kind: 'error', message: USER_MESSAGES.generic }
  }
}
