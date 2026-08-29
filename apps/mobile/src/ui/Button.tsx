import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { colors, control, font, radius, space, type } from '@/src/theme'

type Variant = 'primary' | 'secondary' | 'tertiary' | 'danger'

function resolveVariant(
  variant?: Variant,
  tone?: 'navy' | 'danger' | 'outline' | 'amber'
): Variant {
  if (variant) return variant
  if (tone === 'danger') return 'danger'
  if (tone === 'outline') return 'secondary'
  return 'primary'
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  tone = 'navy',
  variant,
  accessibilityLabel,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  tone?: 'navy' | 'danger' | 'outline' | 'amber'
  variant?: Variant
  accessibilityLabel?: string
}) {
  const kind = resolveVariant(variant, tone)
  const busy = Boolean(disabled || loading)

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: busy, busy: Boolean(loading) }}
      style={({ pressed }) => [
        styles.base,
        kind === 'primary' && styles.primary,
        kind === 'secondary' && styles.secondary,
        kind === 'tertiary' && styles.tertiary,
        kind === 'danger' && styles.danger,
        disabled && !loading && styles.disabled,
        pressed && !busy && kind === 'primary' && styles.primaryPressed,
        pressed && !busy && kind === 'danger' && styles.dangerPressed,
        pressed && !busy && (kind === 'secondary' || kind === 'tertiary') && styles.ghostPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={kind === 'secondary' || kind === 'tertiary' ? colors.primary : colors.textOnPrimary}
        />
      ) : (
        <Text
          style={[
            styles.label,
            kind === 'primary' && styles.primaryLabel,
            kind === 'secondary' && styles.secondaryLabel,
            kind === 'tertiary' && styles.tertiaryLabel,
            kind === 'danger' && styles.dangerLabel,
            busy && styles.disabledLabel,
          ]}
          maxFontSizeMultiplier={1.3}
          numberOfLines={2}
        >
          {label}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: control.height,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tertiary: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.danger },
  dangerPressed: { backgroundColor: colors.dangerPressed },
  disabled: { backgroundColor: colors.disabledFill, borderColor: colors.border, borderWidth: 1 },
  ghostPressed: { opacity: 0.85 },
  label: { ...type.button, fontFamily: font.semibold, textAlign: 'center' },
  primaryLabel: { color: colors.textOnPrimary },
  secondaryLabel: { color: colors.primary },
  tertiaryLabel: { color: colors.textSecondary },
  dangerLabel: { color: colors.textOnPrimary },
  disabledLabel: { color: colors.disabledText },
})
