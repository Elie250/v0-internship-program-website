import { Link } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useOrdersQuery, isPendingPayment, paymentLabel } from '@/src/features/orders/hooks'
import { formatRwf, formatWhen } from '@/src/format'
import { Card } from '@/src/ui/Card'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { StatusBadge } from '@/src/ui/StatusBadge'
import { RequireStaffNav } from '@/src/ui/RequireStaffNav'
import { colors, space } from '@/src/theme'

export default function OrdersListScreen() {
  return (
    <RequireStaffNav navKey="orders">
      <OrdersListBody />
    </RequireStaffNav>
  )
}

function OrdersListBody() {
  const pending = useOrdersQuery({
    channel: 'online',
    payment_status: 'pending_review',
    page: 1,
    limit: 25,
  })
  const rest = useOrdersQuery({ channel: 'online', page: 1, limit: 25 })

  const pendingItems = pending.data?.items ?? []
  const otherItems = (rest.data?.items ?? []).filter(
    (row) => !isPendingPayment(row.paymentStatus) && !isPendingPayment(row.payment?.status)
  )

  return (
    <Screen
      refreshing={pending.isRefetching || rest.isRefetching}
      onRefresh={() => {
        void pending.refetch()
        void rest.refetch()
      }}
    >
      <Text style={styles.section}>Pending MoMo</Text>
      <ScreenState
        loading={pending.isLoading}
        error={pending.error?.message}
        empty={pendingItems.length === 0}
        emptyTitle="No payments waiting"
        emptyBody="New online MoMo orders will appear here."
        onRetry={() => void pending.refetch()}
      >
        {pendingItems.map((order) => (
          <OrderRow
            key={order.id}
            id={order.id}
            number={order.orderNumber}
            customer={order.customerName}
            phone={order.customerPhone}
            amount={order.totalAmount}
            when={order.orderDate || order.createdAt}
            payment={paymentLabel(order.paymentStatus)}
            tone="amber"
          />
        ))}
      </ScreenState>

      <Text style={styles.section}>Fulfillment</Text>
      <ScreenState
        loading={rest.isLoading}
        error={rest.error?.message}
        empty={otherItems.length === 0}
        emptyTitle="No other online orders"
        onRetry={() => void rest.refetch()}
      >
        {otherItems.map((order) => (
          <OrderRow
            key={order.id}
            id={order.id}
            number={order.orderNumber}
            customer={order.customerName}
            phone={order.customerPhone}
            amount={order.totalAmount}
            when={order.orderDate || order.createdAt}
            payment={paymentLabel(order.paymentStatus)}
            tone={order.paymentStatus === 'paid' ? 'green' : 'slate'}
          />
        ))}
      </ScreenState>
    </Screen>
  )
}

function OrderRow({
  id,
  number,
  customer,
  phone,
  amount,
  when,
  payment,
  tone,
}: {
  id: string
  number: string | null
  customer: string | null
  phone: string | null
  amount: number
  when: string | null
  payment: string
  tone: 'amber' | 'green' | 'slate'
}) {
  return (
    <Link href={`/staff/orders/${id}`} asChild>
      <Pressable>
        <Card>
          <View style={styles.rowTop}>
            <Text style={styles.number}>{number || 'Order'}</Text>
            <StatusBadge label={payment} tone={tone} />
          </View>
          <Text style={styles.customer}>{customer || 'Customer'}</Text>
          {phone ? <Text style={styles.meta}>{phone}</Text> : null}
          <View style={styles.rowTop}>
            <Text style={styles.amount}>{formatRwf(amount)}</Text>
            <Text style={styles.meta}>{formatWhen(when)}</Text>
          </View>
        </Card>
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  section: { fontSize: 13, fontWeight: '800', color: colors.muted, letterSpacing: 0.4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  number: { fontSize: 16, fontWeight: '800', color: colors.navy },
  customer: { fontSize: 15, fontWeight: '600', color: colors.slate },
  amount: { fontSize: 16, fontWeight: '800', color: colors.navy },
  meta: { color: colors.muted, fontSize: 13 },
})
