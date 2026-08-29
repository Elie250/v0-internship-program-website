import { Pressable, StyleSheet, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, space, type } from '@/src/theme'

export function BackLink({
  label,
  onPress,
  accessibilityLabel,
}: {
  label: string
  onPress: () => void
  accessibilityLabel?: string
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
    >
      <Ionicons
        name="chevron-back"
        size={20}
        color={colors.primary}
        importantForAccessibility="no"
      />
      <Text style={styles.label} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  hit: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    alignSelf: 'flex-start',
  },
  pressed: { opacity: 0.7 },
  label: { ...type.sectionTitle, color: colors.primary },
})
