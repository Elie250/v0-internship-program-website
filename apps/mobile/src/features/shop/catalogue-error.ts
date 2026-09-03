import { ApiError } from '@/src/api/client'
import { USER_MESSAGES } from '@/src/api/errors'
import type { ShopUiKey } from '@/src/i18n/messages/en'

/** Map a catalogue fetch failure to a customer-safe i18n key. */
export function catalogueErrorKey(error: unknown): ShopUiKey {
  if (error instanceof ApiError) {
    if (error.code === 'timeout') return 'catalogue.timeout'
    if (error.code === 'network' || error.status === 0) {
      return 'catalogue.error'
    }
    if (error.code === 'not_found' || error.status === 404) {
      return 'catalogue.unavailableShop'
    }
    if (error.code === 'unauthorized' || error.status === 401) {
      return 'catalogue.unauthorized'
    }
    if (error.code === 'forbidden' || error.status === 403) {
      return 'catalogue.forbidden'
    }
    if (error.code === 'invalid_json') return 'catalogue.invalidJson'
    if (error.code === 'invalid_payload') return 'catalogue.invalidPayload'
    return 'catalogue.server'
  }
  return 'catalogue.error'
}

export function trackErrorKey(error: unknown): ShopUiKey {
  if (error instanceof ApiError && error.status === 404) {
    if (error.message === USER_MESSAGES.generic) return 'track.unavailable'
    return 'track.notFound'
  }
  return catalogueErrorKey(error)
}
