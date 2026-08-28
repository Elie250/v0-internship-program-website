import { useRouter } from 'expo-router'
import { StyleSheet, Text } from 'react-native'
import { useBackToMore } from '@/src/navigation/use-back-to-more'
import { useSessionStore } from '@/src/auth/session-store'
import { getApiBaseUrl } from '@/src/api/client'
import { PrimaryButton } from '@/src/ui/Button'
import { Card } from '@/src/ui/Card'
import { Screen } from '@/src/ui/Screen'
import { colors } from '@/src/theme'

export default function SettingsScreen() {
  useBackToMore()
  const router = useRouter()
  const user = useSessionStore((s) => s.user)
  const signOut = useSessionStore((s) => s.signOut)

  return (
    <Screen>
      <Card>
        <Text style={styles.label}>Signed in</Text>
        <Text style={styles.value}>
          {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email}
        </Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>{user?.role.replace(/_/g, ' ')}</Text>
      </Card>
      <Card>
        <Text style={styles.label}>API host</Text>
        <Text style={styles.meta}>{getApiBaseUrl()}</Text>
        <Text style={styles.meta}>The app never stores database credentials.</Text>
        <Text style={styles.meta}>Admin Console is web-only and is not available here.</Text>
      </Card>
      <PrimaryButton
        label="Sign out"
        tone="danger"
        onPress={async () => {
          await signOut()
          router.replace('/login')
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  label: { color: colors.muted, fontWeight: '700' },
  value: { fontSize: 18, fontWeight: '800', color: colors.navy },
  meta: { color: colors.muted },
})
