import { useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSessionStore } from '@/src/auth/session-store'
import {
  FULFILLMENT_STATUSES,
  fulfillmentLabel,
  isPendingPayment,
  paymentLabel,
  useFulfillmentMutation,
  useOrderQuery,
} from '@/src/features/orders/hooks'
import { usePaymentReviewMutation } from '@/src/features/payments/hooks'
import { canManageFulfillment, canReviewShopPayments, canViewProductCost } from '@/src/permissions'
import { formatRwf, formatWhen } from '@/src/format'
import { PrimaryButton } from '@/src/ui/Button'
import { Card } from '@/src/ui/Card'
import { ProofViewer } from '@/src/ui/ProofViewer'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { StatusBadge } from '@/src/ui/StatusBadge'
import { RequireStaffNav } from '@/src/ui/RequireStaffNav'
import { colors, space } from '@/src/theme'

export default function OrderDetailScreen() {
  return (
    <RequireStaffNav navKey="orders">
      <OrderDetailBody />
    </RequireStaffNav>
  )
}

function OrderDetailBody() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const user = useSessionStore((s) => s.user)
  const query = useOrderQuery(id)
  const review = usePaymentReviewMutation(id ?? '')
  const fulfill = useFulfillmentMutation(id ?? '')
  const [notes, setNotes] = useState('')
  const [nextStatus, setNextStatus] = useState('ready_for_pickup')

  const order = query.data?.item
  const canReview = canReviewShopPayments(user?.permissions)
  const canFulfill = canManageFulfillment(user?.permissions)
  const showCost = canViewProductCost(user?.permissions)
  const pending = isPendingPayment(order?.paymentStatus) || isPendingPayment(order?.payment?.status)
  const paid = order?.paymentStatus === 'paid' || order?.payment?.status === 'approved'
  const isOnlineOrder = order?.channel === 'online'

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <ScreenState loading={query.isLoading} error={query.error?.message} empty={!order} onRetry={() => void query.refetch()}>
        {order ? (
          <>
            <Card>
              <Text style={styles.number}>{order.orderNumber || 'Order'}</Text>
              <StatusBadge
                label={paymentLabel(order.paymentStatus)}
                tone={pending ? 'amber' : paid ? 'green' : 'slate'}
              />
              <Text style={styles.meta}>{fulfillmentLabel(order.status)}</Text>
            </Card>

            <Card>
              <Text style={styles.heading}>Customer</Text>
              <Text style={styles.value}>{order.customerName || '—'}</Text>
              <Text style={styles.meta}>{order.customerPhone || 'No phone'}</Text>
              {order.customerEmail ? <Text style={styles.meta}>{order.customerEmail}</Text> : null}
            </Card>

            <Card>
              <Text style={styles.heading}>Items</Text>
              {order.items?.map((line) => (
                <View key={line.id} style={styles.line}>
                  <Text style={styles.value}>{line.productName}</Text>
                  <Text style={styles.meta}>
                    {line.quantity}
                    {line.sellingUnit ? ` ${line.sellingUnit}` : ''} × {formatRwf(line.unitPrice)}
                    {showCost && line.unitCost != null ? ` · cost ${formatRwf(line.unitCost)}` : ''}
                  </Text>
                  <Text style={styles.amount}>{formatRwf(line.lineTotal)}</Text>
                </View>
              ))}
              <Text style={styles.total}>Total {formatRwf(order.totalAmount)}</Text>
            </Card>

            <Card>
              <Text style={styles.heading}>Payment</Text>
              <Text style={styles.value}>
                {order.paymentMethod === 'momo'
                  ? order.channel === 'pos'
                    ? 'In-person MoMo (POS)'
                    : 'Customer online MoMo'
                  : order.paymentMethod || '—'}
              </Text>
              <Text style={styles.meta}>
                Reference {order.payment?.referenceNumber || '—'}
              </Text>
              <Text style={styles.meta}>Submitted {formatWhen(order.payment?.submittedAt)}</Text>
              {order.payment?.reviewedBy || order.payment?.reviewedAt ? (
                <Text style={styles.meta}>
                  Reviewed by {order.payment.reviewedBy || '—'} · {formatWhen(order.payment.reviewedAt)}
                </Text>
              ) : null}
              <ProofViewer url={order.payment?.proofUrl} />
            </Card>

            {canReview && pending && isOnlineOrder ? (
              <Card>
                <Text style={styles.heading}>Review online MoMo payment</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Optional notes"
                  placeholderTextColor={colors.muted}
                  style={styles.notes}
                  multiline
                />
                {review.error ? <Text style={styles.error}>{review.error.message}</Text> : null}
                <PrimaryButton
                  label="Approve payment"
                  loading={review.isPending && review.variables?.decision === 'approve'}
                  onPress={() => review.mutate({ decision: 'approve', adminNotes: notes || undefined })}
                />
                <PrimaryButton
                  label="Reject payment"
                  tone="danger"
                  loading={review.isPending && review.variables?.decision === 'reject'}
                  onPress={() => review.mutate({ decision: 'reject', adminNotes: notes || undefined })}
                />
              </Card>
            ) : null}

            {canFulfill && paid ? (
              <Card>
                <Text style={styles.heading}>Fulfillment</Text>
                <View style={styles.statusRow}>
                  {FULFILLMENT_STATUSES.map((status) => (
                    <Pressable
                      key={status}
                      onPress={() => setNextStatus(status)}
                      style={[styles.chip, nextStatus === status && styles.chipOn]}
                    >
                      <Text style={[styles.chipLabel, nextStatus === status && styles.chipLabelOn]}>
                        {fulfillmentLabel(status)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {fulfill.error ? <Text style={styles.error}>{fulfill.error.message}</Text> : null}
                <PrimaryButton
                  label="Update status"
                  tone="outline"
                  loading={fulfill.isPending}
                  onPress={() => fulfill.mutate(nextStatus)}
                />
              </Card>
            ) : null}
          </>
        ) : null}
      </ScreenState>
    </Screen>
  )
}

const styles = StyleSheet.create({
  number: { fontSize: 22, fontWeight: '800', color: colors.navy },
  heading: { fontSize: 13, fontWeight: '800', color: colors.muted, textTransform: 'uppercase' },
  value: { fontSize: 16, fontWeight: '700', color: colors.navy },
  meta: { color: colors.muted, fontSize: 14 },
  line: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  amount: { fontWeight: '800', color: colors.navy, marginTop: 4 },
  total: { marginTop: 8, fontSize: 18, fontWeight: '800', color: colors.navy },
  notes: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: space.sm,
    textAlignVertical: 'top',
    color: colors.navy,
  },
  error: { color: colors.red },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.bg,
  },
  chipOn: { backgroundColor: colors.navy },
  chipLabel: { color: colors.slate, fontWeight: '700', fontSize: 12 },
  chipLabelOn: { color: colors.white },
})
