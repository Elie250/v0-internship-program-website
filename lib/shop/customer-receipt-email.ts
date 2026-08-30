import { isLikelyValidEmail } from '@/lib/async/background-task'

/** POS walk-in fallback — never treat this as a customer inbox. */
export const POS_PLACEHOLDER_CUSTOMER_EMAIL = 'pos@energyandlogics.com'

export function isCustomerReceiptEmail(raw: string | null | undefined): boolean {
  const email = String(raw ?? '').trim().toLowerCase()
  if (!email) return false
  if (email === POS_PLACEHOLDER_CUSTOMER_EMAIL) return false
  return isLikelyValidEmail(email)
}

export function receiptAttachmentFilename(orderNumber: string): string {
  const safe = String(orderNumber)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
  return `Official-receipt-${safe || 'order'}.html`
}
