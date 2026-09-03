import type { ReactNode } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScreenState } from '@/src/ui/Screen'
import { shopColor, shopSpace } from '@/src/features/shop/shop-theme'

export function ShopScreen({
  children,
  refreshing,
  onRefresh,
}: {
  children: ReactNode
  refreshing?: boolean
  onRefresh?: () => void
}) {
  const insets = useSafeAreaInsets()
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: shopSpace.md + insets.top }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  )
}

export function ShopSection({ children }: { children: ReactNode }) {
  return <View style={styles.section}>{children}</View>
}

export { ScreenState }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: shopColor.bg },
  content: { paddingHorizontal: shopSpace.md, paddingBottom: 32, gap: shopSpace.lg },
  section: { gap: 12 },
})
