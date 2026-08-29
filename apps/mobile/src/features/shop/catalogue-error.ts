import { ApiError } from '@/src/api/client'
import type { ShopUiKey } from '@/src/i18n/messages/en'

/** Map a catalogue fetch failure to a customer-safe i18n key. */
export function catalogueErrorKey(error: unknown): ShopUiKey {
  if (error instanceof ApiError) {
    if (error.code === 'network' || error.code === 'timeout' || error.status === 0) {
      return 'catalogue.error'
    }
    if (error.code === 'not_found' || error.status === 404) {
      return 'catalogue.unavailableShop'
    }
    if (
      error.code === 'unauthorized' ||
      error.code === 'forbidden' ||
      error.status === 401 ||
      error.status === 403
    ) {
      return 'catalogue.unavailableShop'
    }
    return 'catalogue.server'
  }
  return 'catalogue.error'
}
