import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text } from 'react-native'
import { useOrdersQuery, paymentLabel } from '@/src/features/orders/hooks'
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
  const router = useRouter()
  const query = useOrdersQuery({ page: 1, limit: 25 })
  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.note}>Sales history. Edits and refunds are not available here.</Text>
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
            onPress={() => router.push(`/staff/orders/${row.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${row.orderNumber || 'sale'}`}
          >
            <Card>
              <Text style={type.orderRef}>{row.orderNumber || 'Sale'}</Text>
              <Text style={type.meta}>
                {row.channel} · {paymentLabel(row.paymentStatus)}
              </Text>
              <Text style={type.price}>{formatRwf(row.totalAmount)}</Text>
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
