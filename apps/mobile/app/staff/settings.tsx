import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { useBackToMore } from '@/src/navigation/use-back-to-more'
import { useSessionStore } from '@/src/auth/session-store'
import { getApiBaseUrl } from '@/src/api/client'
import { PrimaryButton } from '@/src/ui/Button'
import { Screen } from '@/src/ui/Screen'
import { colors, space, type } from '@/src/theme'

export default function SettingsScreen() {
  useBackToMore()
  const router = useRouter()
  const user = useSessionStore((s) => s.user)
  const signOut = useSessionStore((s) => s.signOut)

  return (
    <Screen>
      <Text style={type.kicker}>Energy & Logics</Text>
      <Text style={type.screenTitle}>Settings</Text>
      <View style={styles.group}>
        <Text style={styles.label}>Signed in</Text>
        <Text style={type.bodyMedium}>
          {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email}
        </Text>
        <Text style={type.helper}>{user?.email}</Text>
        <Text style={type.helper}>{user?.role.replace(/_/g, ' ')}</Text>
      </View>
      <View style={styles.group}>
        <Text style={styles.label}>API host</Text>
        <Text style={type.helper}>{getApiBaseUrl()}</Text>
        <Text style={type.helper}>The app never stores database credentials.</Text>
        <Text style={type.helper}>Admin Console is web-only and is not available here.</Text>
      </View>
      <PrimaryButton
        label="Sign out"
        variant="danger"
        onPress={async () => {
          await signOut()
          router.replace('/customer' as never)
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.xs,
  },
  label: type.kicker,
})
