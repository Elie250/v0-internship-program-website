import { Redirect, useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSessionStore } from '@/src/auth/session-store'
import { filterStaffNavItems } from '@/src/permissions'
import { Card } from '@/src/ui/Card'
import { Screen } from '@/src/ui/Screen'
import { colors, space } from '@/src/theme'

export default function MoreMenuScreen() {
  const router = useRouter()
  const user = useSessionStore((s) => s.user)
  if (!user) return <Redirect href="/login" />

  const extras = filterStaffNavItems(user.permissions).filter((item) =>
    ['sales', 'products', 'inventory', 'settings'].includes(item.key)
  )

  return (
    <Screen>
      <Text style={styles.title}>More</Text>
      {extras.map((item) => (
        <Pressable key={item.key} onPress={() => router.push(item.href as never)}>
          <Card>
            <View style={styles.row}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.chev}>›</Text>
            </View>
          </Card>
        </Pressable>
      ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.navy, marginBottom: space.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 17, fontWeight: '700', color: colors.navy },
  chev: { fontSize: 22, color: colors.muted },
})
