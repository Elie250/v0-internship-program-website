import { useEffect, useState } from 'react'
import { Pressable, Share, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { clampCartQuantity } from '@/src/features/shop/cart-rules'
import { catalogueErrorKey } from '@/src/features/shop/catalogue-error'
import { usePublicProduct } from '@/src/features/shop/hooks'
import { useShopCart } from '@/src/features/shop/cart-store'
import { useFavorites } from '@/src/features/shop/favorites-store'
import { ShopScreen } from '@/src/features/shop/ShopScreen'
import { shopColor, shopRadius } from '@/src/features/shop/shop-theme'
import { formatRwf } from '@/src/format'
import { useShopText } from '@/src/i18n/locale-store'
import { ScreenState } from '@/src/ui/Screen'
import { font } from '@/src/theme'

export default function CustomerProductDetail() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const t = useShopText()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const decoded = decodeURIComponent(String(slug || ''))
  const query = usePublicProduct(decoded)
  const addProduct = useShopCart((s) => s.addProduct)
  const product = query.data?.item
  const saved = useFavorites((s) => (product ? s.slugs.includes(product.slug) : false))
  const toggle = useFavorites((s) => s.toggle)
  const [qty, setQty] = useState(1)
  const [more, setMore] = useState(false)
  const available = Boolean(product?.inStock && product.availability !== 'out')
  const maxQuantity = product?.maxQuantity ?? 0
  const canIncrease = clampCartQuantity(qty + 1, maxQuantity) > qty
  const description = product?.description?.trim() || ''

  useEffect(() => {
    if (!product) return
    setQty((current) => {
      const next = clampCartQuantity(current, product.maxQuantity)
      return next > 0 ? next : 1
    })
  }, [product])

  return (
    <View style={styles.wrap}>
      <ShopScreen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
        <View style={styles.top}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('product.back')}
            style={styles.iconBtn}
          >
            <Ionicons name="chevron-back" size={24} color={shopColor.text} />
          </Pressable>
          <View style={styles.topRight}>
            <Pressable
              onPress={() => product && toggle(product.slug)}
              accessibilityRole="button"
              accessibilityLabel={
                product
                  ? saved
                    ? t('favourite.remove', { name: product.name })
                    : t('favourite.add', { name: product.name })
                  : t('product.back')
              }
              style={styles.iconBtn}
            >
              <Ionicons
                name={saved ? 'heart' : 'heart-outline'}
                size={22}
                color={saved ? shopColor.danger : shopColor.text}
              />
            </Pressable>
            <Pressable
              onPress={() => {
                if (!product) return
                void Share.share({
                  message: `${product.name} — ${formatRwf(product.price)} · ${product.sellingUnitLabel}`,
                })
              }}
              accessibilityRole="button"
              accessibilityLabel={t('product.share')}
              style={styles.iconBtn}
            >
              <Ionicons name="share-outline" size={22} color={shopColor.text} />
            </Pressable>
          </View>
        </View>

        <ScreenState
          loading={query.isLoading && !query.data}
          loadingLabel={t('catalogue.loading')}
          error={query.error ? t(catalogueErrorKey(query.error)) : null}
          empty={!query.isLoading && !product}
          emptyTitle={t('product.notFound')}
          onRetry={() => void query.refetch()}
          retryLabel={t('catalogue.retry')}
        >
          {product ? (
            <View style={styles.body}>
              <View style={styles.hero}>
                {product.image ? (
                  <Image source={{ uri: product.image }} style={styles.image} contentFit="contain" />
                ) : (
                  <Ionicons name="cube-outline" size={48} color={shopColor.muted} />
                )}
              </View>
              <View style={styles.titleRow}>
                <Text style={styles.name} maxFontSizeMultiplier={1.2}>
                  {product.name}
                </Text>
                <View
                  style={[
                    styles.badge,
                    product.availability === 'out' && styles.badgeOut,
                    product.availability === 'few' && styles.badgeFew,
                  ]}
                >
                  <Text style={styles.badgeText} maxFontSizeMultiplier={1.1}>
                    {t(
                      product.availability === 'out'
                        ? 'availability.out'
                        : product.availability === 'few'
                          ? 'availability.few'
                          : 'availability.available'
                    )}
                  </Text>
                </View>
              </View>
              <Text style={styles.price}>{formatRwf(product.price)}</Text>
              <Text style={styles.unit}>
                {t('product.unitHint', { unit: product.sellingUnitLabel })}
              </Text>
              {description ? (
                <View style={styles.descBlock}>
                  <Text style={styles.descTitle}>{t('product.description')}</Text>
                  <Text style={styles.desc} numberOfLines={more ? undefined : 3}>
                    {description}
                  </Text>
                  {description.length > 120 ? (
                    <Pressable onPress={() => setMore((v) => !v)}>
                      <Text style={styles.more}>
                        {more ? t('product.showLess') : t('product.showMore')}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}
        </ScreenState>
      </ShopScreen>

      {product ? (
        <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.stepper}>
            <Pressable
              onPress={() => setQty((n) => Math.max(1, n - 1))}
              accessibilityRole="button"
              accessibilityLabel={t('cart.decrease', { name: product.name })}
              style={styles.stepBtn}
            >
              <Ionicons name="remove" size={18} color={shopColor.text} />
            </Pressable>
            <Text style={styles.qty}>{qty}</Text>
            <Pressable
              onPress={() => setQty((n) => clampCartQuantity(n + 1, maxQuantity) || n)}
              disabled={!canIncrease}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canIncrease }}
              accessibilityLabel={t('cart.increase', { name: product.name })}
              style={[styles.stepBtn, !canIncrease && styles.stepOff]}
            >
              <Ionicons name="add" size={18} color={canIncrease ? shopColor.text : shopColor.muted} />
            </Pressable>
          </View>
          <Pressable
            onPress={() => addProduct(product, qty)}
            disabled={!available}
            accessibilityRole="button"
            accessibilityLabel={
              available ? t('cart.addNamed', { name: product.name }) : t('cart.outNamed', { name: product.name })
            }
            style={({ pressed }) => [
              styles.add,
              !available && styles.addOff,
              pressed && available && styles.addPressed,
            ]}
          >
            <Ionicons name="bag-outline" size={18} color={shopColor.white} />
            <Text style={styles.addLabel}>
              {available ? t('catalogue.add') : t('catalogue.unavailable')}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: shopColor.bg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topRight: { flexDirection: 'row' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  body: { gap: 10, paddingBottom: 88 },
  hero: {
    height: 260,
    borderRadius: shopRadius.lg,
    backgroundColor: shopColor.tile,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  name: { flex: 1, fontFamily: font.bold, fontSize: 24, color: shopColor.text, lineHeight: 30 },
  badge: {
    backgroundColor: shopColor.greenSoft,
    borderRadius: shopRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeFew: { backgroundColor: '#FEF3C7' },
  badgeOut: { backgroundColor: '#FEE2E2' },
  badgeText: { fontFamily: font.semibold, fontSize: 12, color: shopColor.green },
  price: { fontFamily: font.bold, fontSize: 26, color: shopColor.green },
  unit: { fontFamily: font.regular, fontSize: 13, color: shopColor.muted },
  descBlock: { gap: 6, marginTop: 8 },
  descTitle: { fontFamily: font.bold, fontSize: 16, color: shopColor.text },
  desc: { fontFamily: font.regular, fontSize: 14, lineHeight: 21, color: shopColor.textSecondary },
  more: { fontFamily: font.semibold, fontSize: 14, color: shopColor.green },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: shopColor.white,
    borderTopWidth: 1,
    borderTopColor: shopColor.border,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: shopColor.tile,
    borderRadius: shopRadius.pill,
    minHeight: 48,
    paddingHorizontal: 6,
  },
  stepBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepOff: { opacity: 0.4 },
  qty: { minWidth: 28, textAlign: 'center', fontFamily: font.bold, fontSize: 16, color: shopColor.text },
  add: {
    flex: 1,
    minHeight: 48,
    borderRadius: shopRadius.pill,
    backgroundColor: shopColor.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addOff: { backgroundColor: '#D1D5DB' },
  addPressed: { backgroundColor: shopColor.greenPressed },
  addLabel: { fontFamily: font.semibold, fontSize: 16, color: shopColor.white },
})
