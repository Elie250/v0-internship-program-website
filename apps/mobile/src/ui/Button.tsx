import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { colors, control, space, type } from '@/src/theme'

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  tone = 'navy',
  accessibilityLabel,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  tone?: 'navy' | 'danger' | 'outline' | 'amber'
  accessibilityLabel?: string
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
      style={({ pressed }) => [
        styles.base,
        tone === 'navy' && styles.navy,
        tone === 'danger' && styles.danger,
        tone === 'outline' && styles.outline,
        tone === 'amber' && styles.amber,
        (disabled || loading) && styles.disabled,
        pressed && !(disabled || loading) && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone === 'outline' ? colors.navy : colors.white} />
      ) : (
        <Text style={[styles.label, tone === 'outline' && styles.outlineLabel]}>{label}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: control.height,
    borderRadius: control.radius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  navy: { backgroundColor: colors.navy },
  danger: { backgroundColor: colors.red },
  amber: { backgroundColor: colors.amber },
  outline: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.navy },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  label: { ...type.button, color: colors.white },
  outlineLabel: { color: colors.navy },
})
