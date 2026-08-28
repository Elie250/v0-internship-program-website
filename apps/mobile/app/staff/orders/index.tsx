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
import { Card } from '@/src/ui/Card'
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
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
    <Card>
      {isOnlineMomo ? (
        <Text style={styles.alert}>MoMo payment needs review</Text>
      ) : null}
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Open ${order.orderNumber || 'order'}`}>
        <View style={styles.rowTop}>
          <Text style={styles.number}>{order.orderNumber || 'Order'}</Text>
          <StatusBadge label={paymentLabel(order.paymentStatus)} tone={tone} />
        </View>
        <Text style={styles.customer}>{order.customerName || 'Walk-in / customer'}</Text>
        {order.customerPhone ? <Text style={styles.meta}>{order.customerPhone}</Text> : null}
        <Text style={styles.meta}>{fulfillmentLabel(order.status)}</Text>
        <View style={styles.rowTop}>
          <Text style={styles.amount}>{formatRwf(order.totalAmount)}</Text>
          <Text style={styles.meta}>{formatWhen(order.orderDate || order.createdAt)}</Text>
        </View>
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
              <PrimaryButton
                label="Approve"
                loading={review.isPending && review.variables?.decision === 'approve'}
                disabled={review.isPending}
                onPress={() => review.mutate({ decision: 'approve' })}
              />
              <PrimaryButton
                label="Reject"
                tone="danger"
                loading={review.isPending && review.variables?.decision === 'reject'}
                disabled={review.isPending}
                onPress={() => review.mutate({ decision: 'reject' })}
              />
            </>
          ) : null}
        </View>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  head: { paddingHorizontal: space.md, paddingBottom: space.sm },
  chips: { paddingLeft: space.md, paddingBottom: space.sm },
  list: { paddingHorizontal: space.md, paddingBottom: 24 },
  alert: {
    color: colors.amber,
    fontWeight: '800',
    fontSize: 13,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.sm,
  },
  number: { fontSize: 16, fontWeight: '800', color: colors.navy, flexShrink: 1 },
  customer: { fontSize: 15, fontWeight: '600', color: colors.slate },
  amount: { fontSize: 16, fontWeight: '800', color: colors.navy },
  meta: { color: colors.muted, fontSize: 13 },
  actions: { gap: 8, marginTop: 4 },
  linkHit: { minHeight: 44, justifyContent: 'center' },
  link: { color: colors.navy, fontWeight: '700' },
  error: { color: colors.red, fontSize: 13 },
})
