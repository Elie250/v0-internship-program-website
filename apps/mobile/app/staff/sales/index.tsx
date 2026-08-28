import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text } from 'react-native'
import { useBackToMore } from '@/src/navigation/use-back-to-more'
import { useOrdersQuery, paymentLabel } from '@/src/features/orders/hooks'
import { refundStatusLabel } from '@/src/features/refunds/policy'
import { formatRwf, formatWhen } from '@/src/format'
import { Card } from '@/src/ui/Card'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { RequireStaffNav } from '@/src/ui/RequireStaffNav'
import { type } from '@/src/theme'

export default function SalesScreen() {
  return (
    <RequireStaffNav navKey="sales">
      <SalesBody />
    </RequireStaffNav>
  )
}

function SalesBody() {
  useBackToMore()
  const router = useRouter()
  const query = useOrdersQuery({ page: 1, limit: 25 })
  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.note}>
        Sales history. Original totals are never edited. Refunds are recorded separately.
      </Text>
      <ScreenState
        loading={query.isLoading}
        error={query.error?.message}
        empty={(query.data?.items.length ?? 0) === 0}
        emptyTitle="No sales found"
        emptyBody="Completed till and online sales will appear here."
      >
        {(query.data?.items ?? []).map((row) => (
          <Pressable
            key={row.id}
            onPress={() => router.push(`/staff/sales/${row.id}` as never)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${row.orderNumber || 'sale'}`}
          >
            <Card>
              <Text style={type.orderRef}>{row.orderNumber || 'Sale'}</Text>
              <Text style={type.meta}>
                {row.channel} · {String(row.paymentMethod || '—').toUpperCase()} ·{' '}
                {paymentLabel(row.paymentStatus)} · {formatRwf(row.totalAmount)}
              </Text>
              <Text style={type.meta}>{refundStatusLabel(row.refundStatus)}</Text>
              <Text style={type.meta}>{formatWhen(row.orderDate || row.createdAt)}</Text>
            </Card>
          </Pressable>
        ))}
      </ScreenState>
    </Screen>
  )
}

const styles = StyleSheet.create({
  note: type.meta,
})
