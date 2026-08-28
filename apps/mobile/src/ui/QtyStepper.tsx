import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, control, radius, type } from '@/src/theme'

export function QtyStepper({
  value,
  onDecrease,
  onIncrease,
  decreaseLabel = 'Decrease quantity',
  increaseLabel = 'Increase quantity',
}: {
  value: number
  onDecrease: () => void
  onIncrease: () => void
  decreaseLabel?: string
  increaseLabel?: string
}) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onDecrease}
        accessibilityRole="button"
        accessibilityLabel={decreaseLabel}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      >
        <Text style={styles.symbol}>−</Text>
      </Pressable>
      <Text style={styles.value} accessibilityLabel={`Quantity ${value}`}>
        {value}
      </Text>
      <Pressable
        onPress={onIncrease}
        accessibilityRole="button"
        accessibilityLabel={increaseLabel}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      >
        <Text style={styles.symbol}>+</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: {
    width: control.height,
    height: control.height,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  symbol: { fontSize: 22, fontWeight: '600', color: colors.navy, lineHeight: 26 },
  value: { ...type.quantity, minWidth: 32, textAlign: 'center' },
})
