import { Redirect, Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
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

  if (hydrated && !token) return <Redirect href="/login" />
  if (hydrated && token && !user) return <Redirect href="/" />
  if (!user) return null

  const perms = user.permissions
  const showPos = tabVisible('pos', perms)
  const showOrders = tabVisible('orders', perms)

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.white,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { minHeight: 58 },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="pos"
        options={{
          title: 'POS',
          href: showPos ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" color={color} size={size} />
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
