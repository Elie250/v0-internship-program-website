import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { staffQueryClient } from '@/src/api/query-client'
import { useSessionStore } from '@/src/auth/session-store'
import { plexFontMap } from '@/src/fonts'
import { useShopCart } from '@/src/features/shop/cart-store'
import { useFavorites } from '@/src/features/shop/favorites-store'
import { useLocaleStore } from '@/src/i18n/locale-store'
import { colors, font } from '@/src/theme'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const hydrateSession = useSessionStore((s) => s.hydrate)
  const hydrateLocale = useLocaleStore((s) => s.hydrate)
  const hydrateFavorites = useFavorites((s) => s.hydrate)
  const hydrateCart = useShopCart((s) => s.hydrate)
  const localeReady = useLocaleStore((s) => s.hydrated)
  const [fontsLoaded, fontError] = useFonts(plexFontMap)
  const fontsReady = fontsLoaded || Boolean(fontError)
  const ready = fontsReady && localeReady

  useEffect(() => {
    void hydrateLocale()
    void hydrateFavorites()
    void hydrateCart()
    void hydrateSession()
  }, [hydrateLocale, hydrateFavorites, hydrateCart, hydrateSession])

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync()
    }
  }, [ready])

  if (!ready) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={staffQueryClient}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.primary },
              headerTintColor: colors.textOnPrimary,
              headerTitleStyle: { fontFamily: font.semibold, fontSize: 17 },
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="customer" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ title: 'Staff sign in', headerBackVisible: false }} />
            <Stack.Screen name="staff" options={{ headerShown: false }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
