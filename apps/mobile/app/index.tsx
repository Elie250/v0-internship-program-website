import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useSessionStore } from '@/src/auth/session-store'
import { colors } from '@/src/theme'

/**
 * Future: customer home lives here.
 * Until customer mode ships, an authenticated staff session opens /staff.
 */
export default function Index() {
  const hydrated = useSessionStore((s) => s.hydrated)
  const token = useSessionStore((s) => s.token)
  const user = useSessionStore((s) => s.user)

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy }}>
        <ActivityIndicator color={colors.white} size="large" />
      </View>
    )
  }

  if (token && user) return <Redirect href="/staff" />
  return <Redirect href="/login" />
}
