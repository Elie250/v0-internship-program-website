import { Redirect } from 'expo-router'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { useSessionStore } from '@/src/auth/session-store'
import { PrimaryButton } from '@/src/ui/Button'
import { colors, space } from '@/src/theme'

/**
 * Future: customer home lives here.
 * Until customer mode ships, an authenticated staff session opens /staff.
 */
export default function Index() {
  const hydrated = useSessionStore((s) => s.hydrated)
  const token = useSessionStore((s) => s.token)
  const user = useSessionStore((s) => s.user)
  const restoreError = useSessionStore((s) => s.restoreError)
  const hydrate = useSessionStore((s) => s.hydrate)

  if (!hydrated) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.white} size="large" />
      </View>
    )
  }

  if (token && user) return <Redirect href="/staff" />

  if (token && restoreError) {
    return (
      <View style={styles.restore}>
        <Text style={styles.title}>Can't reach the shop right now</Text>
        <Text style={styles.body}>{restoreError}</Text>
        <PrimaryButton label="Try again" onPress={() => void hydrate()} />
      </View>
    )
  }

  return <Redirect href="/login" />
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy },
  restore: {
    flex: 1,
    justifyContent: 'center',
    padding: space.lg,
    backgroundColor: colors.bg,
    gap: space.md,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.navy },
  body: { fontSize: 15, color: colors.muted, lineHeight: 22 },
})
