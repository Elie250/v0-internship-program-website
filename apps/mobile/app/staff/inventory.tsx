import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useBackToMore } from '@/src/navigation/use-back-to-more'
import { adjustStaffStock, fetchInventory, receiveStaffStock } from '@/src/api/staff'
import type { StaffInventoryRow } from '@/src/api/types'
import { useSessionStore } from '@/src/auth/session-store'
import { canAdjustStock, canReceiveStock } from '@/src/permissions'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { StatusBadge } from '@/src/ui/StatusBadge'
import { RequireStaffNav } from '@/src/ui/RequireStaffNav'
import { Input } from '@/src/ui/Input'
import { ProductSearchField } from '@/src/ui/SearchField'
import { PrimaryButton } from '@/src/ui/Button'
import { colors, radius, space, type } from '@/src/theme'

const PAGE_SIZE = 25

export default function InventoryScreen() {
  return (
    <RequireStaffNav navKey="inventory">
      <InventoryBody />
    </RequireStaffNav>
  )
}

function InventoryBody() {
  useBackToMore()
  const params = useLocalSearchParams<{ productId?: string | string[] }>()
  const focusId = Array.isArray(params.productId) ? params.productId[0] : params.productId
  const user = useSessionStore((s) => s.user)
  const canAdjust = canAdjustStock(user?.permissions)
  const canReceive = canReceiveStock(user?.permissions)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [selectedId, setSelectedId] = useState(focusId || '')
  const [focusedRow, setFocusedRow] = useState<StaffInventoryRow | null>(null)
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQ(q.trim()), 280)
    return () => clearTimeout(handle)
  }, [q])

  useEffect(() => {
    if (focusId) setSelectedId(focusId)
  }, [focusId])

  const listQuery = useInfiniteQuery({
    queryKey: ['staff', 'inventory', 'pages', debouncedQ],
    queryFn: ({ pageParam }) =>
      fetchInventory({
        page: pageParam,
        limit: PAGE_SIZE,
        q: debouncedQ || undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const loaded = last.page * last.limit
      return loaded < last.total ? last.page + 1 : undefined
    },
  })

  const focusQuery = useQuery({
    queryKey: ['staff', 'inventory', 'focus', focusId],
    queryFn: () => fetchInventory({ product_id: focusId, page: 1, limit: 1 }),
    enabled: Boolean(focusId),
  })

  useEffect(() => {
    const row = focusQuery.data?.items?.[0]
    if (row) setFocusedRow(row)
  }, [focusQuery.data])

  const items = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data]
  )
  const selected =
    items.find((row) => row.productId === selectedId) ??
    (focusedRow?.productId === selectedId ? focusedRow : null)

  async function run(kind: 'adjust' | 'receive') {
    if (!selectedId) return
    setError('')
    setMessage('')
    if (!reason.trim()) {
      setError('Enter a reason for this stock movement.')
      return
    }
    const amount = Number(qty)
    if (kind === 'receive' && (!Number.isFinite(amount) || amount < 1)) {
      setError('Enter how many units to receive.')
      return
    }
    if (kind === 'adjust' && (!Number.isFinite(amount) || amount === 0)) {
      setError('Enter a signed quantity change, for example 5 or -2.')
      return
    }
    setBusy(true)
    try {
      const result =
        kind === 'adjust'
          ? await adjustStaffStock({
              productId: selectedId,
              quantityDelta: amount,
              reason,
            })
          : await receiveStaffStock({
              productId: selectedId,
              quantity: amount,
              reason,
            })
      const signed = `${result.quantityDelta > 0 ? '+' : ''}${result.quantityDelta}`
      setMessage(
        kind === 'receive'
          ? `Stock received successfully.\n${signed} units\nNew stock: ${result.quantityAfter}`
          : `Stock adjusted successfully.\n${signed} units\nNew stock: ${result.quantityAfter}`
      )
      setQty('')
      if (focusedRow?.productId === selectedId) {
        setFocusedRow({ ...focusedRow, currentStock: result.quantityAfter })
      }
      void listQuery.refetch()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Stock update failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen refreshing={listQuery.isRefetching} onRefresh={() => void listQuery.refetch()}>
      <Text style={type.kicker}>Energy & Logics</Text>
      <Text style={type.screenTitle}>Inventory</Text>
      <Text style={type.helper}>
        Select a product to receive stock or adjust quantity. Receive adds units. Adjust uses a
        signed change.
      </Text>
      <ProductSearchField
        value={q}
        onChange={setQ}
        onSubmit={() => setDebouncedQ(q.trim())}
        placeholder="Search product or SKU"
      />
      {(canAdjust || canReceive) && selected ? (
        <View style={styles.action}>
          <Text style={type.productName}>{selected.name}</Text>
          <Text style={type.metadata}>
            {selected.sku || 'No SKU'}
            {selected.barcode ? ` · ${selected.barcode}` : ''}
          </Text>
          <Text style={type.bodyMedium}>Current stock {selected.currentStock}</Text>
          {selected.targetStock != null ? (
            <Text style={type.helper}>
              Target {selected.targetStock} · Low-stock at {selected.lowStockThreshold}
            </Text>
          ) : (
            <Text style={type.helper}>Low-stock at {selected.lowStockThreshold}</Text>
          )}
          {canReceive ? (
            <Text style={type.helper}>
              Receive adds stock from a supplier or source. Example: 10 + 5 = 15.
            </Text>
          ) : null}
          {canAdjust ? (
            <Text style={type.helper}>
              Adjust is a signed change, not a new total. Example: 10 + (−2) = 8.
            </Text>
          ) : null}
          <Input
            label={canReceive && !canAdjust ? 'Quantity to receive' : 'Quantity change'}
            value={qty}
            onChangeText={setQty}
            keyboardType="numbers-and-punctuation"
          />
          <Input label="Reason" value={reason} onChangeText={setReason} />
          {canReceive ? (
            <PrimaryButton
              label="Receive stock"
              onPress={() => void run('receive')}
              disabled={busy}
            />
          ) : null}
          {canAdjust ? (
            <PrimaryButton
              label="Adjust stock"
              variant="secondary"
              onPress={() => void run('adjust')}
              disabled={busy}
            />
          ) : null}
          {message ? <Text style={styles.success}>{message}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      ) : canAdjust || canReceive ? (
        <Text style={type.helper}>Select a product to receive stock or adjust quantity.</Text>
      ) : null}
      <ScreenState
        loading={listQuery.isLoading}
        error={listQuery.error instanceof Error ? listQuery.error.message : listQuery.error ? String(listQuery.error) : null}
        errorTitle="Couldn't load inventory"
        empty={items.length === 0}
        emptyTitle="No inventory rows"
        emptyBody={debouncedQ ? 'No products match that search.' : 'Catalog stock levels will appear here.'}
        onRetry={() => void listQuery.refetch()}
      >
        <View style={styles.list}>
          {items.map((row, index, all) => {
            const out = row.currentStock <= 0
            const statusLabel = out ? 'OUT' : row.isLowStock ? 'LOW' : null
            const tone = out ? 'red' : row.isLowStock ? 'amber' : 'green'
            const selectedRow = selectedId === row.productId
            return (
              <Pressable
                key={row.productId}
                onPress={() => {
                  setSelectedId(row.productId)
                  setFocusedRow(row)
                  setError('')
                }}
                style={[styles.row, index < all.length - 1 && styles.rowLine, selectedRow && styles.selected]}
              >
                <Text style={type.productName} numberOfLines={2} maxFontSizeMultiplier={1.3}>
                  {row.name}
                </Text>
                <Text style={type.metadata} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                  {row.sku ? `SKU: ${row.sku}` : 'No SKU'}
                  {row.barcode ? ` · ${row.barcode}` : ''}
                </Text>
                <View style={styles.metaRow}>
                  <Text
                    style={[
                      type.quantity,
                      out && styles.outText,
                      !out && row.isLowStock && styles.lowText,
                    ]}
                    maxFontSizeMultiplier={1.3}
                    accessibilityLabel={`${row.currentStock} on hand${out ? ', out of stock' : row.isLowStock ? ', low stock' : ''}`}
                  >
                    Stock: {row.currentStock}
                  </Text>
                  {statusLabel ? <StatusBadge label={statusLabel} tone={tone} /> : null}
                </View>
              </Pressable>
            )
          })}
        </View>
        {listQuery.hasNextPage ? (
          <PrimaryButton
            label={listQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
            variant="secondary"
            disabled={listQuery.isFetchingNextPage}
            onPress={() => void listQuery.fetchNextPage()}
          />
        ) : null}
      </ScreenState>
    </Screen>
  )
}

const styles = StyleSheet.create({
  action: { gap: space.sm, marginBottom: space.md },
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
  selected: { backgroundColor: colors.surfaceMuted },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.sm,
  },
  lowText: { color: colors.warning },
  outText: { color: colors.danger },
  success: { ...type.helper, color: colors.success },
  error: { ...type.helper, color: colors.danger },
})
