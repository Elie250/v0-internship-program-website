import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useSessionStore } from '@/src/auth/session-store'
import { useDashboardQuery, usePendingMomoCount } from '@/src/features/commerce'
import { hasPermission, PERMISSIONS } from '@/src/permissions'
import { formatRwf } from '@/src/format'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { colors, radius, space, type } from '@/src/theme'

export default function StaffDashboard() {
  const router = useRouter()
  const user = useSessionStore((s) => s.user)
  const canDashboard = hasPermission(user?.permissions, [
    PERMISSIONS.SHOP_SALES_VIEW,
    PERMISSIONS.SHOP_ORDERS_VIEW,
  ])
  const canOrders = hasPermission(user?.permissions, PERMISSIONS.SHOP_ORDERS_VIEW)
  const canInventory = hasPermission(user?.permissions, PERMISSIONS.SHOP_STOCK_VIEW)
  const dashboard = useDashboardQuery(canDashboard)
  const momo = usePendingMomoCount(canOrders)

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email
  const todaySales = canDashboard && dashboard.data ? formatRwf(dashboard.data.todaySales) : '—'
  const pendingOrders = canDashboard && dashboard.data ? dashboard.data.pendingOrders : null
  const pendingMomo = canOrders && momo.data != null && !momo.error ? momo.data : null
  const lowStock = canDashboard && dashboard.data ? dashboard.data.lowStockItems : null

  return (
    <Screen
      refreshing={dashboard.isRefetching}
      onRefresh={() => {
        void dashboard.refetch()
        void momo.refetch()
      }}
    >
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/energy-logics-company-mark.png')}
          style={styles.mark}
          contentFit="contain"
          accessibilityLabel="Energy & Logics"
        />
        <Text style={type.kicker}>Energy & Logics</Text>
      </View>
      <Text style={type.screenTitle}>Today</Text>
      <Text style={type.helper} numberOfLines={1}>
        {name} · {user?.role.replace(/_/g, ' ')}
      </Text>

      <ScreenState
        loading={canDashboard && dashboard.isLoading}
        error={dashboard.error ? dashboard.error.message : null}
        errorTitle="Couldn't load dashboard"
        onRetry={canDashboard ? () => void dashboard.refetch() : undefined}
      >
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Today's sales</Text>
          <Text style={type.metric} maxFontSizeMultiplier={1.3}>
            {todaySales}
          </Text>
          {dashboard.data?.businessDate ? (
            <Text style={type.sku}>{dashboard.data.businessDate}</Text>
          ) : null}
        </View>

        <Text style={type.sectionTitle}>Action required</Text>
        <View style={styles.actions}>
          <ActionRow
            icon="alert-circle-outline"
            title="Pending MoMo"
            count={pendingMomo == null ? '—' : String(pendingMomo)}
            description={
              !canOrders
                ? 'Orders permission required'
                : momo.error
                  ? 'Unable to load this metric'
                  : 'payments waiting'
            }
            actionLabel="Review"
            urgent={Boolean(pendingMomo)}
            accessibilityLabel="Review pending MoMo payment"
            onPress={canOrders ? () => router.push('/staff/orders') : undefined}
          />
          <ActionRow
            icon="receipt-outline"
            title="Pending orders"
            count={pendingOrders == null ? '—' : String(pendingOrders)}
            description={
              pendingOrders == null
                ? canDashboard
                  ? 'Waiting for data'
                  : 'Sales permission required'
                : 'orders waiting'
            }
            actionLabel="Review"
            urgent={Boolean(pendingOrders)}
            accessibilityLabel="Review pending orders"
            onPress={canOrders ? () => router.push('/staff/orders') : undefined}
          />
          <ActionRow
            icon="cube-outline"
            title="Low stock"
            count={lowStock == null ? '—' : String(lowStock)}
            description={
              lowStock == null
                ? canDashboard
                  ? 'Waiting for data'
                  : 'Inventory permission required'
                : 'products need attention'
            }
            actionLabel="Inventory"
            urgent={Boolean(lowStock)}
            last
            accessibilityLabel="Check inventory"
            onPress={canInventory ? () => router.push('/staff/inventory') : undefined}
          />
        </View>
      </ScreenState>
    </Screen>
  )
}

function ActionRow({
  icon,
  title,
  count,
  description,
  actionLabel,
  urgent,
  last,
  accessibilityLabel,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  count: string
  description: string
  actionLabel: string
  urgent?: boolean
  last?: boolean
  accessibilityLabel: string
  onPress?: () => void
}) {
  const content = (
    <>
      <Ionicons
        name={icon}
        size={22}
        color={urgent ? colors.warning : colors.primary}
        importantForAccessibility="no"
      />
      <Text style={styles.count} maxFontSizeMultiplier={1.3}>
        {count}
      </Text>
      <View style={styles.actionCopy}>
        <Text style={styles.actionLabel} maxFontSizeMultiplier={1.3} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.actionHint} maxFontSizeMultiplier={1.3} numberOfLines={2}>
          {description}
        </Text>
      </View>
      {onPress ? (
        <Text style={styles.actionCta} maxFontSizeMultiplier={1.2}>
          {actionLabel}
        </Text>
      ) : null}
    </>
  )

  if (!onPress) {
    return <View style={[styles.action, last && styles.actionLast, urgent && styles.actionUrgent]}>{content}</View>
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.action,
        last && styles.actionLast,
        urgent && styles.actionUrgent,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  mark: { width: 36, height: 36 },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.xs,
  },
  heroLabel: type.helper,
  actions: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  action: {
    minHeight: 64,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  actionLast: { borderBottomWidth: 0 },
  actionUrgent: { backgroundColor: colors.warningSurface },
  pressed: { backgroundColor: colors.background },
  count: { ...type.priceLarge, minWidth: 28, textAlign: 'right' as const },
  actionCopy: { flex: 1, minWidth: 0, gap: 2 },
  actionLabel: type.bodyMedium,
  actionHint: type.helper,
  actionCta: { ...type.buttonSmall, color: colors.primary, flexShrink: 0 },
})
