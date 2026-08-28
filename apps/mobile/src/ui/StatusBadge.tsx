import { StyleSheet, Text, View } from 'react-native'
import { colors, radius, type } from '@/src/theme'

export function StatusBadge({
  label,
  tone = 'slate',
}: {
  label: string
  tone?: 'amber' | 'green' | 'red' | 'slate'
}) {
  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text style={[styles.text, styles[`${tone}Text`]]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: type.status,
  amber: { backgroundColor: colors.amberSoft },
  amberText: { color: colors.amber },
  green: { backgroundColor: colors.greenSoft },
  greenText: { color: colors.green },
  red: { backgroundColor: colors.redSoft },
  redText: { color: colors.red },
  slate: { backgroundColor: '#f1f5f9' },
  slateText: { color: colors.slate },
})
