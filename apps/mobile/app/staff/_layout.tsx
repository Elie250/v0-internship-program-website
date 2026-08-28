import { Redirect, Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSessionStore } from '@/src/auth/session-store'
import { canSeeStaffNavItem, STAFF_NAV_ITEMS } from '@/src/permissions'
import { colors } from '@/src/theme'

function tabVisible(key: 'pos' | 'orders', permissions: string[] | undefined) {
  const item = STAFF_NAV_ITEMS.find((entry) => entry.key === key)
  return item ? canSeeStaffNavItem(permissions, item) : false
}

export default function StaffLayout() {
  const token = useSessionStore((s) => s.token)
  const user = useSessionStore((s) => s.user)
  const hydrated = useSessionStore((s) => s.hydrated)
  const insets = useSafeAreaInsets()

  if (hydrated && !token) return <Redirect href="/login" />
  if (hydrated && token && !user) return <Redirect href="/" />
  if (!user) return null

  const perms = user.permissions
  const showPos = tabVisible('pos', perms)
  const showOrders = tabVisible('orders', perms)
  const tabPad = Math.max(insets.bottom, 8)

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 72 + tabPad,
          paddingTop: 6,
          paddingBottom: tabPad,
        },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        tabBarItemStyle: { minHeight: 44 },
      }}
    >
      <Tabs.Screen
        name="pos"
        options={{
          title: 'POS',
          headerShown: false,
          href: showPos ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          href: showOrders ? undefined : null,
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'More',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="sales" options={{ href: null, title: 'Sales' }} />
      <Tabs.Screen name="products" options={{ href: null, title: 'Products' }} />
      <Tabs.Screen name="inventory" options={{ href: null, title: 'Inventory' }} />
      <Tabs.Screen name="settings" options={{ href: null, title: 'Settings' }} />
    </Tabs>
  )
}
