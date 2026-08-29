import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { usePublicCatalogue } from '@/src/features/shop/hooks'
import { useFavorites } from '@/src/features/shop/favorites-store'
import { ShopHeader } from '@/src/features/shop/ShopHeader'
import { ShopProductCard } from '@/src/features/shop/ShopProductCard'
import { ShopScreen } from '@/src/features/shop/ShopScreen'
import { useShopCart } from '@/src/features/shop/cart-store'
import { shopColor, shopRadius } from '@/src/features/shop/shop-theme'
import { useLocaleStore, useShopText } from '@/src/i18n/locale-store'
import { font } from '@/src/theme'

export default function CustomerAccount() {
  const router = useRouter()
  const t = useShopText()
  const locale = useLocaleStore((s) => s.locale)
  const slugs = useFavorites((s) => s.slugs)
  const addProduct = useShopCart((s) => s.addProduct)
  const query = usePublicCatalogue()
  const saved = (query.data?.products ?? []).filter((item) => slugs.includes(item.slug))

  return (
    <ShopScreen>
      <ShopHeader title={t('account.title')} showSearch={false} />
      <Pressable
        onPress={() => router.push('/customer/language' as never)}
        accessibilityRole="button"
        accessibilityLabel={t('account.language')}
        style={styles.row}
      >
        <Ionicons name="language-outline" size={20} color={shopColor.text} />
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>{t('account.language')}</Text>
          <Text style={styles.rowMeta}>{locale === 'rw' ? t('language.rw') : t('language.en')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={shopColor.muted} />
      </Pressable>
      <Pressable
        onPress={() => router.push('/customer/track' as never)}
        accessibilityRole="button"
        accessibilityLabel={t('account.track')}
        style={styles.row}
      >
        <Ionicons name="receipt-outline" size={20} color={shopColor.text} />
        <Text style={[styles.rowTitle, styles.grow]}>{t('account.track')}</Text>
        <Ionicons name="chevron-forward" size={18} color={shopColor.muted} />
      </Pressable>
      <Pressable
        onPress={() => router.push('/login')}
        accessibilityRole="button"
        accessibilityLabel={t('nav.staff')}
        style={styles.row}
      >
        <Ionicons name="storefront-outline" size={20} color={shopColor.text} />
        <Text style={[styles.rowTitle, styles.grow]}>{t('nav.staff')}</Text>
        <Ionicons name="chevron-forward" size={18} color={shopColor.muted} />
      </Pressable>
      <Text style={styles.section}>{t('account.saved')}</Text>
      {saved.length === 0 ? (
        <Text style={styles.empty}>{t('favourite.empty')}</Text>
      ) : (
        <View style={styles.grid}>
          {saved.map((product) => (
            <View key={product.slug} style={styles.cell}>
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
      )}
    </ShopScreen>
  )
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    borderRadius: shopRadius.md,
    backgroundColor: shopColor.tile,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowCopy: { flex: 1 },
  grow: { flex: 1 },
  rowTitle: { fontFamily: font.semibold, fontSize: 15, color: shopColor.text },
  rowMeta: { fontFamily: font.regular, fontSize: 12, color: shopColor.muted },
  section: { fontFamily: font.bold, fontSize: 18, color: shopColor.text, marginTop: 8 },
  empty: { fontFamily: font.regular, fontSize: 14, color: shopColor.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '48%', flexGrow: 1, maxWidth: '48%' },
})
