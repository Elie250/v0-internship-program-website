import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { catalogueErrorKey } from '@/src/features/shop/catalogue-error'
import { usePublicCatalogue } from '@/src/features/shop/hooks'
import { useShopCart } from '@/src/features/shop/cart-store'
import { ShopHeader } from '@/src/features/shop/ShopHeader'
import { ShopProductCard } from '@/src/features/shop/ShopProductCard'
import { ShopScreen } from '@/src/features/shop/ShopScreen'
import { sortProducts } from '@/src/features/shop/merchandising'
import { shopColor, shopRadius } from '@/src/features/shop/shop-theme'
import { useShopText } from '@/src/i18n/locale-store'
import { ScreenState } from '@/src/ui/Screen'
import { font } from '@/src/theme'

type SortId = 'name' | 'price_asc' | 'price_desc'

export default function CustomerSearch() {
  const router = useRouter()
  const t = useShopText()
  const params = useLocalSearchParams<{ category?: string; browse?: string }>()
  const [q, setQ] = useState('')
  const category = typeof params.category === 'string' ? params.category.trim() || undefined : undefined
  const [sort, setSort] = useState<SortId>('name')
  const addProduct = useShopCart((s) => s.addProduct)
  const activeQuery = q.trim()
  const searching = activeQuery.length > 0
  const browsingCategory = Boolean(category) && !searching
  const browsingAll = params.browse === '1' && !searching && !browsingCategory
  const showResults = searching || browsingCategory || browsingAll
  const query = usePublicCatalogue({
    q: searching ? activeQuery : undefined,
    category,
  })

  const categoryName =
    query.data?.categories.find((item) => item.slug === category)?.name ?? category

  const products = useMemo(() => {
    const list = query.data?.products ?? []
    const inCategory = category
      ? list.filter((item) => item.categorySlug === category)
      : list
    return sortProducts(inCategory, sort)
  }, [query.data?.products, sort, category])

  const cycleSort = () => {
    setSort((current) =>
      current === 'name' ? 'price_asc' : current === 'price_asc' ? 'price_desc' : 'name'
    )
  }

  return (
    <ShopScreen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {category ? (
        <ShopHeader
          title={categoryName ?? t('nav.categories')}
          showSearch={false}
          onBack={() => router.push('/customer/categories' as never)}
        />
      ) : null}
      <View style={styles.searchRow}>
        <View style={styles.field}>
          <Ionicons name="search-outline" size={18} color={shopColor.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={t('catalogue.searchPlaceholder')}
            placeholderTextColor={shopColor.muted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel={t('catalogue.searchPlaceholder')}
            style={styles.input}
            maxFontSizeMultiplier={1.2}
          />
          {q ? (
            <Pressable
              onPress={() => setQ('')}
              accessibilityRole="button"
              accessibilityLabel={t('catalogue.cancel')}
            >
              <Ionicons name="close-circle" size={18} color={shopColor.muted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() =>
            router.push((category ? '/customer/categories' : '/customer') as never)
          }
          accessibilityRole="button"
          accessibilityLabel={t('catalogue.cancel')}
        >
          <Text style={styles.cancel}>{t('catalogue.cancel')}</Text>
        </Pressable>
      </View>

      <View style={styles.meta}>
        <Text style={styles.results} maxFontSizeMultiplier={1.2}>
          {searching
            ? products.length === 0
              ? t('catalogue.resultsNone')
              : products.length === 1
                ? t('catalogue.resultsOne')
                : t('catalogue.resultsMany', { n: products.length })
            : browsingCategory
              ? categoryName
              : browsingAll
                ? t('catalogue.browseAll')
                : t('catalogue.searchHint')}
        </Text>
        {showResults ? (
          <Pressable onPress={cycleSort} accessibilityRole="button" accessibilityLabel={t('catalogue.sort')}>
            <Text style={styles.sort}>
              {t('catalogue.sort')}: {t(
                sort === 'name'
                  ? 'catalogue.sortName'
                  : sort === 'price_asc'
                    ? 'catalogue.sortPriceAsc'
                    : 'catalogue.sortPriceDesc'
              )}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {!showResults ? (
        <View style={styles.idle}>
          <Text style={styles.idleHint}>{t('catalogue.searchHint')}</Text>
          <Pressable
            onPress={() => router.push('/customer/categories' as never)}
            accessibilityRole="button"
            accessibilityLabel={t('nav.categories')}
            style={styles.idleBtn}
          >
            <Text style={styles.idleBtnLabel}>{t('nav.categories')}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.setParams({ browse: '1' })}
            accessibilityRole="button"
            accessibilityLabel={t('catalogue.browseAll')}
            style={styles.idleBtn}
          >
            <Text style={styles.idleBtnLabel}>{t('catalogue.browseAll')}</Text>
          </Pressable>
        </View>
      ) : (
        <ScreenState
          loading={query.isLoading && !query.data}
          loadingLabel={t('catalogue.loading')}
          error={query.error ? t(catalogueErrorKey(query.error)) : null}
          empty={products.length === 0}
          emptyTitle={searching ? t('catalogue.resultsNone') : t('catalogue.empty')}
          onRetry={() => void query.refetch()}
          retryLabel={t('catalogue.retry')}
        >
          <View style={styles.grid}>
            {products.map((product) => (
              <View key={product.slug} style={styles.cell}>
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
          </View>
        </ScreenState>
      )}
    </ShopScreen>
  )
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  field: {
    flex: 1,
    minHeight: 48,
    borderRadius: shopRadius.pill,
    backgroundColor: shopColor.tile,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 15,
    color: shopColor.text,
    paddingVertical: 8,
  },
  cancel: {
    fontFamily: font.semibold,
    fontSize: 15,
    color: shopColor.green,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  results: {
    fontFamily: font.regular,
    fontSize: 13,
    color: shopColor.muted,
  },
  sort: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: shopColor.text,
  },
  idle: { gap: 12 },
  idleHint: { fontFamily: font.regular, fontSize: 15, color: shopColor.textSecondary },
  idleBtn: {
    minHeight: 48,
    borderRadius: shopRadius.pill,
    backgroundColor: shopColor.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleBtnLabel: { fontFamily: font.semibold, fontSize: 15, color: shopColor.text },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: { width: '31%', flexGrow: 1, maxWidth: '32%' },
})
