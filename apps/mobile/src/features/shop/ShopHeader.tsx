import { Image } from 'expo-image'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { shopCartItemCount, useShopCart } from '@/src/features/shop/cart-store'
import { shopColor } from '@/src/features/shop/shop-theme'
import { useShopText } from '@/src/i18n/locale-store'
import { font } from '@/src/theme'

const mark = require('../../../assets/energy-logics-company-mark.png')

export function ShopHeader({
  title,
  showSearch = true,
  onBack,
}: {
  title?: string
  showSearch?: boolean
  onBack?: () => void
}) {
  const router = useRouter()
  const t = useShopText()
  const cartCount = useShopCart((s) => shopCartItemCount(s.lines))

  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t('product.back')}
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={24} color={shopColor.text} />
        </Pressable>
      ) : (
        <Image source={mark} style={styles.mark} contentFit="contain" />
      )}
      <Text style={styles.title} numberOfLines={1} maxFontSizeMultiplier={1.2}>
        {title ?? t('brand.name')}
      </Text>
      <Pressable
        onPress={() => router.push('/customer/track' as never)}
        accessibilityRole="button"
        accessibilityLabel={t('nav.trackOrder')}
        style={styles.signInBtn}
      >
        <Text style={styles.signIn} maxFontSizeMultiplier={1.1}>
          {t('nav.trackOrder')}
        </Text>
      </Pressable>
      {showSearch ? (
        <Pressable
          onPress={() => router.push('/customer/search' as never)}
          accessibilityRole="button"
          accessibilityLabel={t('nav.search')}
          style={styles.iconBtn}
        >
          <Ionicons name="search-outline" size={22} color={shopColor.text} />
        </Pressable>
      ) : (
        <View style={styles.iconBtn} />
      )}
      <Pressable
        onPress={() => router.push('/customer/cart' as never)}
        accessibilityRole="button"
        accessibilityLabel={t('nav.cart')}
        style={styles.iconBtn}
      >
        <Ionicons name="bag-outline" size={22} color={shopColor.text} />
        {cartCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText} maxFontSizeMultiplier={1.1}>
              {cartCount > 9 ? '9+' : cartCount}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
  },
  mark: { width: 36, height: 36, borderRadius: 8 },
  title: {
    flex: 1,
    fontFamily: font.bold,
    fontSize: 16,
    color: shopColor.text,
  },
  signInBtn: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  signIn: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: shopColor.green,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: shopColor.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: shopColor.white,
    fontFamily: font.bold,
    fontSize: 9,
  },
})
