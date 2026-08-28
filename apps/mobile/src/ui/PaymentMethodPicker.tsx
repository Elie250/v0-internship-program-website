import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, hitSlop, radius, space } from '@/src/theme'

export function PaymentMethodPicker({
  value,
  onChange,
  disabled,
}: {
  value: 'cash' | 'momo'
  onChange: (method: 'cash' | 'momo') => void
  disabled?: boolean
}) {
  return (
    <View style={styles.wrap}>
      <MethodCard
        selected={value === 'cash'}
        disabled={disabled}
        icon="cash-outline"
        title="Cash"
        subtitle="Marked paid at the till"
        onPress={() => onChange('cash')}
      />
      <MethodCard
        selected={value === 'momo'}
        disabled={disabled}
        icon="phone-portrait-outline"
        title="MoMo"
        subtitle="Recorded at the till"
        onPress={() => onChange('momo')}
      />
    </View>
  )
}

function MethodCard({
  selected,
  disabled,
  icon,
  title,
  subtitle,
  onPress,
}: {
  selected: boolean
  disabled?: boolean
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: Boolean(disabled) }}
      accessibilityLabel={`${title} payment`}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardOn,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.top}>
        <Ionicons name={icon} size={22} color={selected ? colors.white : colors.navy} />
        {selected ? (
          <Ionicons name="checkmark-circle" size={22} color={colors.amber} />
        ) : (
          <View style={styles.emptyCheck} />
        )}
      </View>
      <Text style={[styles.title, selected && styles.titleOn]}>{title}</Text>
      <Text style={[styles.sub, selected && styles.subOn]}>{subtitle}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: space.sm },
  card: {
    flex: 1,
    minHeight: 96,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.white,
    padding: space.md,
    gap: 6,
  },
  cardOn: {
    backgroundColor: colors.navy,
    borderColor: colors.navyDark,
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.5 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.line,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.navy, minHeight: hitSlop / 2.4 },
  titleOn: { color: colors.white },
  sub: { fontSize: 12, fontWeight: '500', color: colors.muted },
  subOn: { color: '#cbd5e1' },
})
