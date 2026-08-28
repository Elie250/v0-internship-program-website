import { Alert } from 'react-native'
import { formatRwf } from '@/src/format'

/**
 * Extra client-side confirmation before a till sale is submitted.
 * Does not change server behavior, idempotency, or pricing.
 */
export function confirmTillSale(input: {
  paymentMethod: 'cash' | 'momo'
  total: number
  onConfirm: () => void
}) {
  const momo = input.paymentMethod === 'momo'
  const total = formatRwf(input.total)
  Alert.alert(
    momo ? 'Record MoMo payment?' : 'Confirm cash sale?',
    momo
      ? `${total} will be recorded as MoMo at the till and stay pending review. This does not approve an online customer payment.`
      : `${total} will be recorded as a paid cash sale at the till.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: momo ? 'Record MoMo payment' : 'Confirm sale',
        onPress: input.onConfirm,
      },
    ]
  )
}
