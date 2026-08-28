import { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, space } from '@/src/theme'

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>
}

export function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.navy },
  metric: { gap: 4, minWidth: '46%', flexGrow: 1 },
  label: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  value: { fontSize: 22, fontWeight: '800', color: colors.navy },
  hint: { fontSize: 12, color: colors.muted },
})
