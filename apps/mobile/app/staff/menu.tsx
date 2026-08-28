import { Redirect, useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSessionStore } from '@/src/auth/session-store'
import { filterStaffNavItems } from '@/src/permissions'
import { Card } from '@/src/ui/Card'
import { Screen } from '@/src/ui/Screen'
import { colors, type } from '@/src/theme'

export default function MoreMenuScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const user = useSessionStore((s) => s.user)
  if (!user) return <Redirect href="/login" />

  const extras = filterStaffNavItems(user.permissions).filter((item) =>
    ['sales', 'products', 'inventory', 'settings'].includes(item.key)
  )

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.bg }}>
      <Screen>
        <Text style={type.screenTitle}>More</Text>
        {extras.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => router.push(item.href as never)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <Card>
              <View style={styles.row}>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.chev}>›</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </Screen>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  label: { fontSize: 17, fontWeight: '600', color: colors.navy },
  chev: { fontSize: 22, color: colors.muted },
})
