import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { useBackToMore } from '@/src/navigation/use-back-to-more'
import { leaveStaffForShop } from '@/src/navigation/leave-staff-for-shop'
import { useSessionStore } from '@/src/auth/session-store'
import { getApiBaseUrl } from '@/src/api/client'
import { PrimaryButton } from '@/src/ui/Button'
import { Screen } from '@/src/ui/Screen'
import { StaffModeBar } from '@/src/ui/StaffModeBar'
import { colors, space, type } from '@/src/theme'

export default function SettingsScreen() {
  useBackToMore()
  const router = useRouter()
  const user = useSessionStore((s) => s.user)
  const signOut = useSessionStore((s) => s.signOut)
  const lock = useSessionStore((s) => s.lock)
  const switchUser = useSessionStore((s) => s.switchUser)

  return (
    <Screen>
      <StaffModeBar />
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
        label="Customer shop"
        onPress={() => leaveStaffForShop(router)}
      />
      <PrimaryButton
        label="Lock / Switch user"
        onPress={async () => {
          await lock()
          router.replace('/login')
        }}
      />
      <PrimaryButton
        label="Switch staff user"
        onPress={async () => {
          await switchUser()
          router.replace('/login')
        }}
      />
      <PrimaryButton
        label="Sign out"
        variant="danger"
        onPress={async () => {
          await signOut()
          leaveStaffForShop(router)
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
