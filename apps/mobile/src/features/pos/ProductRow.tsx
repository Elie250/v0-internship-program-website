import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import type { StaffProduct } from '@/src/api/types'
import { firstProductImage } from '@/src/features/pos/product-image'
import { stockState } from '@/src/features/pos/stock'
import { previewUnitPrice } from '@/src/features/pos/pricing'
import { formatRwf } from '@/src/format'
import { colors, control, radius, space, type } from '@/src/theme'

export function ProductRow({
  product,
  onAdd,
}: {
  product: StaffProduct
  onAdd: () => void
}) {
  const image = firstProductImage(product.images)
  const stock = stockState(product.stock, product.lowStockThreshold)
  const unitPrice = previewUnitPrice(product.price, product.discount)

  return (
    <View style={styles.row}>
      <View style={styles.thumb}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} contentFit="cover" />
        ) : (
          <Ionicons name="cube-outline" size={18} color={colors.muted} />
        )}
      </View>
      <View style={styles.body}>
        <Text style={type.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={type.sku} numberOfLines={1}>
          {product.sku || '—'} · {product.sellingUnitLabel}
        </Text>
        <View style={styles.priceRow}>
          <Text style={type.price}>{formatRwf(unitPrice)}</Text>
          <Text
            style={[
              type.status,
              stock.tone === 'green' && styles.stockOk,
              stock.tone === 'amber' && styles.stockLow,
              stock.tone === 'red' && styles.stockOut,
            ]}
          >
            {stock.label}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onAdd}
        disabled={!stock.canSell}
        accessibilityRole="button"
        accessibilityLabel={stock.canSell ? `Add ${product.name}` : `${product.name} is out of stock`}
        accessibilityState={{ disabled: !stock.canSell }}
        style={({ pressed }) => [
          styles.add,
          !stock.canSell && styles.addOff,
          pressed && stock.canSell && styles.pressed,
        ]}
      >
        <Text style={[styles.addLabel, !stock.canSell && styles.addLabelOff]}>
          {stock.canSell ? '+ Add' : 'Out'}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.card,
    paddingHorizontal: space.md,
    paddingVertical: 10,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: 44, height: 44 },
  body: { flex: 1, gap: 2, minWidth: 0 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  stockOk: { color: colors.green },
  stockLow: { color: colors.amber },
  stockOut: { color: colors.red },
  add: {
    minWidth: 64,
    minHeight: control.height,
    borderRadius: control.radius,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  addOff: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line },
  pressed: { opacity: 0.85 },
  addLabel: { ...type.button, fontSize: 14, color: colors.white },
  addLabelOff: { color: colors.muted },
})
