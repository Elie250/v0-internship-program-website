import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { usePublicCatalogue } from '@/src/features/shop/hooks'
import { useShopCart } from '@/src/features/shop/cart-store'
import { ProductCard } from '@/src/features/shop/ProductCard'
import { useShopText } from '@/src/i18n/locale-store'
import { FilterChips } from '@/src/ui/FilterChips'
import { ProductSearchField } from '@/src/ui/SearchField'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { colors, space, type } from '@/src/theme'

export default function CustomerSearch() {
  const router = useRouter()
  const t = useShopText()
  const params = useLocalSearchParams<{ category?: string }>()
  const [q, setQ] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [category, setCategory] = useState(params.category || 'all')
  const addProduct = useShopCart((s) => s.addProduct)
  const query = usePublicCatalogue({
    q: submitted || undefined,
    category: category === 'all' ? undefined : category,
  })

  const chips = [
    { id: 'all', label: t('catalogue.all') },
    ...(query.data?.categories ?? []).map((item) => ({ id: item.slug, label: item.name })),
  ]

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Text style={type.kicker}>{t('brand.short')}</Text>
      <Text style={type.screenTitle}>{t('nav.search')}</Text>
      <ProductSearchField
        value={q}
        onChange={setQ}
        placeholder={t('catalogue.searchPlaceholder')}
        onSubmit={() => setSubmitted(q.trim())}
      />
      <FilterChips items={chips} selectedId={category} onSelect={setCategory} />
      <ScreenState
        loading={query.isLoading && !query.data}
        error={query.error ? t('catalogue.error') : null}
        empty={(query.data?.products.length ?? 0) === 0}
        emptyTitle={submitted || category !== 'all' ? t('catalogue.noResults') : t('catalogue.empty')}
        onRetry={() => void query.refetch()}
      >
        <View style={styles.list}>
          {(query.data?.products ?? []).map((product, index, all) => (
            <View key={product.slug}>
              <ProductCard
                product={product}
                onOpen={() =>
                  router.push(`/customer/product/${encodeURIComponent(product.slug)}` as never)
                }
                onAdd={() => addProduct(product)}
              />
              {index < all.length - 1 ? <View style={styles.line} /> : null}
            </View>
          ))}
        </View>
      </ScreenState>
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  line: { height: 1, backgroundColor: colors.divider, marginLeft: 76 },
})
