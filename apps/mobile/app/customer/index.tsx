import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { usePublicCatalogue } from '@/src/features/shop/hooks'
import { useShopCart } from '@/src/features/shop/cart-store'
import { ProductCard } from '@/src/features/shop/ProductCard'
import { useShopText } from '@/src/i18n/locale-store'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { colors, space, type } from '@/src/theme'

export default function CustomerHome() {
  const router = useRouter()
  const t = useShopText()
  const addProduct = useShopCart((s) => s.addProduct)
  const query = usePublicCatalogue()

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <View style={styles.head}>
        <View style={styles.headCopy}>
          <Text style={type.kicker}>{t('brand.short')}</Text>
          <Text style={type.screenTitle}>{t('brand.name')}</Text>
          <Text style={type.helper}>{t('home.tagline')}</Text>
        </View>
        <View style={styles.headActions}>
          <Pressable
            onPress={() => router.push('/customer/language')}
            accessibilityRole="button"
            accessibilityLabel={t('nav.language')}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          >
            <Text style={styles.linkLabel}>{t('nav.language')}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/login')}
            accessibilityRole="button"
            accessibilityLabel={t('nav.staff')}
            style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          >
            <Text style={styles.linkLabel}>{t('nav.staff')}</Text>
          </Pressable>
        </View>
      </View>

      <Text style={type.sectionTitle}>{t('home.browse')}</Text>
      <ScreenState
        loading={query.isLoading && !query.data}
        error={query.error ? t('catalogue.error') : null}
        errorTitle={t('catalogue.error')}
        empty={(query.data?.products.length ?? 0) === 0}
        emptyTitle={t('catalogue.empty')}
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
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.md,
    alignItems: 'flex-start',
  },
  headCopy: { flex: 1, gap: 4 },
  headActions: { alignItems: 'flex-end', gap: 4 },
  link: { minHeight: 44, justifyContent: 'center' },
  linkLabel: { ...type.buttonSmall, color: colors.primary },
  pressed: { opacity: 0.7 },
  list: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  line: { height: 1, backgroundColor: colors.divider, marginLeft: 76 },
})
