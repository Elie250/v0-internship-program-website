import { Pressable, StyleSheet, Text, View } from 'react-native'
import { formatRwf } from '@/src/format'
import { colors, control, space, type } from '@/src/theme'

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
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${itemsLabel}, ${formatRwf(total)}. View cart and checkout`}
        style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      >
        <View style={styles.copy}>
          <Text style={styles.count}>{itemsLabel}</Text>
          <Text style={type.dockTotal}>{formatRwf(total)}</Text>
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
    backgroundColor: colors.navyDark,
    paddingHorizontal: space.md,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: colors.navy,
  },
  bar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  pressed: { opacity: 0.92 },
  copy: { flex: 1, minWidth: 0 },
  count: { ...type.meta, color: '#cbd5e1' },
  cta: {
    minHeight: control.height,
    paddingHorizontal: 20,
    borderRadius: control.radius,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: { ...type.button, color: colors.white, fontWeight: '700' },
})
