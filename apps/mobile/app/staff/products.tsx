import { useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { useProductLookup } from '@/src/features/pos/hooks'
import { useSessionStore } from '@/src/auth/session-store'
import { canViewProductCost } from '@/src/permissions'
import { formatRwf } from '@/src/format'
import { Card } from '@/src/ui/Card'
import { ProductSearchField } from '@/src/ui/SearchField'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { RequireStaffNav } from '@/src/ui/RequireStaffNav'
import { colors } from '@/src/theme'

export default function ProductsScreen() {
  return (
    <RequireStaffNav navKey="products">
      <ProductsBody />
    </RequireStaffNav>
  )
}

function ProductsBody() {
  const [q, setQ] = useState('')
  const [submitted, setSubmitted] = useState('')
  const user = useSessionStore((s) => s.user)
  const showCost = canViewProductCost(user?.permissions)
  const query = useProductLookup({ q: submitted || undefined }, true)

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <ProductSearchField
        value={q}
        onChange={setQ}
        onSubmit={() => setSubmitted(q.trim())}
      />
      <ScreenState
        loading={query.isLoading}
        error={query.error?.message}
        empty={(query.data?.items.length ?? 0) === 0}
        emptyTitle="No products"
      >
        {(query.data?.items ?? []).map((product) => (
          <Card key={product.id}>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.meta}>
              {product.sku || 'No SKU'} · {product.sellingUnitLabel} · stock {product.stock}
            </Text>
            <Text style={styles.amount}>{formatRwf(product.price)}</Text>
            {showCost && product.costPrice != null ? (
              <Text style={styles.meta}>Cost {formatRwf(product.costPrice)}</Text>
            ) : null}
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
