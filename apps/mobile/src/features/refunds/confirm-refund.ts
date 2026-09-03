import { Alert } from 'react-native'
import { formatRwf } from '@/src/format'
import { refundReasonLabel } from '@/src/features/refunds/policy'

export function confirmShopRefund(input: {
  summary: string
  amount: number
  paymentMethod: string
  reason: string
  execute: boolean
  onConfirm: () => void
}) {
  Alert.alert(
    input.execute ? 'Confirm refund?' : 'Submit refund request?',
    `${input.summary}\nRefund amount: ${formatRwf(input.amount)}\nOriginal payment: ${input.paymentMethod}\nReason: ${refundReasonLabel(input.reason)}`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: input.execute ? 'Confirm refund' : 'Submit request',
        onPress: input.onConfirm,
      },
    ]
  )
}
