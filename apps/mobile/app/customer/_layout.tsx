import { Tabs, useSegments } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCustomerShopBoundary } from '@/src/navigation/use-customer-shop-boundary'
import { useShopText } from '@/src/i18n/locale-store'
import { shopCartItemCount, useShopCart } from '@/src/features/shop/cart-store'
import { makeShopTabButton } from '@/src/features/shop/ShopTabButton'
import { shopColor } from '@/src/features/shop/shop-theme'
import { font, type } from '@/src/theme'

export default function CustomerLayout() {
  useCustomerShopBoundary()
  const insets = useSafeAreaInsets()
  const t = useShopText()
  const cartCount = useShopCart((s) => shopCartItemCount(s.lines))
  const segments = useSegments()
  const hideTabs = (segments as string[]).some((segment) =>
    ['product', 'checkout', 'track', 'order'].includes(segment)
  )
  const tabPad = insets.bottom

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: shopColor.green,
        tabBarInactiveTintColor: shopColor.muted,
        tabBarStyle: hideTabs
          ? { display: 'none' }
          : {
              height: 64 + tabPad,
              paddingTop: 8,
              paddingBottom: Math.max(tabPad, 6),
              borderTopColor: shopColor.border,
              backgroundColor: shopColor.white,
            },
        tabBarLabelStyle: { ...type.tab, fontFamily: font.semibold, marginBottom: 2 },
        tabBarItemStyle: { minHeight: 48, paddingVertical: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarButton: makeShopTabButton(t('nav.home')),
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t('nav.categories'),
          tabBarButton: makeShopTabButton(t('nav.categories')),
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('nav.search'),
          tabBarButton: makeShopTabButton(t('nav.search')),
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
          tabBarBadgeStyle: { backgroundColor: shopColor.green, color: shopColor.white },
          tabBarButton: makeShopTabButton(t('nav.cart')),
          tabBarIcon: ({ color, size }) => <Ionicons name="bag-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t('nav.account'),
          tabBarButton: makeShopTabButton(t('nav.account')),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="product/[slug]" options={{ href: null, title: t('product.back') }} />
      <Tabs.Screen name="checkout" options={{ href: null, title: t('checkout.title') }} />
      <Tabs.Screen name="track" options={{ href: null, title: t('track.title') }} />
      <Tabs.Screen name="order/[ref]" options={{ href: null, title: t('confirm.title') }} />
      <Tabs.Screen name="language" options={{ href: null, title: t('nav.language') }} />
    </Tabs>
  )
}
