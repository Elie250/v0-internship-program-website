import { View, StyleSheet, Text } from 'react-native'
import { useSessionStore } from '@/src/auth/session-store'
import { useDashboardQuery, usePendingMomoCount } from '@/src/features/commerce'
import { hasPermission, PERMISSIONS } from '@/src/permissions'
import { formatRwf } from '@/src/format'
import { Metric } from '@/src/ui/Card'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { colors, radius, space, type } from '@/src/theme'

export default function StaffDashboard() {
  const user = useSessionStore((s) => s.user)
  const canDashboard = hasPermission(user?.permissions, [
    PERMISSIONS.SHOP_SALES_VIEW,
    PERMISSIONS.SHOP_ORDERS_VIEW,
  ])
  const canOrders = hasPermission(user?.permissions, PERMISSIONS.SHOP_ORDERS_VIEW)
  const dashboard = useDashboardQuery(canDashboard)
  const momo = usePendingMomoCount(canOrders)

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email

  return (
    <Screen
      refreshing={dashboard.isRefetching}
      onRefresh={() => {
        void dashboard.refetch()
        void momo.refetch()
      }}
    >
      <Text style={type.kicker}>Energy & Logics</Text>
      <Text style={type.screenTitle}>Today</Text>
      <Text style={type.meta} numberOfLines={1}>
        {name} · {user?.role.replace(/_/g, ' ')}
      </Text>

      <ScreenState
        loading={canDashboard && dashboard.isLoading}
        error={dashboard.error ? dashboard.error.message : null}
        onRetry={canDashboard ? () => void dashboard.refetch() : undefined}
      >
        <View style={styles.panel}>
          <View style={styles.cell}>
            <Metric
              label="Today's sales"
              value={canDashboard && dashboard.data ? formatRwf(dashboard.data.todaySales) : '—'}
              hint={dashboard.data?.businessDate}
            />
          </View>
          <View style={[styles.cell, styles.cellRight]}>
            <Metric
              label="Pending orders"
              value={canDashboard && dashboard.data ? String(dashboard.data.pendingOrders) : '—'}
            />
          </View>
          <View style={[styles.cell, styles.cellBottom]}>
            <Metric
              label="Pending MoMo"
              value={canOrders && momo.data != null && !momo.error ? String(momo.data) : '—'}
              hint={
                !canOrders
                  ? 'Orders permission required'
                  : momo.error
                    ? 'Unable to load this metric'
                    : 'Awaiting confirmation'
              }
            />
          </View>
          <View style={[styles.cell, styles.cellRight, styles.cellBottom]}>
            <Metric
              label="Low stock"
              value={canDashboard && dashboard.data ? String(dashboard.data.lowStockItems) : '—'}
            />
          </View>
        </View>
      </ScreenState>
    </Screen>
  )
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  cell: {
    width: '50%',
    padding: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  cellRight: { borderRightWidth: 0 },
  cellBottom: { borderBottomWidth: 0 },
})
