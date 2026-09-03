import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { trackErrorKey } from '@/src/features/shop/catalogue-error'
import { usePublicOrder } from '@/src/features/shop/hooks'
import { ShopHeader } from '@/src/features/shop/ShopHeader'
import { ShopScreen } from '@/src/features/shop/ShopScreen'
import { TrackedOrderCard } from '@/src/features/shop/TrackedOrderCard'
import { shopColor, shopRadius } from '@/src/features/shop/shop-theme'
import { useShopText } from '@/src/i18n/locale-store'
import { ScreenState } from '@/src/ui/Screen'
import { font } from '@/src/theme'

export default function CustomerTrack() {
  const router = useRouter()
  const t = useShopText()
  const params = useLocalSearchParams<{ order?: string }>()
  const initial = String(params.order ?? '').trim()
  const [draft, setDraft] = useState(initial)
  const [lookup, setLookup] = useState(initial)
  const query = usePublicOrder(lookup)

  return (
    <ShopScreen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <ShopHeader title={t('track.title')} showSearch={false} onBack={() => router.back()} />
      <Text style={styles.heading}>{t('track.heading')}</Text>
      <Text style={styles.body}>{t('track.body')}</Text>
      <View style={styles.card}>
        <Text style={styles.label}>{t('track.orderNumber')}</Text>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
          accessibilityLabel={t('track.orderNumber')}
        />
        <Text style={styles.example}>{t('track.example')}</Text>
        <Pressable
          onPress={() => setLookup(draft.trim())}
          accessibilityRole="button"
          accessibilityLabel={t('track.lookup')}
          style={styles.primary}
        >
          <Text style={styles.primaryLabel}>{t('track.lookup')}</Text>
        </Pressable>
      </View>

      {lookup ? (
        <ScreenState
          loading={query.isLoading && !query.data}
          loadingLabel={t('track.loading')}
          error={query.error ? t(trackErrorKey(query.error)) : null}
          empty={!query.isLoading && !query.data && !query.error}
          emptyTitle={t('track.notFound')}
          onRetry={() => void query.refetch()}
          retryLabel={t('catalogue.retry')}
        >
          {query.data ? <TrackedOrderCard order={query.data} /> : null}
        </ScreenState>
      ) : null}
    </ShopScreen>
  )
}

const styles = StyleSheet.create({
  heading: { fontFamily: font.bold, fontSize: 24, color: shopColor.text },
  body: { fontFamily: font.regular, fontSize: 15, color: shopColor.textSecondary },
  card: {
    backgroundColor: shopColor.white,
    borderRadius: shopRadius.lg,
    borderWidth: 1,
    borderColor: shopColor.border,
    padding: 16,
    gap: 10,
  },
  label: { fontFamily: font.semibold, fontSize: 13, color: shopColor.text },
  input: {
    minHeight: 48,
    borderRadius: shopRadius.md,
    backgroundColor: shopColor.tile,
    paddingHorizontal: 12,
    fontFamily: font.regular,
    fontSize: 16,
    color: shopColor.text,
  },
  example: { fontFamily: font.regular, fontSize: 12, color: shopColor.muted },
  primary: {
    minHeight: 48,
    borderRadius: shopRadius.pill,
    backgroundColor: shopColor.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { fontFamily: font.semibold, fontSize: 16, color: shopColor.white },
})
