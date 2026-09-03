import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import type { PublicAvailability, PublicCatalogueItem } from '@/src/api/public-types'
import { formatRwf } from '@/src/format'
import type { ShopUiKey } from '@/src/i18n/messages/en'
import { useShopText } from '@/src/i18n/locale-store'

const AVAILABILITY_KEY: Record<PublicAvailability, ShopUiKey> = {
  available: 'availability.available',
  few: 'availability.few',
  out: 'availability.out',
}
import { colors, control, radius, space, type } from '@/src/theme'

export function ProductCard({
  product,
  onOpen,
  onAdd,
}: {
  product: PublicCatalogueItem
  onOpen: () => void
  onAdd: () => void
}) {
  const t = useShopText()
  const available = product.inStock && product.availability !== 'out'

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={product.name}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.thumb}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" />
        ) : (
          <Ionicons
            name="cube-outline"
            size={22}
            color={colors.textMuted}
            importantForAccessibility="no"
          />
        )}
      </View>
      <View style={styles.body}>
        <Text style={type.productName} numberOfLines={2} maxFontSizeMultiplier={1.3}>
          {product.name}
        </Text>
        <Text style={type.metadata} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {product.sellingUnitLabel}
        </Text>
        <View style={styles.priceRow}>
          <Text style={type.price} maxFontSizeMultiplier={1.3}>
            {formatRwf(product.price)}
          </Text>
          {product.listPrice ? (
            <Text style={styles.list} maxFontSizeMultiplier={1.3}>
              {formatRwf(product.listPrice)}
            </Text>
          ) : null}
        </View>
        <Text
          style={[
            type.status,
            product.availability === 'out' && styles.out,
            product.availability === 'few' && styles.few,
          ]}
          maxFontSizeMultiplier={1.3}
        >
          {t(AVAILABILITY_KEY[product.availability])}
        </Text>
      </View>
      <Pressable
        onPress={onAdd}
        disabled={!available}
        accessibilityRole="button"
        accessibilityLabel={available ? t('cart.addNamed', { name: product.name }) : t('cart.outNamed', { name: product.name })}
        accessibilityState={{ disabled: !available }}
        style={({ pressed }) => [
          styles.add,
          !available && styles.addOff,
          pressed && available && styles.addPressed,
        ]}
      >
        <Text style={[styles.addLabel, !available && styles.addLabelOff]} maxFontSizeMultiplier={1.2}>
          {available ? t('catalogue.add') : t('catalogue.unavailable')}
        </Text>
      </Pressable>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s12,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    minHeight: control.productRow,
  },
  pressed: { backgroundColor: colors.background },
  thumb: {
    width: control.thumb,
    height: control.thumb,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: control.thumb, height: control.thumb },
  body: { flex: 1, minWidth: 0, gap: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  list: { ...type.metadata, textDecorationLine: 'line-through' },
  few: { color: colors.warning },
  out: { color: colors.danger },
  add: {
    minWidth: 72,
    minHeight: control.height,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    flexShrink: 0,
  },
  addOff: { backgroundColor: colors.disabledFill },
  addPressed: { backgroundColor: colors.primaryPressed },
  addLabel: { ...type.buttonSmall, color: colors.textOnPrimary, textAlign: 'center' },
  addLabelOff: { color: colors.disabledText },
})
