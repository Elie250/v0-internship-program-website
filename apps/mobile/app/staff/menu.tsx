import { Redirect, useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSessionStore } from '@/src/auth/session-store'
import { filterStaffNavItems } from '@/src/permissions'
import { Screen } from '@/src/ui/Screen'
import { StaffModeBar } from '@/src/ui/StaffModeBar'
import { colors, control, radius, space, type } from '@/src/theme'

const MORE_ORDER = ['products', 'inventory', 'sales', 'settings'] as const
const MORE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  products: 'cube-outline',
  inventory: 'layers-outline',
  sales: 'receipt-outline',
  settings: 'settings-outline',
}

export default function MoreMenuScreen() {
  const router = useRouter()
  const user = useSessionStore((s) => s.user)
  if (!user) return <Redirect href="/login" />

  const extras = filterStaffNavItems(user.permissions)
    .filter((item) => MORE_ORDER.includes(item.key as (typeof MORE_ORDER)[number]))
    .sort(
      (a, b) =>
        MORE_ORDER.indexOf(a.key as (typeof MORE_ORDER)[number]) -
        MORE_ORDER.indexOf(b.key as (typeof MORE_ORDER)[number])
    )

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Screen>
        <StaffModeBar />
        <Text style={type.screenTitle}>More</Text>
        <View style={styles.list}>
          {extras.map((item, index) => (
            <Pressable
              key={item.key}
              onPress={() => router.push(item.href as never)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={({ pressed }) => [
                styles.row,
                index < extras.length - 1 && styles.rowLine,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={MORE_ICONS[item.key] || 'ellipse-outline'}
                size={20}
                color={colors.primary}
                importantForAccessibility="no"
              />
              <Text style={styles.label}>{item.label}</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
                importantForAccessibility="no"
              />
            </Pressable>
          ))}
        </View>
      </Screen>
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    minHeight: control.height,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s12,
  },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  pressed: { backgroundColor: colors.background },
  label: { ...type.productName, flex: 1 },
})
