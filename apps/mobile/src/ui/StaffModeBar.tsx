import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSessionStore } from '@/src/auth/session-store'
import { leaveStaffForShop } from '@/src/navigation/leave-staff-for-shop'
import { colors, font, space } from '@/src/theme'

export function StaffModeBar() {
  const router = useRouter()
  const user = useSessionStore((s) => s.user)
  const lock = useSessionStore((s) => s.lock)
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Staff'

  return (
    <View style={styles.wrap}>
      <View style={styles.copy}>
        <Text style={styles.brand}>Energy & Logics</Text>
        <Text style={styles.mode}>Staff</Text>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <Pressable
        onPress={() => leaveStaffForShop(router)}
        accessibilityRole="button"
        accessibilityLabel="Customer shop"
        style={styles.btn}
      >
        <Text style={styles.btnLabel}>Shop</Text>
      </Pressable>
      <Pressable
        onPress={async () => {
          await lock()
          router.replace('/login')
        }}
        accessibilityRole="button"
        accessibilityLabel="Lock / Switch user"
        style={styles.btn}
      >
        <Text style={styles.btnLabel}>Lock</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.md,
  },
  copy: { flex: 1, gap: 2 },
  brand: { fontFamily: font.semibold, fontSize: 12, color: colors.textMuted },
  mode: { fontFamily: font.bold, fontSize: 16, color: colors.primary },
  name: { fontFamily: font.regular, fontSize: 13, color: colors.text },
  btn: {
    minHeight: 40,
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  btnLabel: { fontFamily: font.semibold, fontSize: 13, color: colors.primary },
})
