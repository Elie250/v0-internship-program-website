import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, hitSlop, radius, space } from '@/src/theme'

/**
 * Search now. Camera scan is not implemented — the scan control stays a placeholder.
 */
export function ProductSearchField({
  value,
  onChange,
  onSubmit,
  onBarcodePlaceholder,
  placeholder = 'Search products or SKU',
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onBarcodePlaceholder?: () => void
  placeholder?: string
}) {
  return (
    <View style={styles.row}>
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Search products or SKU"
        style={styles.input}
      />
      {onBarcodePlaceholder ? (
        <Pressable
          onPress={onBarcodePlaceholder}
          accessibilityRole="button"
          accessibilityLabel="Scan barcode. Camera scanning is not available yet."
          style={({ pressed }) => [styles.scan, pressed && styles.pressed]}
        >
          <Ionicons name="barcode-outline" size={22} color={colors.navy} />
          <Text style={styles.scanText}>Scan</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    minHeight: hitSlop + 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: space.md,
    fontSize: 16,
    color: colors.ink,
  },
  scan: {
    minWidth: 72,
    minHeight: hitSlop + 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    gap: 2,
  },
  pressed: { opacity: 0.8 },
  scanText: { color: colors.navy, fontWeight: '700', fontSize: 12 },
})
