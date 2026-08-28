import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { colors, space } from '@/src/theme'

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  tone = 'navy',
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  tone?: 'navy' | 'danger' | 'outline'
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        tone === 'navy' && styles.navy,
        tone === 'danger' && styles.danger,
        tone === 'outline' && styles.outline,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
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
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  navy: { backgroundColor: colors.navy },
  danger: { backgroundColor: colors.red },
  outline: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.navy },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  label: { color: colors.white, fontSize: 16, fontWeight: '700' },
  outlineLabel: { color: colors.navy },
})
