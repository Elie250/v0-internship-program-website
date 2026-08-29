import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  shopCartDisplayTotal,
  useShopCart,
} from '@/src/features/shop/cart-store'
import { formatRwf } from '@/src/format'
import { useShopText } from '@/src/i18n/locale-store'
import { QtyStepper } from '@/src/ui/QtyStepper'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { colors, space, type } from '@/src/theme'

export default function CustomerCart() {
  const router = useRouter()
  const t = useShopText()
  const lines = useShopCart((s) => s.lines)
  const setQuantity = useShopCart((s) => s.setQuantity)
  const remove = useShopCart((s) => s.remove)
  const total = shopCartDisplayTotal(lines)

  return (
    <Screen>
      <Text style={type.kicker}>{t('brand.short')}</Text>
      <Text style={type.screenTitle}>{t('cart.title')}</Text>
      <ScreenState empty={lines.length === 0} emptyTitle={t('cart.empty')} emptyBody={t('cart.continue')}>
        <View style={styles.list}>
          {lines.map((line) => (
            <View key={line.slug} style={styles.row}>
              <Text style={type.productName} numberOfLines={2} maxFontSizeMultiplier={1.3}>
                {line.name}
              </Text>
              <Text style={type.sku} maxFontSizeMultiplier={1.3}>
                {t('cart.line', { unit: line.sellingUnitLabel, n: line.quantity })}
              </Text>
              <View style={styles.bottom}>
                <QtyStepper
                  value={line.quantity}
                  min={1}
                  onDecrease={() => {
                    if (line.quantity <= 1) return
                    setQuantity(line.slug, line.quantity - 1)
                  }}
                  onIncrease={() => setQuantity(line.slug, line.quantity + 1)}
                  decreaseLabel={t('cart.decrease', { name: line.name })}
                  increaseLabel={t('cart.increase', { name: line.name })}
                />
                <Text style={type.lineTotal} maxFontSizeMultiplier={1.3}>
                  {formatRwf(line.displayPrice * line.quantity)}
                </Text>
              </View>
              <Pressable
                onPress={() => remove(line.slug)}
                accessibilityRole="button"
                accessibilityLabel={`${t('cart.remove')} ${line.name}`}
                style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
              >
                <Text style={styles.removeLabel}>{t('cart.remove')}</Text>
              </Pressable>
            </View>
          ))}
        </View>
        <View style={styles.totalRow}>
          <Text style={type.sectionTitle}>{t('common.price')}</Text>
          <Text style={type.checkoutTotal}>{formatRwf(total)}</Text>
        </View>
        <Text style={type.helper}>{t('cart.checkoutSoon')}</Text>
        <Pressable
          onPress={() => router.push('/customer' as never)}
          accessibilityRole="button"
          accessibilityLabel={t('cart.continue')}
          style={({ pressed }) => [styles.continue, pressed && styles.pressed]}
        >
          <Text style={styles.continueLabel}>{t('cart.continue')}</Text>
        </Pressable>
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
  row: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remove: { minHeight: 48, justifyContent: 'center' },
  removeLabel: { ...type.buttonSmall, color: colors.danger },
  pressed: { opacity: 0.7 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  continue: { minHeight: 48, justifyContent: 'center' },
  continueLabel: { ...type.sectionTitle, color: colors.primary },
})
