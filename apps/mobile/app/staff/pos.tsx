import { useMemo, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { useProductLookup, useCreatePosSale } from '@/src/features/pos/hooks'
import { cartPreview, usePosCart } from '@/src/features/pos/cart-store'
import { formatRwf } from '@/src/format'
import { PrimaryButton } from '@/src/ui/Button'
import { Card } from '@/src/ui/Card'
import { ProductSearchField } from '@/src/ui/SearchField'
import { Screen } from '@/src/ui/Screen'
import { RequireStaffNav } from '@/src/ui/RequireStaffNav'
import { colors, space } from '@/src/theme'

export default function PosScreen() {
  return (
    <RequireStaffNav navKey="pos">
      <PosBody />
    </RequireStaffNav>
  )
}

function PosBody() {
  const [q, setQ] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [barcode, setBarcode] = useState<string | undefined>()
  const [method, setMethod] = useState<'cash' | 'momo'>('cash')
  const lines = usePosCart((s) => s.lines)
  const addProduct = usePosCart((s) => s.addProduct)
  const setQuantity = usePosCart((s) => s.setQuantity)
  const clear = usePosCart((s) => s.clear)
  const lookup = useProductLookup(
    { q: submitted || undefined, barcode },
    Boolean(submitted) || Boolean(barcode)
  )
  const sale = useCreatePosSale()
  const preview = useMemo(() => cartPreview(lines), [lines])

  return (
    <Screen>
      <ProductSearchField
        value={q}
        onChange={setQ}
        onSubmit={() => {
          setBarcode(undefined)
          setSubmitted(q.trim())
        }}
        onBarcodePlaceholder={() => {
          Alert.alert(
            'Barcode scan',
            'Camera scanning will be added later. Search by barcode in the box for now.'
          )
        }}
      />

      {lookup.isFetching ? <Text style={styles.meta}>Searching…</Text> : null}
      {lookup.error ? <Text style={styles.error}>{lookup.error.message}</Text> : null}
      {(lookup.data?.items ?? []).map((product) => (
        <Pressable key={product.id} onPress={() => addProduct(product)}>
          <Card>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.meta}>
              {product.sellingUnitLabel} · stock {product.stock}
            </Text>
            <Text style={styles.amount}>{formatRwf(product.price - (product.discount || 0))}</Text>
          </Card>
        </Pressable>
      ))}

      <Text style={styles.section}>Cart</Text>
      {lines.length === 0 ? (
        <Text style={styles.meta}>Add products to start a sale.</Text>
      ) : (
        lines.map((line) => (
          <Card key={line.productId}>
            <Text style={styles.name}>{line.name}</Text>
            <Text style={styles.meta}>{line.sellingUnitLabel}</Text>
            <View style={styles.qtyRow}>
              <Pressable onPress={() => setQuantity(line.productId, line.quantity - 1)} style={styles.qtyBtn}>
                <Text style={styles.qtyText}>−</Text>
              </Pressable>
              <Text style={styles.qty}>{line.quantity}</Text>
              <Pressable onPress={() => setQuantity(line.productId, line.quantity + 1)} style={styles.qtyBtn}>
                <Text style={styles.qtyText}>+</Text>
              </Pressable>
            </View>
          </Card>
        ))
      )}

      <Card>
        <Text style={styles.meta}>Preview only — the server confirms the total.</Text>
        <Text style={styles.amount}>{formatRwf(preview.payableTotal)}</Text>
        <View style={styles.qtyRow}>
          <Pressable onPress={() => setMethod('cash')} style={[styles.chip, method === 'cash' && styles.chipOn]}>
            <Text style={[styles.chipLabel, method === 'cash' && styles.chipLabelOn]}>Cash</Text>
          </Pressable>
          <Pressable onPress={() => setMethod('momo')} style={[styles.chip, method === 'momo' && styles.chipOn]}>
            <Text style={[styles.chipLabel, method === 'momo' && styles.chipLabelOn]}>MoMo</Text>
          </Pressable>
        </View>
        {sale.error ? <Text style={styles.error}>{sale.error.message}</Text> : null}
        {sale.data?.success ? (
          <Text style={styles.ok}>Sale {sale.data.orderNumber} · {formatRwf(sale.data.totalAmount ?? 0)}</Text>
        ) : null}
        <PrimaryButton
          label="Confirm sale"
          disabled={lines.length === 0}
          loading={sale.isPending}
          onPress={() => sale.mutate({ paymentMethod: method, customerName: 'Walk-in customer' })}
        />
        <PrimaryButton label="Clear cart" tone="outline" onPress={() => clear()} />
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  section: { fontWeight: '800', color: colors.muted, marginTop: space.sm },
  name: { fontWeight: '700', color: colors.navy, fontSize: 16 },
  meta: { color: colors.muted },
  amount: { fontWeight: '800', fontSize: 20, color: colors.navy },
  error: { color: colors.red },
  ok: { color: colors.green, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 22, color: colors.navy, fontWeight: '700' },
  qty: { fontSize: 18, fontWeight: '800', minWidth: 24, textAlign: 'center' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.bg,
  },
  chipOn: { backgroundColor: colors.navy },
  chipLabel: { fontWeight: '700', color: colors.navy },
  chipLabelOn: { color: colors.white },
})
