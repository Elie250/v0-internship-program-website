import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { CartLine } from '@/src/features/pos/cart-store'
import { previewUnitPrice } from '@/src/features/pos/pricing'
import { formatRwf } from '@/src/format'
import { QtyStepper } from '@/src/ui/QtyStepper'
import { colors, radius, space, type } from '@/src/theme'

export function CartLineRow({
  line,
  onDecrease,
  onIncrease,
  onRemove,
}: {
  line: CartLine
  onDecrease: () => void
  onIncrease: () => void
  onRemove: () => void
}) {
  const unit = previewUnitPrice(line.price, line.discount)
  const lineTotal = unit * line.quantity

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.copy}>
          <Text style={type.productName} numberOfLines={2}>
            {line.name}
          </Text>
          <Text style={type.meta}>
            {line.sellingUnitLabel} · {formatRwf(unit)}
          </Text>
        </View>
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${line.name}`}
          style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
        >
          <Text style={styles.removeLabel}>Remove</Text>
        </Pressable>
      </View>
      <View style={styles.bottom}>
        <QtyStepper
          value={line.quantity}
          onDecrease={onDecrease}
          onIncrease={onIncrease}
          decreaseLabel={`Decrease ${line.name}`}
          increaseLabel={`Increase ${line.name}`}
        />
        <Text style={styles.lineTotal}>{formatRwf(lineTotal)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
    gap: space.sm,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  copy: { flex: 1, gap: 2, minWidth: 0 },
  remove: { minHeight: 44, justifyContent: 'center', paddingLeft: 8 },
  removeLabel: { color: colors.red, fontWeight: '700', fontSize: 13 },
  pressed: { opacity: 0.7 },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  lineTotal: { fontSize: 18, fontWeight: '800', color: colors.navy },
})
