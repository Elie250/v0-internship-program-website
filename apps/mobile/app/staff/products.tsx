import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useBackToMore } from '@/src/navigation/use-back-to-more'
import { useProductLookup } from '@/src/features/pos/hooks'
import { useSessionStore } from '@/src/auth/session-store'
import { canManageProducts, canViewProductCost, canEditSellingPrice } from '@/src/permissions'
import { createStaffProduct, updateStaffProduct } from '@/src/api/staff'
import { Input } from '@/src/ui/Input'
import { PrimaryButton } from '@/src/ui/Button'
import { formatRwf } from '@/src/format'
import { ProductSearchField } from '@/src/ui/SearchField'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { RequireStaffNav } from '@/src/ui/RequireStaffNav'
import { colors, font, radius, space, type } from '@/src/theme'

export default function ProductsScreen() {
  return (
    <RequireStaffNav navKey="products">
      <ProductsBody />
    </RequireStaffNav>
  )
}

function ProductsBody() {
  useBackToMore()
  const [q, setQ] = useState('')
  const [submitted, setSubmitted] = useState('')
  const user = useSessionStore((s) => s.user)
  const showCost = canViewProductCost(user?.permissions)
  const canManage = canManageProducts(user?.permissions)
  const canPrice = canEditSellingPrice(user?.permissions)
  const [createName, setCreateName] = useState('')
  const [createPrice, setCreatePrice] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const query = useProductLookup({ q: submitted || undefined }, true)

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Text style={type.kicker}>Energy & Logics</Text>
      <Text style={type.screenTitle}>Products</Text>
      <ProductSearchField
        value={q}
        onChange={setQ}
        onSubmit={() => setSubmitted(q.trim())}
      />
      {canManage ? (
        <View style={styles.create}>
          <Input label="New product name" value={createName} onChangeText={setCreateName} />
          {canPrice ? (
            <Input
              label="Selling price"
              value={createPrice}
              onChangeText={setCreatePrice}
              keyboardType="number-pad"
            />
          ) : null}
          <PrimaryButton
            label="Create product"
            disabled={busy}
            onPress={async () => {
              setBusy(true)
              setMessage('')
              try {
                await createStaffProduct({
                  name: createName,
                  price: createPrice ? Number(createPrice) : undefined,
                })
                setCreateName('')
                setCreatePrice('')
                setMessage('Product created.')
                void query.refetch()
              } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Create failed')
              } finally {
                setBusy(false)
              }
            }}
          />
          {message ? <Text style={type.helper}>{message}</Text> : null}
        </View>
      ) : null}
      <ScreenState
        loading={query.isLoading}
        error={query.error?.message}
        errorTitle="Couldn't load products"
        empty={(query.data?.items.length ?? 0) === 0}
        emptyTitle="No products found"
        emptyBody="Try another name or SKU."
        onRetry={() => void query.refetch()}
      >
        <View style={styles.list}>
          {(query.data?.items ?? []).map((product, index, all) => (
            <View
              key={product.id}
              style={[styles.row, index < all.length - 1 && styles.rowLine]}
            >
              <Text style={type.productName} numberOfLines={2} maxFontSizeMultiplier={1.3}>
                {product.name}
              </Text>
              <Text style={type.metadata} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                {product.sku || 'No SKU'} · {product.sellingUnit || product.sellingUnitLabel}
              </Text>
              <View style={styles.metaRow}>
                <Text style={type.price} maxFontSizeMultiplier={1.3}>
                  {formatRwf(product.price)}
                </Text>
                <Text
                  style={[type.helper, product.stock <= 0 && styles.out]}
                  maxFontSizeMultiplier={1.3}
                >
                  Stock {product.stock}
                </Text>
              </View>
              {showCost && product.costPrice != null ? (
                <Text style={type.helper}>Cost {formatRwf(product.costPrice)}</Text>
              ) : null}
              {canManage && product.status !== 'archived' ? (
                <Text
                  style={styles.archive}
                  onPress={() => {
                    void updateStaffProduct(product.id, { status: 'archived' }).then(() =>
                      query.refetch()
                    )
                  }}
                >
                  Archive
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </ScreenState>
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: space.md,
    paddingVertical: space.s12,
    minHeight: 72,
    gap: 4,
    justifyContent: 'center',
  },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm },
  out: { color: colors.danger },
  create: { gap: space.sm, marginBottom: space.md },
  archive: { color: colors.danger, fontFamily: font.semibold, fontSize: 13 },
})
