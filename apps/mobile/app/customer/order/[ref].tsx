import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { trackErrorKey } from '@/src/features/shop/catalogue-error'
import { usePublicOrder } from '@/src/features/shop/hooks'
import { ShopHeader } from '@/src/features/shop/ShopHeader'
import { ShopScreen } from '@/src/features/shop/ShopScreen'
import { TrackedOrderCard } from '@/src/features/shop/TrackedOrderCard'
import { shopColor, shopRadius } from '@/src/features/shop/shop-theme'
import { formatRwf } from '@/src/format'
import { useShopText } from '@/src/i18n/locale-store'
import { ScreenState } from '@/src/ui/Screen'
import { font } from '@/src/theme'

export default function CustomerOrder() {
  const router = useRouter()
  const t = useShopText()
  const { ref, placed } = useLocalSearchParams<{ ref: string; placed?: string }>()
  const decoded = decodeURIComponent(String(ref || '')).trim()
  const justPlaced = placed === '1'
  const query = usePublicOrder(decoded)
  const order = query.data

  return (
    <ShopScreen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <ShopHeader
        title={justPlaced ? t('confirm.title') : t('track.title')}
        showSearch={false}
        onBack={() => router.replace('/customer' as never)}
      />
      {justPlaced ? (
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{t('confirm.title')}</Text>
          <Text style={styles.heroBody}>{t('confirm.thankYou')}</Text>
          <Text style={styles.ref} selectable>
            {decoded}
          </Text>
          {order ? <Text style={styles.total}>{formatRwf(order.totalAmount)}</Text> : null}
          <Text style={styles.pending}>{t('confirm.paymentPending')}</Text>
          <Text style={styles.next}>
            {order?.fulfillmentType === 'delivery' ? t('checkout.nextDelivery') : t('checkout.nextPickup')}
          </Text>
          <Text style={styles.keep}>{t('confirm.keepNumber')}</Text>
          <Text style={styles.keep}>{t('confirm.receiptEmail')}</Text>
        </View>
      ) : null}

      <ScreenState
        loading={query.isLoading && !query.data}
        loadingLabel={t('track.loading')}
        error={query.error ? t(trackErrorKey(query.error)) : null}
        empty={!query.isLoading && !order && !query.error}
        emptyTitle={t('track.notFound')}
        onRetry={() => void query.refetch()}
        retryLabel={t('catalogue.retry')}
      >
        {order ? <TrackedOrderCard order={order} /> : null}
      </ScreenState>

      <Pressable
        onPress={() =>
          router.push(`/customer/track?order=${encodeURIComponent(decoded)}` as never)
        }
        accessibilityRole="button"
        accessibilityLabel={t('confirm.track')}
        style={styles.primary}
      >
        <Text style={styles.primaryLabel}>{t('confirm.track')}</Text>
      </Pressable>
      <Pressable
        onPress={() => router.replace('/customer' as never)}
        accessibilityRole="button"
        accessibilityLabel={t('cart.continue')}
        style={styles.secondary}
      >
        <Text style={styles.secondaryLabel}>{t('cart.continue')}</Text>
      </Pressable>
    </ShopScreen>
  )
}

const styles = StyleSheet.create({
  hero: { gap: 8 },
  heroTitle: { fontFamily: font.bold, fontSize: 24, color: shopColor.text },
  heroBody: { fontFamily: font.regular, fontSize: 15, color: shopColor.textSecondary },
  ref: { fontFamily: font.bold, fontSize: 26, color: shopColor.text, marginTop: 8 },
  total: { fontFamily: font.bold, fontSize: 22, color: shopColor.green },
  pending: { fontFamily: font.semibold, fontSize: 14, color: shopColor.text },
  next: { fontFamily: font.regular, fontSize: 14, color: shopColor.textSecondary },
  keep: { fontFamily: font.regular, fontSize: 13, color: shopColor.muted },
  primary: {
    minHeight: 48,
    borderRadius: shopRadius.pill,
    backgroundColor: shopColor.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { fontFamily: font.semibold, fontSize: 16, color: shopColor.white },
  secondary: {
    minHeight: 48,
    borderRadius: shopRadius.pill,
    backgroundColor: shopColor.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: { fontFamily: font.semibold, fontSize: 16, color: shopColor.text },
})
