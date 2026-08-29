import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import type { PublicCatalogueItem } from '@/src/api/public-types'
import { formatRwf } from '@/src/format'
import { useFavorites } from '@/src/features/shop/favorites-store'
import { shopColor, shopRadius, shopSpace } from '@/src/features/shop/shop-theme'
import { useShopText } from '@/src/i18n/locale-store'
import { font } from '@/src/theme'

export function ShopProductCard({
  product,
  compact,
  onOpen,
  onAdd,
}: {
  product: PublicCatalogueItem
  compact?: boolean
  onOpen: () => void
  onAdd: () => void
}) {
  const t = useShopText()
  const saved = useFavorites((s) => s.slugs.includes(product.slug))
  const toggle = useFavorites((s) => s.toggle)
  const available = product.inStock && product.availability !== 'out'

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={product.name}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.imageWrap, compact && styles.imageWrapCompact]}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} contentFit="contain" />
        ) : (
          <Ionicons name="cube-outline" size={compact ? 22 : 28} color={shopColor.muted} />
        )}
        <Pressable
          onPress={() => toggle(product.slug)}
          accessibilityRole="button"
          accessibilityLabel={saved ? t('favourite.remove', { name: product.name }) : t('favourite.add', { name: product.name })}
          hitSlop={8}
          style={styles.heart}
        >
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={16}
            color={saved ? shopColor.danger : shopColor.muted}
          />
        </Pressable>
      </View>
      <Text style={styles.name} numberOfLines={2} maxFontSizeMultiplier={1.25}>
        {product.name}
      </Text>
      <Text style={styles.price} maxFontSizeMultiplier={1.2}>
        {formatRwf(product.price)}
      </Text>
      <View style={styles.foot}>
        <Text style={styles.unit} numberOfLines={1} maxFontSizeMultiplier={1.2}>
          {product.sellingUnitLabel}
        </Text>
        <Pressable
          onPress={onAdd}
          disabled={!available}
          accessibilityRole="button"
          accessibilityLabel={
            available ? t('cart.addNamed', { name: product.name }) : t('cart.outNamed', { name: product.name })
          }
          accessibilityState={{ disabled: !available }}
          style={({ pressed }) => [
            styles.add,
            !available && styles.addOff,
            pressed && available && styles.addPressed,
          ]}
        >
          <Ionicons name="add" size={18} color={shopColor.white} />
        </Pressable>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { flex: 1, gap: 6 },
  pressed: { opacity: 0.92 },
  imageWrap: {
    height: 132,
    borderRadius: shopRadius.md,
    backgroundColor: shopColor.tile,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageWrapCompact: { height: 96 },
  image: { width: '100%', height: '100%' },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: shopColor.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: font.semibold,
    fontSize: 13,
    lineHeight: 17,
    color: shopColor.text,
    minHeight: 34,
  },
  price: {
    fontFamily: font.bold,
    fontSize: 14,
    color: shopColor.green,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: shopSpace.sm,
  },
  unit: {
    fontFamily: font.regular,
    fontSize: 11,
    color: shopColor.muted,
    flex: 1,
  },
  add: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: shopColor.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOff: { backgroundColor: '#D1D5DB' },
  addPressed: { backgroundColor: shopColor.greenPressed },
})
