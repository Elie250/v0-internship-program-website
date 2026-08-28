import { useMemo, useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSessionStore } from '@/src/auth/session-store'
import { useOrderQuery, paymentLabel } from '@/src/features/orders/hooks'
import {
  REFUND_REASONS,
  isPosRefundEligible,
  newRefundIdempotencyKey,
  refundRequestFingerprint,
  refundReasonLabel,
  refundStatusLabel,
} from '@/src/features/refunds/policy'
import { confirmShopRefund } from '@/src/features/refunds/confirm-refund'
import { useDecideShopRefund, useRequestShopRefund } from '@/src/features/refunds/hooks'
import { canApproveShopRefund, canRequestShopRefund } from '@/src/permissions'
import { formatRwf, formatWhen } from '@/src/format'
import { PrimaryButton } from '@/src/ui/Button'
import { FilterChips } from '@/src/ui/FilterChips'
import { QtyStepper } from '@/src/ui/QtyStepper'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { StatusBadge } from '@/src/ui/StatusBadge'
import { RequireStaffNav } from '@/src/ui/RequireStaffNav'
import { colors, space, type } from '@/src/theme'

export default function SaleDetailScreen() {
  return (
    <RequireStaffNav navKey="sales">
      <SaleDetailBody />
    </RequireStaffNav>
  )
}

