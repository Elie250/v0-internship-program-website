import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import type { StaffProduct } from '@/src/api/types'
import { firstProductImage } from '@/src/features/pos/product-image'
import { stockState } from '@/src/features/pos/stock'
import { previewUnitPrice } from '@/src/features/pos/pricing'
import { formatRwf } from '@/src/format'
import { StatusBadge } from '@/src/ui/StatusBadge'
import { colors, hitSlop, radius, space, type } from '@/src/theme'

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
          <Ionicons name="cube-outline" size={22} color={colors.muted} />
        )}
      </View>
      <View style={styles.body}>
        <Text style={type.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={type.meta} numberOfLines={1}>
          SKU: {product.sku || '—'}
        </Text>
        <Text style={type.meta} numberOfLines={1}>
          {product.sellingUnitLabel}
        </Text>
        <View style={styles.metaRow}>
          <Text style={type.price}>{formatRwf(unitPrice)}</Text>
          <StatusBadge label={stock.label} tone={stock.tone} />
        </View>
      </View>
      <Pressable
        onPress={onAdd}
        disabled={!stock.canSell}
        accessibilityRole="button"
        accessibilityLabel={`Add ${product.name}`}
        style={({ pressed }) => [
          styles.add,
          !stock.canSell && styles.addOff,
          pressed && stock.canSell && styles.pressed,
        ]}
      >
        <Text style={[styles.addLabel, !stock.canSell && styles.addLabelOff]}>+ Add</Text>
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
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.sm,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: 56, height: 56 },
  body: { flex: 1, gap: 2, minWidth: 0 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  add: {
    minWidth: 72,
    minHeight: hitSlop,
    borderRadius: radius.sm,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  addOff: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line },
  pressed: { opacity: 0.85 },
  addLabel: { color: colors.white, fontWeight: '700', fontSize: 14 },
  addLabelOff: { color: colors.muted },
})
