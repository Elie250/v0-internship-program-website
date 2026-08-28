import { StyleSheet, Text } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useBackToMore } from '@/src/navigation/use-back-to-more'
import { fetchInventory } from '@/src/api/staff'
import { formatRwf } from '@/src/format'
import { Card } from '@/src/ui/Card'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { StatusBadge } from '@/src/ui/StatusBadge'
import { RequireStaffNav } from '@/src/ui/RequireStaffNav'
import { colors } from '@/src/theme'

export default function InventoryScreen() {
  return (
    <RequireStaffNav navKey="inventory">
      <InventoryBody />
    </RequireStaffNav>
  )
}

function InventoryBody() {
  useBackToMore()
  const query = useQuery({
    queryKey: ['staff', 'inventory'],
    queryFn: () => fetchInventory({ page: 1, limit: 50 }),
  })

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <ScreenState
        loading={query.isLoading}
        error={query.error?.message}
        empty={(query.data?.items.length ?? 0) === 0}
        emptyTitle="No inventory rows"
        emptyBody="Catalog stock levels will appear here."
      >
        {(query.data?.items ?? []).map((row) => (
          <Card key={row.productId}>
            <Text style={styles.name}>{row.name}</Text>
            <Text style={styles.meta}>{row.sku || 'No SKU'}</Text>
            <Text style={styles.amount}>{row.currentStock} on hand</Text>
            {row.isLowStock ? <StatusBadge label="Low stock" tone="amber" /> : null}
            <Text style={styles.meta}>{formatRwf(row.price)}</Text>
          </Card>
        ))}
      </ScreenState>
    </Screen>
  )
}

const styles = StyleSheet.create({
  name: { fontWeight: '800', color: colors.navy, fontSize: 16 },
  meta: { color: colors.muted },
  amount: { fontWeight: '800', color: colors.navy, fontSize: 18 },
})
