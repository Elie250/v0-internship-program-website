import { Alert } from 'react-native'
import { formatRwf } from '@/src/format'

/**
 * Extra client-side confirmation before a till sale is submitted.
 * Does not change server behavior, idempotency, or pricing.
 * Selecting Cash / MoMo never submits; only Confirm after this dialog does.
 */
export function confirmTillSale(input: {
  paymentMethod: 'cash' | 'momo'
  total: number
  lines: Array<{ name: string; quantity: number }>
  onConfirm: () => void
}) {
  const momo = input.paymentMethod === 'momo'
  const items = input.lines
    .map((line) => `${line.quantity} × ${line.name}`)
    .join('\n')
  const method = momo ? 'MoMo' : 'CASH'
  const consequence = momo
    ? 'This records a till MoMo payment and leaves it pending review. It does not approve an online customer payment.'
    : 'This records a paid cash sale at the till.'

  Alert.alert(
    'REAL SALE / PAYMENT ACTION',
    `${items}\nTotal: ${formatRwf(input.total)}\nPayment: ${method}\n\n${consequence}`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: momo ? 'Record MoMo payment' : 'Confirm sale',
        onPress: input.onConfirm,
      },
    ]
  )
}
