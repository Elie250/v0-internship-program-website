import { StyleSheet, Text, View } from 'react-native'
import type { PublicTrackedOrder } from '@/src/api/public-types'
import { shopColor, shopRadius } from '@/src/features/shop/shop-theme'
import { formatRwf, formatWhen } from '@/src/format'
import { useShopText } from '@/src/i18n/locale-store'
import type { ShopUiKey } from '@/src/i18n/messages/en'
import { font } from '@/src/theme'

function statusKey(status: PublicTrackedOrder['status']): ShopUiKey {
  return `status.${status}` as ShopUiKey
}

function paymentKey(status: PublicTrackedOrder['paymentStatus']): ShopUiKey {
  return `payment.${status}` as ShopUiKey
}

export function TrackedOrderCard({ order }: { order: PublicTrackedOrder }) {
  const t = useShopText()
  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>{t('common.order')}</Text>
      <Text style={styles.ref} selectable>
        {order.orderNumber}
      </Text>
      <Row label={t('common.total')} value={formatRwf(order.totalAmount)} emphasis />
      <Row label={t('order.status')} value={t(statusKey(order.status))} />
      <Row label={t('common.payment')} value={t(paymentKey(order.paymentStatus))} />
      <Row
        label={t('checkout.fulfillment')}
        value={order.fulfillmentType === 'delivery' ? t('checkout.delivery') : t('checkout.pickup')}
      />
      {order.deliveryAddress ? <Row label={t('checkout.address')} value={order.deliveryAddress} /> : null}
      {order.orderDate ? <Row label={t('order.date')} value={formatWhen(order.orderDate)} /> : null}
      <Text style={styles.itemsTitle}>{t('order.items')}</Text>
      {order.items.map((item, index) => (
        <View key={`${item.productName}-${index}`} style={styles.line}>
          <Text style={styles.lineName}>{item.productName}</Text>
          <Text style={styles.lineMeta}>
            {t('order.line', {
              unit: item.sellingUnitLabel || item.productName,
              n: item.quantity,
            })}
          </Text>
          <Text style={styles.linePrice}>{formatRwf(item.lineTotal)}</Text>
        </View>
      ))}
    </View>
  )
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, emphasis && styles.emphasis]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: shopColor.white,
    borderRadius: shopRadius.lg,
    borderWidth: 1,
    borderColor: shopColor.border,
    padding: 16,
    gap: 10,
  },
  kicker: { fontFamily: font.semibold, fontSize: 12, color: shopColor.muted, textTransform: 'uppercase' },
  ref: { fontFamily: font.bold, fontSize: 22, color: shopColor.text },
  row: { gap: 2 },
  label: { fontFamily: font.regular, fontSize: 13, color: shopColor.muted },
  value: { fontFamily: font.semibold, fontSize: 15, color: shopColor.text },
  emphasis: { fontFamily: font.bold, fontSize: 20, color: shopColor.green },
  itemsTitle: { fontFamily: font.bold, fontSize: 16, color: shopColor.text, marginTop: 6 },
  line: { gap: 2, paddingVertical: 6, borderTopWidth: 1, borderTopColor: shopColor.border },
  lineName: { fontFamily: font.semibold, fontSize: 14, color: shopColor.text },
  lineMeta: { fontFamily: font.regular, fontSize: 12, color: shopColor.muted },
  linePrice: { fontFamily: font.bold, fontSize: 14, color: shopColor.green },
})
