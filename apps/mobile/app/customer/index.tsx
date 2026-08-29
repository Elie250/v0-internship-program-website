import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { catalogueErrorKey } from '@/src/features/shop/catalogue-error'
import { usePublicCatalogue } from '@/src/features/shop/hooks'
import { useShopCart } from '@/src/features/shop/cart-store'
import { ShopHeader } from '@/src/features/shop/ShopHeader'
import { ShopProductCard } from '@/src/features/shop/ShopProductCard'
import { ShopScreen, ShopSection } from '@/src/features/shop/ShopScreen'
import { HeroBanner } from '@/src/features/shop/HeroBanner'
import {
  categoryCover,
  latestArrivals,
  moreInShop,
  selectDealProducts,
  selectHeroSlides,
  selectLatestProducts,
  trendingProducts,
} from '@/src/features/shop/merchandising'
import { shopColor, shopRadius } from '@/src/features/shop/shop-theme'
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
  const heroSlides = selectHeroSlides(latest)
  const latestCards = selectLatestProducts(products, heroSlides)
  const deals = selectDealProducts(products)
  const trending = trendingProducts(products, [...heroSlides, ...latestCards, ...deals])
  const leftover = moreInShop(products, [...latestCards, ...deals, ...trending])
  const more = leftover.length > 0 ? leftover : products

  const openHero = (product: (typeof heroSlides)[number] | null) => {
    if (product) {
      router.push(`/customer/product/${encodeURIComponent(product.slug)}` as never)
      return
    }
    router.push('/customer/search' as never)
  }

  return (
    <ShopScreen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <ShopHeader />

      <HeroBanner
        slides={heroSlides}
        title={t('home.heroTitle')}
        emphasis={t('home.heroEmphasis')}
        body={t('home.heroBody')}
        shopNow={t('home.shopNow')}
        fallbackLabel={t('home.shopNow')}
        onOpen={openHero}
      />

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
                      router.push({
                        pathname: '/customer/search',
                        params: { category: category.slug },
                      } as never)
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

        {latestCards.length > 0 ? (
          <ShopSection>
            <SectionHead
              title={t('home.latest')}
              onSeeAll={() =>
                router.push({ pathname: '/customer/search', params: { browse: '1' } } as never)
              }
            />
            <View style={styles.grid}>
              {latestCards.map((product) => (
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
        ) : null}

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

        {deals.length > 0 ? (
          <ShopSection>
            <SectionHead title={t('home.deals')} />
            <View style={styles.grid}>
              {deals.map((product) => (
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
        ) : null}

        {products.length > 0 ? (
          <ShopSection>
            <SectionHead
              title={t('home.more')}
              onSeeAll={() =>
                router.push({ pathname: '/customer/search', params: { browse: '1' } } as never)
              }
            />
            <View style={styles.grid}>
              {(more.length > 0 ? more : products).map((product) => (
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
