import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useShopText } from '@/src/i18n/locale-store'
import { shopCartItemCount, useShopCart } from '@/src/features/shop/cart-store'
import { colors, font, type } from '@/src/theme'
import { makeStaffTabButton } from '@/src/ui/StaffTabButton'

export default function CustomerLayout() {
  const insets = useSafeAreaInsets()
  const t = useShopText()
  const cartCount = useShopCart((s) => shopCartItemCount(s.lines))
  const tabPad = insets.bottom

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: 64 + tabPad,
          paddingTop: 8,
          paddingBottom: Math.max(tabPad, 6),
          borderTopColor: colors.border,
          overflow: 'visible',
        },
        tabBarLabelStyle: { ...type.tab, fontFamily: font.semibold, marginBottom: 2 },
        tabBarItemStyle: { minHeight: 48, paddingVertical: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarButton: makeStaffTabButton(t('nav.home')),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t('nav.categories'),
          tabBarButton: makeStaffTabButton(t('nav.categories')),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('nav.search'),
          tabBarButton: makeStaffTabButton(t('nav.search')),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t('nav.cart'),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarButton: makeStaffTabButton(t('nav.cart')),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bag-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="product/[slug]" options={{ href: null, title: t('product.back') }} />
      <Tabs.Screen name="language" options={{ href: null, title: t('nav.language') }} />
    </Tabs>
  )
}
