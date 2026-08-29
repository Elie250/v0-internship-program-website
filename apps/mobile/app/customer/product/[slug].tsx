import { StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { usePublicProduct } from '@/src/features/shop/hooks'
import { useShopCart } from '@/src/features/shop/cart-store'
import { formatRwf } from '@/src/format'
import { useShopText } from '@/src/i18n/locale-store'
import { BackLink } from '@/src/ui/BackLink'
import { PrimaryButton } from '@/src/ui/Button'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { colors, radius, space, type } from '@/src/theme'

export default function CustomerProductDetail() {
  const router = useRouter()
  const t = useShopText()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const decoded = decodeURIComponent(String(slug || ''))
  const query = usePublicProduct(decoded)
  const addProduct = useShopCart((s) => s.addProduct)
  const product = query.data?.item
  const available = Boolean(product?.inStock && product.availability !== 'out')

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <BackLink
        label={t('product.back')}
        accessibilityLabel={t('product.back')}
        onPress={() => router.back()}
      />
      <ScreenState
        loading={query.isLoading && !query.data}
        error={query.error ? t('catalogue.error') : null}
        empty={!query.isLoading && !product}
        emptyTitle={t('product.notFound')}
        onRetry={() => void query.refetch()}
      >
        {product ? (
          <View style={styles.body}>
            <View style={styles.hero}>
              {product.image ? (
                <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" />
              ) : null}
            </View>
            <Text style={type.screenTitle}>{product.name}</Text>
            <Text style={type.helper}>
              {t('product.unit')}: {product.sellingUnitLabel}
            </Text>
            <Text style={type.checkoutTotal}>{formatRwf(product.price)}</Text>
            {product.listPrice ? (
              <Text style={styles.list}>{formatRwf(product.listPrice)}</Text>
            ) : null}
            {product.description ? <Text style={type.body}>{product.description}</Text> : null}
            <PrimaryButton
              label={available ? t('catalogue.add') : t('catalogue.unavailable')}
              disabled={!available}
              accessibilityLabel={
                available
                  ? t('cart.addNamed', { name: product.name })
                  : t('cart.outNamed', { name: product.name })
              }
              onPress={() => addProduct(product)}
            />
          </View>
        ) : null}
      </ScreenState>
    </Screen>
  )
}

const styles = StyleSheet.create({
  body: { gap: space.sm },
  hero: {
    height: 200,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  list: { ...type.metadata, textDecorationLine: 'line-through' },
})