function SaleDetailBody() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const user = useSessionStore((s) => s.user)
  const query = useOrderQuery(id)
  const request = useRequestShopRefund(id ?? '')
  const decide = useDecideShopRefund()
  const order = query.data?.item
  const canRequest = canRequestShopRefund(user?.permissions)
  const canApprove = canApproveShopRefund(user?.permissions)
  const eligible = order ? isPosRefundEligible(order) : false
  const [phase, setPhase] = useState<'view' | 'select' | 'review'>('view')
  const [qty, setQty] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('customer_return')
  const [notes, setNotes] = useState('')
  const [attemptKey, setAttemptKey] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const selected = useMemo(() => {
    return (order?.items ?? [])
      .map((line) => ({
        orderItemId: line.id,
        name: line.productName,
        quantity: qty[line.id] ?? 0,
        unitPrice: line.unitPrice,
        refundable: line.refundableQuantity ?? 0,
      }))
      .filter((line) => line.quantity > 0)
  }, [order?.items, qty])

  const previewAmount = selected.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
  const fingerprint = refundRequestFingerprint(
    selected.map((line) => ({ orderItemId: line.orderItemId, quantity: line.quantity })),
    reason,
    notes
  )
  const notesRequired = REFUND_REASONS.some((entry) => entry.id === reason && entry.notesRequired)
  const pending = request.isPending || decide.isPending

  function startRefund() {
    const next: Record<string, number> = {}
    for (const line of order?.items ?? []) {
      next[line.id] = 0
    }
    setQty(next)
    setReason('customer_return')
    setNotes('')
    setAttemptKey(null)
    setStatusMessage(null)
    setPhase('select')
  }

  function submit() {
    if (!order || selected.length === 0 || pending) return
    if (notesRequired && !notes.trim()) return
    const key = attemptKey || newRefundIdempotencyKey('request')
    setAttemptKey(key)
    confirmShopRefund({
      summary: selected.map((line) => `Refund ${line.quantity} × ${line.name}`).join('\n'),
      amount: previewAmount,
      paymentMethod: String(order.paymentMethod || 'CASH').toUpperCase(),
      reason,
      execute: canApprove,
      onConfirm: () => {
        void (async () => {
          try {
            const created = await request.mutateAsync({
              items: selected.map((line) => ({
                orderItemId: line.orderItemId,
                quantity: line.quantity,
              })),
              reason,
              notes: notes.trim() || undefined,
              idempotencyKey: key,
              fingerprint,
            })
            if (canApprove && created.refund?.id && created.refund.status === 'requested') {
              await decide.mutateAsync({
                refundId: created.refund.id,
                decision: 'approve',
                idempotencyKey: newRefundIdempotencyKey('decision'),
              })
              setStatusMessage('Refund approved')
            } else {
              setStatusMessage('Refund requested')
            }
            setPhase('view')
            await query.refetch()
          } catch {
            // Request/decision error state is shown above the actions.
          }
        })()
      },
    })
  }

  const refundTone =
    order?.refundStatus === 'full' || order?.refundStatus === 'partial'
      ? 'green'
      : order?.refundStatus === 'requested'
        ? 'amber'
        : order?.refundStatus === 'rejected'
          ? 'red'
          : 'slate'

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <ScreenState
        loading={query.isLoading}
        error={query.error?.message}
        empty={!order}
        emptyTitle="Sale not found"
        onRetry={() => void query.refetch()}
      >
        {order ? (
          <>
            <Text style={type.orderRef}>{order.orderNumber || 'Sale'}</Text>
            <Text style={type.meta}>{formatWhen(order.orderDate || order.createdAt)}</Text>
            <View style={styles.row}>
              <StatusBadge label={paymentLabel(order.paymentStatus)} tone="green" />
              <StatusBadge label={refundStatusLabel(order.refundStatus)} tone={refundTone} />
            </View>
            <Text style={type.total}>{formatRwf(order.totalAmount)}</Text>
            <Text style={type.meta}>
              {order.channel === 'pos' ? 'POS' : 'Online'} ·{' '}
              {String(order.paymentMethod || '—').toUpperCase()}
            </Text>
            <Text style={styles.immutable}>
              Original sale is unchanged. Refunds are recorded separately.
            </Text>

            <Text style={styles.section}>Items</Text>
            {order.items.map((line) => (
              <View key={line.id} style={styles.line}>
                {phase === 'select' ? (
                  <>
                    <Text style={type.productName}>{line.productName}</Text>
                    <Text style={type.sku}>
                      Sold {line.quantity} · Refundable {line.refundableQuantity ?? 0} ·{' '}
                      {formatRwf(line.unitPrice)}
                    </Text>
                    <QtyStepper
                      value={qty[line.id] ?? 0}
                      onDecrease={() =>
                        setQty((current) => {
                          setAttemptKey(null)
                          return {
                            ...current,
                            [line.id]: Math.max(0, (current[line.id] ?? 0) - 1),
                          }
                        })
                      }
                      onIncrease={() =>
                        setQty((current) => {
                          const max = line.refundableQuantity ?? 0
                          setAttemptKey(null)
                          return {
                            ...current,
                            [line.id]: Math.min(max, (current[line.id] ?? 0) + 1),
                          }
                        })
                      }
                      decreaseLabel={`Decrease refund quantity for ${line.productName}`}
                      increaseLabel={`Increase refund quantity for ${line.productName}`}
                    />
                  </>
                ) : (
                  <>
                    <Text style={type.productName}>{line.productName}</Text>
                    <Text style={type.sku}>
                      {line.quantity} × {formatRwf(line.unitPrice)}
                      {line.refundableQuantity != null
                        ? ` · refundable ${line.refundableQuantity}`
                        : ''}
                    </Text>
                    <Text style={type.lineTotal}>{formatRwf(line.lineTotal)}</Text>
                  </>
                )}
              </View>
            ))}

            {phase === 'select' || phase === 'review' ? (
              <View style={styles.box}>
                <Text style={type.heading}>Reason</Text>
                <FilterChips
                  items={REFUND_REASONS.map((entry) => ({ id: entry.id, label: entry.label }))}
                  selectedId={reason}
                  onSelect={(next) => {
                    setReason(next)
                    setAttemptKey(null)
                  }}
                />
                <TextInput
                  value={notes}
                  onChangeText={(value) => {
                    setNotes(value)
                    setAttemptKey(null)
                  }}
                  placeholder={notesRequired ? 'Notes required' : 'Optional notes'}
                  placeholderTextColor={colors.muted}
                  style={styles.notes}
                  multiline
                />
                <Text style={type.heading}>Preview {formatRwf(previewAmount)}</Text>
                <Text style={type.meta}>
                  Server uses the original sale price. This preview is display-only.
                </Text>
                {request.error ? <Text style={styles.error}>{request.error.message}</Text> : null}
                {decide.error ? <Text style={styles.error}>{decide.error.message}</Text> : null}
                {phase === 'select' ? (
                  <PrimaryButton
                    label={canApprove ? 'Review refund' : 'Review refund request'}
                    disabled={selected.length === 0 || (notesRequired && !notes.trim()) || pending}
                    onPress={() => setPhase('review')}
                  />
                ) : null}
                <PrimaryButton label="Cancel" tone="outline" onPress={() => setPhase('view')} />
              </View>
            ) : null}

            {phase === 'review' ? (
              <View style={styles.box}>
                {selected.map((line) => (
                  <Text key={line.orderItemId} style={type.productName}>
                    {line.quantity} × {line.name} · {formatRwf(line.unitPrice * line.quantity)}
                  </Text>
                ))}
                <Text style={type.meta}>Reason: {refundReasonLabel(reason)}</Text>
                <PrimaryButton
                  label={canApprove ? 'Confirm refund' : 'Submit request'}
                  disabled={pending}
                  loading={pending}
                  onPress={submit}
                />
              </View>
            ) : null}

            {statusMessage ? <Text style={styles.ok}>{statusMessage}</Text> : null}

            {phase === 'view' && canRequest && eligible ? (
              <PrimaryButton label="Refund" tone="outline" onPress={startRefund} />
            ) : null}

            {phase === 'view' && !eligible && order.channel === 'pos' ? (
              <Text style={type.meta}>This sale is not eligible for a new refund.</Text>
            ) : null}

            {phase === 'view' && order.channel === 'online' ? (
              <Text style={type.meta}>Online customer orders cannot be refunded from POS.</Text>
            ) : null}

            {(order.refunds ?? []).length ? (
              <>
                <Text style={styles.section}>Refunds</Text>
                {order.refunds?.map((refund) => (
                  <View key={refund.id} style={styles.line}>
                    <Text style={type.heading}>
                      {refund.status === 'approved'
                        ? 'Refund approved'
                        : refund.status === 'rejected'
                          ? 'Refund rejected'
                          : 'Refund requested'}{' '}
                      · {formatRwf(refund.amount)}
                    </Text>
                    <Text style={type.meta}>
                      {refundReasonLabel(refund.reason)} · {refund.paymentMethod}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}
          </>
        ) : null}
      </ScreenState>
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  immutable: { ...type.meta, marginTop: 8 },
  section: { ...type.heading, marginTop: space.md, marginBottom: 8 },
  line: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: space.md,
    marginBottom: 8,
    gap: 6,
  },
  box: {
    marginTop: space.md,
    gap: 10,
  },
  notes: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: space.md,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  error: { color: colors.red },
  ok: { color: colors.green, fontWeight: '600', marginTop: space.sm },
})
