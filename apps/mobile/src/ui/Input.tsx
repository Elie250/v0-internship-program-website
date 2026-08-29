import { useState } from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { colors, control, font, radius, space, type } from '@/src/theme'

export function Input({
  label,
  error,
  accessibilityLabel,
  onFocus,
  onBlur,
  style,
  ...rest
}: TextInputProps & {
  label?: string
  error?: string
}) {
  const [focused, setFocused] = useState(false)

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={styles.label} maxFontSizeMultiplier={1.4}>
          {label}
        </Text>
      ) : null}
      <TextInput
        {...rest}
        accessibilityLabel={accessibilityLabel || label}
        placeholderTextColor={rest.placeholderTextColor || colors.textMuted}
        textAlignVertical="center"
        onFocus={(event) => {
          setFocused(true)
          onFocus?.(event)
        }}
        onBlur={(event) => {
          setFocused(false)
          onBlur?.(event)
        }}
        style={[styles.field, focused && styles.fieldFocus, error && styles.fieldError, style]}
      />
      {error ? (
        <Text style={type.error} maxFontSizeMultiplier={1.4}>
          {error}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  label: { ...type.bodyMedium, color: colors.textSecondary },
  field: {
    minHeight: control.searchHeight,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    fontFamily: font.regular,
    fontSize: 16,
    color: colors.textPrimary,
    includeFontPadding: false,
  },
  fieldFocus: { borderColor: colors.primary },
  fieldError: { borderColor: colors.danger },
})
