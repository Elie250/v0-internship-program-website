import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { colors, space } from '@/src/theme'

/**
 * Search now. Barcode scan can later call onBarcode without changing the cart.
 */
export function ProductSearchField({
  value,
  onChange,
  onSubmit,
  onBarcodePlaceholder,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onBarcodePlaceholder?: () => void
}) {
  return (
    <View style={styles.row}>
      <TextInput
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder="Search name, SKU, or barcode"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        returnKeyType="search"
        style={styles.input}
      />
      {onBarcodePlaceholder ? (
        <Pressable onPress={onBarcodePlaceholder} style={styles.scan}>
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
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: space.md,
    fontSize: 16,
    color: colors.navy,
  },
  scan: {
    minWidth: 72,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  scanText: { color: colors.navy, fontWeight: '700' },
})
