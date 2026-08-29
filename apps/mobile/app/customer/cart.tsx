import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { canIncreaseCartQuantity } from '@/src/features/shop/cart-rules'
import { shopCartDisplayTotal, useShopCart } from '@/src/features/shop/cart-store'
import { useSyncCartStock } from '@/src/features/shop/hooks'
import { ShopHeader } from '@/src/features/shop/ShopHeader'
import { ShopScreen } from '@/src/features/shop/ShopScreen'
import { shopColor, shopRadius } from '@/src/features/shop/shop-theme'
import { formatRwf } from '@/src/format'
import { useShopText } from '@/src/i18n/locale-store'
import { ScreenState } from '@/src/ui/Screen'
import { font } from '@/src/theme'

export default function CustomerCart() {
  const router = useRouter()
  const t = useShopText()
  useSyncCartStock()
  const lines = useShopCart((s) => s.lines)
  const setQuantity = useShopCart((s) => s.setQuantity)
  const remove = useShopCart((s) => s.remove)
  const total = shopCartDisplayTotal(lines)

  return (
    <ShopScreen>
      <ShopHeader title={t('cart.title')} showSearch={false} />
      <ScreenState empty={lines.length === 0} emptyTitle={t('cart.empty')} emptyBody={t('cart.continue')}>
        <View style={styles.list}>
          {lines.map((line) => {
            const canIncrease = canIncreaseCartQuantity(line.quantity, line.maxQuantity)
            return (
              <View key={line.slug} style={styles.row}>
                <View style={styles.thumb}>
                  {line.image ? (
                    <Image source={{ uri: line.image }} style={styles.image} contentFit="contain" />
                  ) : (
                    <Ionicons name="cube-outline" size={22} color={shopColor.muted} />
                  )}
                </View>
                <View style={styles.body}>
                  <Text style={styles.name} numberOfLines={2} maxFontSizeMultiplier={1.25}>
                    {line.name}
                  </Text>
                  <Text style={styles.unit} maxFontSizeMultiplier={1.2}>
                    {t('cart.line', { unit: line.sellingUnitLabel, n: line.quantity })}
                  </Text>
                  <Text style={styles.price}>{formatRwf(line.displayPrice * line.quantity)}</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() => setQuantity(line.slug, line.quantity - 1)}
                      accessibilityRole="button"
                      accessibilityLabel={t('cart.decrease', { name: line.name })}
                      style={styles.stepBtn}
                    >
                      <Ionicons name="remove" size={16} color={shopColor.text} />
                    </Pressable>
                    <Text style={styles.qty}>{line.quantity}</Text>
                    <Pressable
                      onPress={() => setQuantity(line.slug, line.quantity + 1)}
                      disabled={!canIncrease}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !canIncrease }}
                      accessibilityLabel={t('cart.increase', { name: line.name })}
                      style={[styles.stepBtn, !canIncrease && styles.stepOff]}
                    >
                      <Ionicons
                        name="add"
                        size={16}
                        color={canIncrease ? shopColor.text : shopColor.muted}
                      />
                    </Pressable>
                  </View>
                </View>
                <Pressable
                  onPress={() => remove(line.slug)}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('cart.remove')} ${line.name}`}
                  style={styles.remove}
                >
                  <Ionicons name="trash-outline" size={18} color={shopColor.danger} />
                </Pressable>
              </View>
            )
          })}
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('common.total')}</Text>
          <Text style={styles.total}>{formatRwf(total)}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/customer/checkout' as never)}
          accessibilityRole="button"
          accessibilityLabel={t('cart.checkout')}
          style={({ pressed }) => [styles.checkout, pressed && styles.pressed]}
        >
          <Text style={styles.checkoutLabel}>{t('cart.checkout')}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/customer' as never)}
          accessibilityRole="button"
          accessibilityLabel={t('cart.continue')}
          style={({ pressed }) => [styles.continue, pressed && styles.pressed]}
        >
          <Text style={styles.continueLabel}>{t('cart.continue')}</Text>
        </Pressable>
      </ScreenState>
    </ShopScreen>
  )
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: shopColor.tile,
    borderRadius: shopRadius.md,
    padding: 12,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: shopRadius.sm,
    backgroundColor: shopColor.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  body: { flex: 1, gap: 4 },
  name: { fontFamily: font.semibold, fontSize: 15, color: shopColor.text },
  unit: { fontFamily: font.regular, fontSize: 12, color: shopColor.muted },
  price: { fontFamily: font.bold, fontSize: 16, color: shopColor.green },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: shopColor.white,
    borderRadius: shopRadius.pill,
  },
  stepBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepOff: { opacity: 0.4 },
  qty: { minWidth: 22, textAlign: 'center', fontFamily: font.bold, fontSize: 14 },
  remove: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: font.semibold, fontSize: 16, color: shopColor.text },
  total: { fontFamily: font.bold, fontSize: 24, color: shopColor.green },
  checkout: {
    minHeight: 48,
    borderRadius: shopRadius.pill,
    backgroundColor: shopColor.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutLabel: { fontFamily: font.semibold, fontSize: 16, color: shopColor.white },
  continue: {
    minHeight: 48,
    borderRadius: shopRadius.pill,
    backgroundColor: shopColor.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueLabel: { fontFamily: font.semibold, fontSize: 16, color: shopColor.text },
  pressed: { opacity: 0.88 },
})
