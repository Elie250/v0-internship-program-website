import { useMemo, useState } from 'react'
import { Link, useRouter } from 'expo-router'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSessionStore } from '@/src/auth/session-store'
import {
  fulfillmentLabel,
  isPendingPayment,
  needsShopPaymentReview,
  paymentLabel,
  useOrdersQuery,
} from '@/src/features/orders/hooks'
import { usePaymentReviewMutation } from '@/src/features/payments/hooks'
import { canReviewShopPayments } from '@/src/permissions'
import { formatRwf, formatWhen } from '@/src/format'
import { PrimaryButton } from '@/src/ui/Button'
import { FilterChips } from '@/src/ui/FilterChips'
import { ProofViewer } from '@/src/ui/ProofViewer'
import { ScreenState } from '@/src/ui/Screen'
import { StatusBadge } from '@/src/ui/StatusBadge'
import { RequireStaffNav } from '@/src/ui/RequireStaffNav'
import { colors, space, type } from '@/src/theme'
import type { StaffOrderSummary } from '@/src/api/types'

const QUEUE_CHIPS = [
  { id: 'pending_payment', label: 'Pending payment' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'ready_for_pickup', label: 'Ready for pickup' },
  { id: 'out_for_delivery', label: 'Out for delivery' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
] as const

export default function OrdersListScreen() {
  return (
    <RequireStaffNav navKey="orders">
      <OrdersListBody />
    </RequireStaffNav>
  )
}

function OrdersListBody() {
  const user = useSessionStore((s) => s.user)
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [filter, setFilter] = useState<string>('pending_payment')
  const [proofUrl, setProofUrl] = useState<string | null>(null)
  const canReview = canReviewShopPayments(user?.permissions)

  const queryParams = useMemo(() => {
    if (filter === 'pending_payment') {
      return { payment_status: 'pending_review', page: 1, limit: 40 }
    }
    return { status: filter, page: 1, limit: 40 }
  }, [filter])

  const query = useOrdersQuery(queryParams)

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.head}>
        <Text style={type.kicker}>Energy & Logics</Text>
        <Text style={type.screenTitle}>Orders</Text>
      </View>
      <View style={styles.chips}>
        <FilterChips items={[...QUEUE_CHIPS]} selectedId={filter} onSelect={setFilter} />
      </View>
      <ScreenState
        fill
        loading={query.isLoading && !query.data}
        error={query.error?.message}
        errorTitle="Couldn't load orders"
        empty={(query.data?.items.length ?? 0) === 0}
        emptyTitle="No orders yet"
        emptyBody="Orders in this status will appear here."
        onRetry={() => void query.refetch()}
      >
        <FlatList
          data={query.data?.items ?? []}
          keyExtractor={(order) => order.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />
          }
          ItemSeparatorComponent={() => <View style={styles.hairline} />}
          renderItem={({ item }) => (
            <OrderQueueRow
              order={item}
              canReview={canReview}
              onOpen={() => router.push(`/staff/orders/${item.id}`)}
              onViewProof={(url) => setProofUrl(url)}
            />
          )}
        />
      </ScreenState>
      {proofUrl ? <ProofViewer url={proofUrl} startOpen onClose={() => setProofUrl(null)} /> : null}
    </View>
  )
}

