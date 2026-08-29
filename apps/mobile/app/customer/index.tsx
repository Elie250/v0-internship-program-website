import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { catalogueErrorKey } from '@/src/features/shop/catalogue-error'
import { usePublicCatalogue } from '@/src/features/shop/hooks'
import { useShopCart } from '@/src/features/shop/cart-store'
import { ShopHeader } from '@/src/features/shop/ShopHeader'
import { ShopProductCard } from '@/src/features/shop/ShopProductCard'
import { ShopScreen, ShopSection } from '@/src/features/shop/ShopScreen'
import {
  categoryCover,
  latestArrivals,
  selectHeroProduct,
  trendingProducts,
} from '@/src/features/shop/merchandising'
import { shopColor, shopRadius, shopSpace } from '@/src/features/shop/shop-theme'
import { useShopText } from '@/src/i18n/locale-store'
import { ScreenState } from '@/src/ui/Screen'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { font } from '@/src/theme'

export default function CustomerHome() {
  const router = useRouter()
  const t = useShopText()
  const addProduct = useShopCart((s) => s.addProduct)
  const query = usePublicCatalogue()
  const products = query.data?.products ?? []
  const categories = query.data?.categories ?? []
  const latest = latestArrivals(products)
  const trending = trendingProducts(products)
  const heroProduct = selectHeroProduct(products)

  const openHero = () => {
    if (heroProduct) {
      router.push(`/customer/product/${encodeURIComponent(heroProduct.slug)}` as never)
      return
    }
    router.push('/customer/search' as never)
  }

  return (
    <ShopScreen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <ShopHeader />

      <Pressable
        onPress={openHero}
        accessibilityRole="button"
        accessibilityLabel={heroProduct ? heroProduct.name : t('home.shopNow')}
        style={({ pressed }) => [styles.hero, pressed && styles.pressed]}
      >
        {heroProduct?.image ? (
          <Image
            source={{ uri: heroProduct.image }}
            style={styles.heroImage}
            contentFit="contain"
          />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name="cube-outline" size={48} color="#9CA3AF" />
          </View>
        )}
        <View style={styles.heroShade} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>
            {t('home.heroTitle')}{' '}
            <Text style={styles.heroEm}>{t('home.heroEmphasis')}</Text>
          </Text>
          <Text style={styles.heroBody}>{t('home.heroBody')}</Text>
          <View style={styles.heroBtn}>
            <Text style={styles.heroBtnLabel}>{t('home.shopNow')}</Text>
          </View>
        </View>
      </Pressable>

      <ScreenState
        loading={query.isLoading && !query.data}
        loadingLabel={t('catalogue.loading')}
        error={query.error ? t(catalogueErrorKey(query.error)) : null}
        empty={products.length === 0}
        emptyTitle={t('catalogue.empty')}
        onRetry={() => void query.refetch()}
        retryLabel={t('catalogue.retry')}
      >
        {categories.length > 0 ? (
          <ShopSection>
            <SectionHead
              title={t('home.categories')}
              onSeeAll={() => router.push('/customer/categories' as never)}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {categories.map((category) => {
                const cover = categoryCover(category, products)
                return (
                  <Pressable
                    key={category.slug}
                    onPress={() =>
                      router.push(
                        `/customer/search?category=${encodeURIComponent(category.slug)}` as never
                      )
                    }
                    accessibilityRole="button"
                    accessibilityLabel={category.name}
                    style={styles.catTile}
                  >
                    <View style={styles.catImage}>
                      {cover ? (
                        <Image source={{ uri: cover }} style={styles.cover} contentFit="contain" />
                      ) : (
                        <Ionicons name="grid-outline" size={22} color={shopColor.muted} />
                      )}
                    </View>
                    <Text style={styles.catLabel} numberOfLines={2} maxFontSizeMultiplier={1.2}>
                      {category.name}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </ShopSection>
        ) : null}

        <ShopSection>
          <SectionHead
            title={t('home.latest')}
            onSeeAll={() => router.push('/customer/search' as never)}
          />
          <View style={styles.grid}>
            {latest.map((product) => (
              <View key={product.slug} style={styles.gridItem}>
                <ShopProductCard
                  product={product}
                  onOpen={() =>
                    router.push(`/customer/product/${encodeURIComponent(product.slug)}` as never)
                  }
                  onAdd={() => addProduct(product)}
                />
              </View>
            ))}
          </View>
        </ShopSection>

        {trending.length > 0 ? (
          <ShopSection>
            <SectionHead title={t('home.trending')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {trending.map((product) => (
                <View key={product.slug} style={styles.trendCard}>
                  <ShopProductCard
                    product={product}
                    compact
                    onOpen={() =>
                      router.push(`/customer/product/${encodeURIComponent(product.slug)}` as never)
                    }
                    onAdd={() => addProduct(product)}
                  />
                </View>
              ))}
            </ScrollView>
          </ShopSection>
        ) : null}
      </ScreenState>
    </ShopScreen>
  )
}

function SectionHead({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const t = useShopText()
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.2}>
        {title}
      </Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} accessibilityRole="button" accessibilityLabel={t('home.seeAll')}>
          <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  hero: {
    minHeight: 220,
    borderRadius: shopRadius.lg,
    backgroundColor: shopColor.hero,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: shopColor.hero,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 18, 12, 0.42)',
  },
  heroCopy: {
    padding: shopSpace.lg,
    gap: 10,
    zIndex: 1,
  },
  heroTitle: {
    fontFamily: font.bold,
    fontSize: 26,
    lineHeight: 32,
    color: shopColor.white,
  },
  heroEm: { color: shopColor.green },
  heroBody: {
    fontFamily: font.regular,
    fontSize: 14,
    color: '#D1D5DB',
  },
  heroBtn: {
    alignSelf: 'flex-start',
    backgroundColor: shopColor.green,
    borderRadius: shopRadius.pill,
    paddingHorizontal: 16,
    minHeight: 40,
    justifyContent: 'center',
  },
  heroBtnLabel: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: shopColor.white,
  },
  pressed: { opacity: 0.88 },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: font.bold,
    fontSize: 18,
    color: shopColor.text,
  },
  seeAll: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: shopColor.green,
  },
  hRow: { gap: 12, paddingRight: 8 },
  catTile: { width: 88, gap: 6 },
  catImage: {
    height: 72,
    borderRadius: shopRadius.md,
    backgroundColor: shopColor.tile,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cover: { width: '100%', height: '100%' },
  catLabel: {
    fontFamily: font.medium,
    fontSize: 11,
    lineHeight: 14,
    color: shopColor.text,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: { width: '48%', flexGrow: 1, maxWidth: '48%' },
  trendCard: { width: 132 },
})
