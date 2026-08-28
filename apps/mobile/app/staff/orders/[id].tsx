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
import { ProofViewer } from '@/src/ui/ProofViewer'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { StatusBadge } from '@/src/ui/StatusBadge'
import { RequireStaffNav } from '@/src/ui/RequireStaffNav'
import { colors, radius, space, type } from '@/src/theme'

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
      <ScreenState
        loading={query.isLoading}
        error={query.error?.message}
        empty={!order}
        emptyTitle="Order not found"
        onRetry={() => void query.refetch()}
      >
        {order ? (
          <>
            <View style={styles.hero}>
              <Text style={type.orderRef}>{order.orderNumber || 'Order'}</Text>
              <Text style={type.meta}>{formatWhen(order.orderDate || order.createdAt)}</Text>
              <View style={styles.heroRow}>
                <StatusBadge
                  label={paymentLabel(order.paymentStatus)}
                  tone={pending ? 'amber' : paid ? 'green' : 'slate'}
                />
                <Text style={type.sku}>{fulfillmentLabel(order.status)}</Text>
              </View>
              <Text style={type.total}>{formatRwf(order.totalAmount)}</Text>
            </View>

            <Text style={styles.section}>Customer</Text>
            <Text style={styles.value}>{order.customerName || '—'}</Text>
            <Text style={type.meta}>{order.customerPhone || 'No phone'}</Text>
            {order.customerEmail ? <Text style={type.meta}>{order.customerEmail}</Text> : null}

            <Text style={styles.section}>Items</Text>
            {order.items?.map((line) => (
              <View key={line.id} style={styles.line}>
                <Text style={type.productName}>{line.productName}</Text>
                <Text style={type.sku}>
                  {line.quantity} × {line.sellingUnit || 'unit'} · {formatRwf(line.unitPrice)}
                  {showCost && line.unitCost != null ? ` · cost ${formatRwf(line.unitCost)}` : ''}
                </Text>
                <Text style={type.lineTotal}>{formatRwf(line.lineTotal)}</Text>
              </View>
            ))}

            <Text style={styles.section}>Payment</Text>
            <Text style={styles.value}>
              {order.paymentMethod === 'momo'
                ? order.channel === 'pos'
                  ? 'In-person MoMo (POS)'
                  : 'Customer online MoMo'
                : order.paymentMethod === 'cash'
                  ? 'Cash'
                  : order.paymentMethod || '—'}
            </Text>
            <Text style={type.meta}>{paymentLabel(order.paymentStatus)}</Text>
            <Text style={type.meta}>Reference {order.payment?.referenceNumber || '—'}</Text>
            <Text style={type.meta}>Submitted {formatWhen(order.payment?.submittedAt)}</Text>
            {order.payment?.reviewedBy || order.payment?.reviewedAt ? (
              <Text style={type.meta}>
                Reviewed by {order.payment.reviewedBy || '—'} · {formatWhen(order.payment.reviewedAt)}
              </Text>
            ) : null}
            <ProofViewer url={order.payment?.proofUrl} />

            {canReview && pending && isOnlineOrder ? (
              <View style={styles.reviewBox}>
                <Text style={type.heading}>MoMo payment needs review</Text>
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
                  label="Approve"
                  loading={review.isPending && review.variables?.decision === 'approve'}
                  onPress={() => review.mutate({ decision: 'approve', adminNotes: notes || undefined })}
                />
                <PrimaryButton
                  label="Reject"
                  tone="danger"
                  loading={review.isPending && review.variables?.decision === 'reject'}
                  onPress={() => review.mutate({ decision: 'reject', adminNotes: notes || undefined })}
                />
              </View>
            ) : null}

            {canFulfill && paid ? (
              <View style={styles.fulfillBox}>
                <Text style={type.heading}>Fulfillment</Text>
                <View style={styles.statusRow}>
                  {FULFILLMENT_STATUSES.map((status) => (
                    <Pressable
                      key={status}
                      onPress={() => setNextStatus(status)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: nextStatus === status }}
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
              </View>
            ) : null}
          </>
        ) : null}
      </ScreenState>
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: { gap: 6, marginBottom: 8 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  section: { ...type.heading, marginTop: 18, marginBottom: 4 },
  value: type.productName,
  line: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    gap: 2,
  },
  notes: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: space.sm,
    textAlignVertical: 'top',
    color: colors.navy,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  error: { color: colors.red },
  reviewBox: { gap: 10, marginTop: 16 },
  fulfillBox: { gap: 10, marginTop: 16 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipLabel: { ...type.status, color: colors.slate },
  chipLabelOn: { color: colors.white },
})