function OrderQueueRow({
  order,
  canReview,
  onOpen,
  onViewProof,
}: {
  order: StaffOrderSummary
  canReview: boolean
  onOpen: () => void
  onViewProof: (url: string) => void
}) {
  const pending = isPendingPayment(order.paymentStatus) || isPendingPayment(order.payment?.status)
  const paid = order.paymentStatus === 'paid' || order.payment?.status === 'approved'
  const needsReview = needsShopPaymentReview(order)
  const review = usePaymentReviewMutation(order.id)
  const tone = pending ? 'amber' : paid ? 'green' : order.status === 'cancelled' ? 'red' : 'slate'
  const recede = paid || order.status === 'completed'

  return (
    <View style={[styles.item, needsReview && styles.itemAlert, recede && styles.itemRecede]}>
      {needsReview ? (
        <View style={styles.alertRow}>
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={colors.warning}
            importantForAccessibility="no"
          />
          <Text style={styles.alert}>MoMo payment needs review</Text>
        </View>
      ) : null}
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Open ${order.orderNumber || 'order'}, ${order.customerName || 'customer'}, ${formatRwf(order.totalAmount)}, ${paymentLabel(order.paymentStatus)}`}
        style={({ pressed }) => [styles.press, pressed && styles.pressed]}
      >
        <View style={styles.rowTop}>
          <Text style={type.orderRef} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {order.orderNumber || 'Order'}
          </Text>
          <StatusBadge label={paymentLabel(order.paymentStatus)} tone={tone} />
        </View>
        <Text style={styles.customer} numberOfLines={2} maxFontSizeMultiplier={1.3}>
          {order.customerName || 'Walk-in / customer'}
        </Text>
        {order.customerPhone ? <Text style={type.helper}>{order.customerPhone}</Text> : null}
        <View style={styles.rowTop}>
          <Text style={type.price} maxFontSizeMultiplier={1.3}>
            {formatRwf(order.totalAmount)}
          </Text>
          <Text style={type.helper}>{formatWhen(order.orderDate || order.createdAt)}</Text>
        </View>
        <Text style={type.sku}>{fulfillmentLabel(order.status)}</Text>
      </Pressable>
      {needsReview ? (
        <View style={styles.actions}>
          {order.payment?.proofUrl ? (
            <PrimaryButton
              label="View proof"
              variant="secondary"
              onPress={() => onViewProof(order.payment!.proofUrl!)}
            />
          ) : (
            <Link href={`/staff/orders/${order.id}`} asChild>
              <Pressable style={styles.linkHit} accessibilityRole="button" accessibilityLabel="View proof">
                <Text style={styles.link}>View proof</Text>
              </Pressable>
            </Link>
          )}
          {canReview ? (
            <>
              {review.error ? <Text style={styles.error}>{review.error.message}</Text> : null}
              <Text style={type.helper}>Approve or reject on the order, or use the actions below.</Text>
              <View style={styles.decisionRow}>
                <View style={styles.decision}>
                  <PrimaryButton
                    label="Approve"
                    loading={review.isPending && review.variables?.decision === 'approve'}
                    disabled={review.isPending}
                    accessibilityLabel={`Approve MoMo payment for ${order.orderNumber || 'order'}`}
                    onPress={() => review.mutate({ decision: 'approve' })}
                  />
                </View>
                <View style={styles.decision}>
                  <PrimaryButton
                    label="Reject"
                    variant="danger"
                    loading={review.isPending && review.variables?.decision === 'reject'}
                    disabled={review.isPending}
                    accessibilityLabel={`Reject MoMo payment for ${order.orderNumber || 'order'}`}
                    onPress={() => review.mutate({ decision: 'reject' })}
                  />
                </View>
              </View>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  head: { paddingHorizontal: space.md, paddingBottom: space.xs },
  chips: { paddingLeft: space.md, paddingBottom: space.sm },
  list: { backgroundColor: colors.surface, paddingBottom: space.lg },
  hairline: { height: 1, backgroundColor: colors.divider, marginLeft: space.md },
  item: { backgroundColor: colors.surface, paddingHorizontal: space.md, paddingVertical: space.sm },
  itemAlert: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    backgroundColor: colors.warningSubtle,
  },
  itemRecede: { opacity: 0.72 },
  press: { gap: 2 },
  pressed: { opacity: 0.85 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  alert: { ...type.status, color: colors.warning },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.sm,
  },
  customer: { ...type.bodyMedium, color: colors.textSecondary },
  actions: { gap: space.sm, marginTop: space.sm },
  decisionRow: { flexDirection: 'row', gap: space.sm },
  decision: { flex: 1 },
  linkHit: { minHeight: 48, justifyContent: 'center' },
  link: { ...type.buttonSmall, color: colors.primary },
  error: type.error,
})
