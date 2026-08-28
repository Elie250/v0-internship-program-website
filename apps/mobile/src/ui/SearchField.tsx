import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, control, space, type } from '@/src/theme'

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
      <View style={styles.field}>
        <Ionicons name="search-outline" size={20} color={colors.muted} />
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
      </View>
      {onBarcodePlaceholder ? (
        <Pressable
          onPress={onBarcodePlaceholder}
          accessibilityRole="button"
          accessibilityLabel="Scan barcode. Camera scanning is not available yet."
          style={({ pressed }) => [styles.scan, pressed && styles.pressed]}
        >
          <Ionicons name="barcode-outline" size={20} color={colors.slate} />
          <Text style={styles.scanText}>Scan</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  field: {
    flex: 1,
    minHeight: control.height + 4,
    borderRadius: control.radius,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: 8,
  },
  scan: {
    minWidth: 56,
    minHeight: control.height + 4,
    borderRadius: control.radius,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: 8,
    gap: 2,
  },
  pressed: { opacity: 0.8 },
  scanText: { ...type.sku, color: colors.slate, fontWeight: '600' },
})
