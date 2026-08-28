import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, hitSlop, radius, space } from '@/src/theme'

export type FilterChip = {
  id: string
  label: string
}

export function FilterChips({
  items,
  selectedId,
  onSelect,
}: {
  items: FilterChip[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {items.map((item) => {
        const on = item.id === selectedId
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={item.label}
            style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}
          >
            <View style={[styles.dot, on && styles.dotOn]} />
            <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: space.md },
  chip: {
    minHeight: hitSlop,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  chipOn: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  pressed: { opacity: 0.85 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.line,
  },
  dotOn: { backgroundColor: colors.amber },
  label: { fontSize: 14, fontWeight: '600', color: colors.slate, maxWidth: 160 },
  labelOn: { color: colors.white },
})
