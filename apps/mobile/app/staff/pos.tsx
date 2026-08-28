import { useEffect, useMemo, useState } from 'react'
import {
  BackHandler,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSessionStore } from '@/src/auth/session-store'
import { useProductLookup, useCreatePosSale } from '@/src/features/pos/hooks'
import { confirmTillSale } from '@/src/features/pos/confirm-sale'
import { CartBar } from '@/src/features/pos/CartBar'
import { CartLineRow } from '@/src/features/pos/CartLineRow'
import { ProductRow } from '@/src/features/pos/ProductRow'
import { cartPreview, usePosCart } from '@/src/features/pos/cart-store'
import { formatRwf } from '@/src/format'
import { PrimaryButton } from '@/src/ui/Button'
import { FilterChips } from '@/src/ui/FilterChips'
import { PaymentMethodPicker } from '@/src/ui/PaymentMethodPicker'
import { ProductSearchField } from '@/src/ui/SearchField'
import { ScreenState } from '@/src/ui/Screen'
import { RequireStaffNav } from '@/src/ui/RequireStaffNav'
import { colors, space, type } from '@/src/theme'

export default function PosScreen() {
  return (
    <RequireStaffNav navKey="pos">
      <PosBody />
    </RequireStaffNav>
  )
}

function PosBody() {
  const user = useSessionStore((s) => s.user)
  const insets = useSafeAreaInsets()
  const [q, setQ] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [barcode, setBarcode] = useState<string | undefined>()
  const [categoryId, setCategoryId] = useState('all')
  const [method, setMethod] = useState<'cash' | 'momo'>('cash')
  const [phase, setPhase] = useState<'browse' | 'checkout'>('browse')
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [categoryChips, setCategoryChips] = useState<{ id: string; label: string }[]>([
    { id: 'all', label: 'All' },
  ])

  const lines = usePosCart((s) => s.lines)
  const addProduct = usePosCart((s) => s.addProduct)
  const setQuantity = usePosCart((s) => s.setQuantity)
  const remove = usePosCart((s) => s.remove)
  const clear = usePosCart((s) => s.clear)
  const lookup = useProductLookup(
    {
      q: submitted || undefined,
      barcode,
      categoryId: categoryId === 'all' ? undefined : categoryId,
    },
    true
  )
  const sale = useCreatePosSale()
  const preview = useMemo(() => cartPreview(lines), [lines])
  const staffName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email
  const products = lookup.data?.items

  useEffect(() => {
    const timer = setTimeout(() => {
      setBarcode(undefined)
      setSubmitted(q.trim())
    }, 280)
    return () => clearTimeout(timer)
  }, [q])

  useEffect(() => {
    if (categoryId !== 'all') return
    if (!products) return
    const next: { id: string; label: string }[] = [{ id: 'all', label: 'All' }]
    const seen = new Set<string>()
    for (const product of products) {
      if (product.categoryId && product.category?.name && !seen.has(product.categoryId)) {
        seen.add(product.categoryId)
        next.push({ id: product.categoryId, label: product.category.name })
      }
    }
    setCategoryChips((current) => {
      if (
        current.length === next.length &&
        current.every((chip, index) => chip.id === next[index].id && chip.label === next[index].label)
      ) {
        return current
      }
      return next
    })
  }, [categoryId, products])

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true))
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false))
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  useEffect(() => {
    if (phase !== 'checkout') return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setPhase('browse')
      return true
    })
    return () => sub.remove()
  }, [phase])

  const showCartBar = phase === 'browse' && lines.length > 0 && !keyboardOpen

  function submitSale() {
    if (lines.length === 0 || sale.isPending) return
    sale.mutate({ paymentMethod: method, customerName: 'Walk-in customer' })
  }

  function requestSale() {
    if (lines.length === 0 || sale.isPending) return
    confirmTillSale({
      paymentMethod: method,
      total: preview.payableTotal,
      lines: lines.map((line) => ({ name: line.name, quantity: line.quantity })),
      onConfirm: submitSale,
    })
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={type.kicker}>Energy & Logics</Text>
          <Text style={type.screenTitle}>POS</Text>
        </View>
        <View style={styles.staff}>
          <Text style={type.staff} numberOfLines={1}>
            {staffName}
          </Text>
          <Text style={styles.live}>Till online</Text>
        </View>
      </View>

      {phase === 'browse' ? (
        <>
          <View style={styles.searchBlock}>
            <ProductSearchField
              value={q}
              onChange={setQ}
              placeholder="Search products or SKU"
              onSubmit={() => {
                setBarcode(undefined)
                setSubmitted(q.trim())
              }}
              onScan={() => router.push('/staff/scan')}
            />
          </View>
          <View style={styles.chips}>
            <FilterChips items={categoryChips} selectedId={categoryId} onSelect={setCategoryId} />
          </View>
          <View style={styles.listWrap}>
            <ScreenState
              fill
              loading={lookup.isLoading && !lookup.data}
              error={lookup.error?.message}
              empty={!lookup.isLoading && (products?.length ?? 0) === 0}
              emptyTitle="No products found"
              emptyBody="Try another name, SKU, or category."
              onRetry={() => void lookup.refetch()}
            >
              <FlatList
                data={products ?? []}
                keyExtractor={(item) => item.id}
                style={styles.listFlex}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                  <ProductRow product={item} onAdd={() => addProduct(item)} />
                )}
                ItemSeparatorComponent={() => <View style={styles.hairline} />}
              />
            </ScreenState>
          </View>
          {showCartBar ? (
            <CartBar
              itemCount={lines.reduce((sum, line) => sum + line.quantity, 0)}
              total={preview.payableTotal}
              onPress={() => {
                Keyboard.dismiss()
                setPhase('checkout')
              }}
            />
          ) : null}
        </>
      ) : (
        <>
          <FlatList
            data={lines}
            keyExtractor={(line) => line.productId}
            style={styles.listFlex}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.checkoutList}
            ListHeaderComponent={
              <View style={styles.checkoutHead}>
                <Pressable
                  onPress={() => setPhase('browse')}
                  accessibilityRole="button"
                  accessibilityLabel="Back to products"
                  style={styles.back}
                >
                  <Text style={styles.backLabel}>← Products</Text>
                </Pressable>
                <Text style={type.screenTitle}>Checkout</Text>
              </View>
            }
            renderItem={({ item }) => (
              <CartLineRow
                line={item}
                onDecrease={() => setQuantity(item.productId, item.quantity - 1)}
                onIncrease={() => setQuantity(item.productId, item.quantity + 1)}
                onRemove={() => remove(item.productId)}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.emptyCart}>Cart is empty. Add products to continue.</Text>
            }
            ListFooterComponent={
              <View style={styles.totals}>
                <View style={styles.totalRow}>
                  <Text style={type.meta}>Subtotal</Text>
                  <Text style={type.price}>{formatRwf(preview.listSubtotal)}</Text>
                </View>
                {preview.discountTotal > 0 ? (
                  <View style={styles.totalRow}>
                    <Text style={type.meta}>Discount</Text>
                    <Text style={type.price}>-{formatRwf(preview.discountTotal)}</Text>
                  </View>
                ) : null}
                <View style={styles.totalRow}>
                  <Text style={type.heading}>Total</Text>
                  <Text style={type.total}>{formatRwf(preview.payableTotal)}</Text>
                </View>
                <Text style={styles.previewNote}>
                  Preview only — the server confirms the total, stock, and payment state.
                </Text>
              </View>
            }
          />
          <View style={styles.checkoutActions}>
            <Text style={type.heading}>Payment</Text>
            <PaymentMethodPicker value={method} onChange={setMethod} disabled={sale.isPending} />
            {method === 'cash' ? (
              <Text style={styles.flowNote}>Cash payment. Confirm sale to complete at the till.</Text>
            ) : (
              <Text style={styles.flowNote}>
                MoMo payment. Record MoMo payment at the till. This does not approve a customer
                online payment.
              </Text>
            )}
            {sale.error ? <Text style={styles.error}>{sale.error.message}</Text> : null}
            {sale.data?.success && lines.length === 0 ? (
              <View style={styles.success}>
                <Text style={styles.ok}>
                  Sale {sale.data.orderNumber}
                  {sale.data.totalAmount != null ? ` · ${formatRwf(sale.data.totalAmount)}` : ''}
                </Text>
                <Text style={styles.ok}>
                  {sale.data.paymentStatus === 'pending_review'
                    ? 'Pending review'
                    : sale.data.paymentStatus === 'paid'
                      ? 'Paid'
                      : sale.data.paymentStatus || (method === 'momo' ? 'Pending review' : 'Paid')}
                </Text>
              </View>
            ) : null}
            <PrimaryButton
              label={method === 'momo' ? 'Record MoMo payment' : 'Confirm sale'}
              tone={method === 'momo' ? 'amber' : 'navy'}
              disabled={lines.length === 0 || sale.isPending}
              loading={sale.isPending}
              onPress={requestSale}
            />
            <Pressable
              onPress={() => clear()}
              disabled={sale.isPending}
              accessibilityRole="button"
              accessibilityLabel="Clear cart"
              style={({ pressed }) => [styles.clearHit, pressed && styles.clearPressed]}
            >
              <Text style={styles.clearLabel}>Clear cart</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: space.md,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.md,
    alignItems: 'flex-end',
  },
  headerCopy: { flex: 1 },
  staff: { maxWidth: '44%', alignItems: 'flex-end' },
  live: { ...type.status, color: colors.green },
  searchBlock: { paddingHorizontal: space.md, paddingBottom: 8 },
  chips: { paddingLeft: space.md, paddingBottom: 8 },
  listWrap: { flex: 1, backgroundColor: colors.card },
  listFlex: { flex: 1 },
  list: { paddingBottom: 8 },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: 70 },
  checkoutList: { paddingBottom: 16 },
  checkoutActions: {
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  checkoutHead: {
    paddingHorizontal: space.md,
    gap: 2,
    marginBottom: space.sm,
  },
  back: { minHeight: 44, justifyContent: 'center' },
  backLabel: { ...type.heading, color: colors.navy },
  emptyCart: { ...type.meta, paddingHorizontal: space.md, paddingVertical: 24 },
  totals: {
    marginTop: space.md,
    marginHorizontal: space.md,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    gap: 8,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewNote: { ...type.sku, marginTop: 4 },
  flowNote: { ...type.meta, color: colors.slate },
  error: { color: colors.red, fontSize: 14 },
  clearHit: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  clearPressed: { opacity: 0.7 },
  clearLabel: { ...type.heading, color: colors.slate },
  success: {
    backgroundColor: colors.greenSoft,
    borderRadius: 12,
    padding: space.md,
    gap: 4,
  },
  ok: { color: colors.green, fontWeight: '600' },
})
