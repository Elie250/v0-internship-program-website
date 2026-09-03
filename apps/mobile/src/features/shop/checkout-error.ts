import { ApiError } from '@/src/api/client'
import { USER_MESSAGES } from '@/src/api/errors'
import type { ShopUiKey } from '@/src/i18n/messages/en'

export function checkoutFieldErrorKey(message: string | undefined): ShopUiKey {
  if (message === 'email') return 'checkout.error.email'
  if (message === 'phone') return 'checkout.error.phone'
  if (message === 'address') return 'checkout.error.address'
  return 'checkout.error.name'
}

export function checkoutSubmitMessage(error: unknown): { key?: ShopUiKey; text?: string } {
  if (error instanceof ApiError) {
    if (error.serverCode === 'CART_CHANGED' || error.message.includes('Prices or availability')) {
      return { key: 'checkout.cartChanged' }
    }
    if (error.message === 'Insufficient stock' || /insufficient stock/i.test(error.message)) {
      return { key: 'checkout.stock' }
    }
    if (error.message === 'Name, email, and phone are required') {
      return { key: 'checkout.contactRequired' }
    }
    if (error.message === 'Delivery address is required for delivery orders') {
      return { key: 'checkout.addressRequired' }
    }
    if (error.message === 'Cart is empty') return { key: 'checkout.emptyCart' }
    if (error.code === 'network' || error.code === 'timeout') return { key: 'checkout.network' }
    if (error.message && error.message !== USER_MESSAGES.generic) {
      return { text: error.message }
    }
  }
  return { key: 'checkout.failed' }
}
