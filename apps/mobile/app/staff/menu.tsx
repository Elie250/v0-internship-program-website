import { Redirect, useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSessionStore } from '@/src/auth/session-store'
import { filterStaffNavItems } from '@/src/permissions'
import { Screen } from '@/src/ui/Screen'
import { colors, space, type } from '@/src/theme'

const MORE_ORDER = ['products', 'inventory', 'sales', 'settings'] as const
const MORE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  products: 'cube-outline',
  inventory: 'layers-outline',
  sales: 'receipt-outline',
  settings: 'settings-outline',
}

export default function MoreMenuScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
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
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.bg }}>
      <Screen>
        <Text style={type.kicker}>Energy & Logics</Text>
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
                color={colors.navy}
              />
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          ))}
        </View>
      </Screen>
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  row: {
    minHeight: 52,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  pressed: { backgroundColor: colors.bg },
  label: { ...type.productName, flex: 1, color: colors.navy },
  chev: { fontSize: 20, color: colors.muted },
})
