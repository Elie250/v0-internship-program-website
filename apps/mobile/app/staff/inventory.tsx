import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useBackToMore } from '@/src/navigation/use-back-to-more'
import { adjustStaffStock, fetchInventory, receiveStaffStock } from '@/src/api/staff'
import { useSessionStore } from '@/src/auth/session-store'
import { canAdjustStock, canReceiveStock } from '@/src/permissions'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { StatusBadge } from '@/src/ui/StatusBadge'
import { RequireStaffNav } from '@/src/ui/RequireStaffNav'
import { Input } from '@/src/ui/Input'
import { PrimaryButton } from '@/src/ui/Button'
import { colors, radius, space, type } from '@/src/theme'

export default function InventoryScreen() {
  return (
    <RequireStaffNav navKey="inventory">
      <InventoryBody />
    </RequireStaffNav>
  )
}

function InventoryBody() {
  useBackToMore()
  const user = useSessionStore((s) => s.user)
  const canAdjust = canAdjustStock(user?.permissions)
  const canReceive = canReceiveStock(user?.permissions)
  const [selectedId, setSelectedId] = useState('')
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const query = useQuery({
    queryKey: ['staff', 'inventory'],
    queryFn: () => fetchInventory({ page: 1, limit: 50 }),
  })

  async function run(kind: 'adjust' | 'receive') {
    if (!selectedId) return
    setBusy(true)
    setMessage('')
    try {
      if (kind === 'adjust') {
        await adjustStaffStock({
          productId: selectedId,
          quantityDelta: Number(qty),
          reason,
        })
      } else {
        await receiveStaffStock({
          productId: selectedId,
          quantity: Number(qty),
          reason,
        })
      }
      setMessage('Stock updated.')
      void query.refetch()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Stock update failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Text style={type.kicker}>Energy & Logics</Text>
      <Text style={type.screenTitle}>Inventory</Text>
      {(canAdjust || canReceive) && selectedId ? (
        <View style={styles.action}>
          <Input label="Quantity change" value={qty} onChangeText={setQty} keyboardType="number-pad" />
          <Input label="Reason" value={reason} onChangeText={setReason} />
          {canAdjust ? (
            <PrimaryButton label="Adjust stock" onPress={() => void run('adjust')} disabled={busy} />
          ) : null}
          {canReceive ? (
            <PrimaryButton label="Receive stock" onPress={() => void run('receive')} disabled={busy} />
          ) : null}
          {message ? <Text style={type.helper}>{message}</Text> : null}
        </View>
      ) : null}
      <ScreenState
        loading={query.isLoading}
        error={query.error?.message}
        errorTitle="Couldn't load inventory"
        empty={(query.data?.items.length ?? 0) === 0}
        emptyTitle="No inventory rows"
        emptyBody="Catalog stock levels will appear here."
        onRetry={() => void query.refetch()}
      >
        <View style={styles.list}>
          {(query.data?.items ?? []).map((row, index, all) => {
            const out = row.currentStock <= 0
            const statusLabel = out ? 'OUT' : row.isLowStock ? 'LOW' : null
            const tone = out ? 'red' : row.isLowStock ? 'amber' : 'green'
            const selected = selectedId === row.productId
            return (
              <Pressable
                key={row.productId}
                onPress={() => setSelectedId(row.productId)}
                style={[styles.row, index < all.length - 1 && styles.rowLine, selected && styles.selected]}
              >
                <Text style={type.productName} numberOfLines={2} maxFontSizeMultiplier={1.3}>
                  {row.name}
                </Text>
                <Text style={type.metadata} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                  {row.sku || 'No SKU'}
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
                    {row.currentStock}
                  </Text>
                  {statusLabel ? <StatusBadge label={statusLabel} tone={tone} /> : null}
                </View>
              </Pressable>
            )
          })}
        </View>
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
  selected: { backgroundColor: colors.surfaceMuted ?? '#f8fafc' },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.sm,
  },
  lowText: { color: colors.warning },
  outText: { color: colors.danger },
})
