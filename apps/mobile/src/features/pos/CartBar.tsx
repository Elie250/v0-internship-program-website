import { Pressable, StyleSheet, Text, View } from 'react-native'
import { formatRwf } from '@/src/format'
import { colors, hitSlop, radius, space } from '@/src/theme'

export function CartBar({
  itemCount,
  total,
  onPress,
}: {
  itemCount: number
  total: number
  onPress: () => void
}) {
  const itemsLabel = itemCount === 1 ? '1 item' : `${itemCount} items`

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${itemsLabel}, ${formatRwf(total)}. View cart and checkout`}
        style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      >
        <View>
          <Text style={styles.count}>{itemsLabel}</Text>
          <Text style={styles.total}>{formatRwf(total)}</Text>
        </View>
        <View style={styles.cta}>
          <Text style={styles.ctaLabel}>Checkout</Text>
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    bottom: space.sm,
  },
  bar: {
    minHeight: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.navy,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  pressed: { opacity: 0.92 },
  count: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  total: { color: colors.white, fontSize: 20, fontWeight: '800' },
  cta: {
    minHeight: hitSlop,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { color: colors.white, fontWeight: '800', fontSize: 15 },
})
