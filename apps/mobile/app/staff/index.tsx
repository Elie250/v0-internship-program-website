import { View, StyleSheet } from 'react-native'
import { useSessionStore } from '@/src/auth/session-store'
import { useDashboardQuery, usePendingMomoCount } from '@/src/features/commerce'
import { hasPermission, PERMISSIONS } from '@/src/permissions'
import { formatRwf } from '@/src/format'
import { Card, Metric } from '@/src/ui/Card'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { colors, space } from '@/src/theme'

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
      <Card>
        <Metric label="Nyanza Shop" value={name || 'Staff'} hint={user?.role.replace(/_/g, ' ')} />
      </Card>

      <ScreenState
        loading={canDashboard && dashboard.isLoading}
        error={dashboard.error ? dashboard.error.message : null}
        onRetry={canDashboard ? () => void dashboard.refetch() : undefined}
      >
        <View style={styles.grid}>
          <Card>
            <Metric
              label="Today's sales"
              value={canDashboard && dashboard.data ? formatRwf(dashboard.data.todaySales) : '—'}
              hint={dashboard.data?.businessDate}
            />
          </Card>
          <Card>
            <Metric
              label="Pending orders"
              value={canDashboard && dashboard.data ? String(dashboard.data.pendingOrders) : '—'}
            />
          </Card>
          <Card>
            <Metric
              label="Pending MoMo reviews"
              value={
                canOrders && momo.data != null && !momo.error ? String(momo.data) : '—'
              }
              hint={
                !canOrders
                  ? 'Orders permission required'
                  : momo.error
                    ? momo.error.message
                    : 'Online customer payments awaiting confirmation'
              }
            />
          </Card>
          <Card>
            <Metric
              label="Low stock"
              value={canDashboard && dashboard.data ? String(dashboard.data.lowStockItems) : '—'}
            />
          </Card>
        </View>
      </ScreenState>
    </Screen>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
})
