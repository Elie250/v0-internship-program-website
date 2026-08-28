import { StyleSheet, Text, View } from 'react-native'
import { colors } from '@/src/theme'

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
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: { fontSize: 12, fontWeight: '700' },
  amber: { backgroundColor: '#fff7ed' },
  amberText: { color: '#c2410c' },
  green: { backgroundColor: '#f0fdf4' },
  greenText: { color: '#15803d' },
  red: { backgroundColor: '#fef2f2' },
  redText: { color: '#b91c1c' },
  slate: { backgroundColor: '#f1f5f9' },
  slateText: { color: '#334155' },
})
