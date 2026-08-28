import { StyleSheet, Text } from 'react-native'
import { useOrdersQuery, paymentLabel } from '@/src/features/orders/hooks'
import { formatRwf, formatWhen } from '@/src/format'
import { Card } from '@/src/ui/Card'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { RequireStaffNav } from '@/src/ui/RequireStaffNav'
import { colors } from '@/src/theme'

export default function SalesScreen() {
  return (
    <RequireStaffNav navKey="sales">
      <SalesBody />
    </RequireStaffNav>
  )
}

function SalesBody() {
  const query = useOrdersQuery({ page: 1, limit: 25 })
  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.note}>Sales history. Edits and refunds are not available here.</Text>
      <ScreenState
        loading={query.isLoading}
        error={query.error?.message}
        empty={(query.data?.items.length ?? 0) === 0}
        emptyTitle="No sales found"
      >
        {(query.data?.items ?? []).map((row) => (
          <Card key={row.id}>
            <Text style={styles.number}>{row.orderNumber || 'Sale'}</Text>
            <Text style={styles.meta}>
              {row.channel} · {paymentLabel(row.paymentStatus)}
            </Text>
            <Text style={styles.amount}>{formatRwf(row.totalAmount)}</Text>
            <Text style={styles.meta}>{formatWhen(row.orderDate || row.createdAt)}</Text>
          </Card>
        ))}
      </ScreenState>
    </Screen>
  )
}

const styles = StyleSheet.create({
  note: { color: colors.muted, fontSize: 13 },
  number: { fontWeight: '800', color: colors.navy, fontSize: 16 },
  meta: { color: colors.muted },
  amount: { fontWeight: '800', fontSize: 18, color: colors.navy },
})
