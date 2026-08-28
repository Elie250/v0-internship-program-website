import { useMemo, useState } from 'react'
import { Link, useRouter } from 'expo-router'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSessionStore } from '@/src/auth/session-store'
import {
  fulfillmentLabel,
  isPendingPayment,
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
        empty={(query.data?.items.length ?? 0) === 0}
        emptyTitle="No orders requiring attention"
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
            <OrderQueueCard
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

function OrderQueueCard({
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
  const isOnlineMomo = order.channel === 'online' && pending
  const review = usePaymentReviewMutation(order.id)
  const tone = pending ? 'amber' : paid ? 'green' : order.status === 'cancelled' ? 'red' : 'slate'

  return (
    <View style={[styles.item, isOnlineMomo && styles.itemAlert]}>
      {isOnlineMomo ? <Text style={styles.alert}>MoMo payment needs review</Text> : null}
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Open ${order.orderNumber || 'order'}`}
        style={({ pressed }) => [styles.press, pressed && styles.pressed]}
      >
        <View style={styles.rowTop}>
          <Text style={type.orderRef} numberOfLines={1}>
            {order.orderNumber || 'Order'}
          </Text>
          <StatusBadge label={paymentLabel(order.paymentStatus)} tone={tone} />
        </View>
        <Text style={styles.customer} numberOfLines={2}>
          {order.customerName || 'Walk-in / customer'}
        </Text>
        {order.customerPhone ? <Text style={type.meta}>{order.customerPhone}</Text> : null}
        <View style={styles.rowTop}>
          <Text style={type.price}>{formatRwf(order.totalAmount)}</Text>
          <Text style={type.meta}>{formatWhen(order.orderDate || order.createdAt)}</Text>
        </View>
        <Text style={type.sku}>{fulfillmentLabel(order.status)}</Text>
      </Pressable>
      {isOnlineMomo ? (
        <View style={styles.actions}>
          {order.payment?.proofUrl ? (
            <PrimaryButton
              label="View proof"
              tone="outline"
              onPress={() => onViewProof(order.payment!.proofUrl!)}
            />
          ) : (
            <Link href={`/staff/orders/${order.id}`} asChild>
              <Pressable style={styles.linkHit}>
                <Text style={styles.link}>View proof</Text>
              </Pressable>
            </Link>
          )}
          {canReview ? (
            <>
              {review.error ? <Text style={styles.error}>{review.error.message}</Text> : null}
              <View style={styles.decisionRow}>
                <View style={styles.decision}>
                  <PrimaryButton
                    label="Approve"
                    loading={review.isPending && review.variables?.decision === 'approve'}
                    disabled={review.isPending}
                    onPress={() => review.mutate({ decision: 'approve' })}
                  />
                </View>
                <View style={styles.decision}>
                  <PrimaryButton
                    label="Reject"
                    tone="danger"
                    loading={review.isPending && review.variables?.decision === 'reject'}
                    disabled={review.isPending}
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
  screen: { flex: 1, backgroundColor: colors.bg },
  head: { paddingHorizontal: space.md, paddingBottom: 6 },
  chips: { paddingLeft: space.md, paddingBottom: 8 },
  list: { backgroundColor: colors.card, paddingBottom: 24 },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: space.md },
  item: { backgroundColor: colors.card, paddingHorizontal: space.md, paddingVertical: 12 },
  itemAlert: {
    borderLeftWidth: 4,
    borderLeftColor: colors.amber,
    backgroundColor: colors.amberSoft,
  },
  press: { gap: 2 },
  pressed: { opacity: 0.85 },
  alert: { ...type.status, color: colors.amber, marginBottom: 6 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.sm,
  },
  customer: { ...type.productName, color: colors.slate },
  actions: { gap: 8, marginTop: 10 },
  decisionRow: { flexDirection: 'row', gap: 8 },
  decision: { flex: 1 },
  linkHit: { minHeight: 44, justifyContent: 'center' },
  link: { color: colors.navy, fontWeight: '600' },
  error: { color: colors.red, fontSize: 13 },
})
