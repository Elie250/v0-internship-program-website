import { View, StyleSheet, Text } from 'react-native'
import { useSessionStore } from '@/src/auth/session-store'
import { useDashboardQuery, usePendingMomoCount } from '@/src/features/commerce'
import { hasPermission, PERMISSIONS } from '@/src/permissions'
import { formatRwf } from '@/src/format'
import { Card, Metric } from '@/src/ui/Card'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { space, type } from '@/src/theme'

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
      <Card>
        <Metric label="Signed in" value={name || 'Staff'} hint={user?.role.replace(/_/g, ' ')} />
      </Card>

      <ScreenState
        loading={canDashboard && dashboard.isLoading}
        error={dashboard.error ? dashboard.error.message : null}
        onRetry={canDashboard ? () => void dashboard.refetch() : undefined}
      >
        <View style={styles.grid}>
          <View style={styles.cell}>
            <Card>
              <Metric
                label="Today's sales"
                value={canDashboard && dashboard.data ? formatRwf(dashboard.data.todaySales) : '—'}
                hint={dashboard.data?.businessDate}
              />
            </Card>
          </View>
          <View style={styles.cell}>
            <Card>
              <Metric
                label="Pending orders"
                value={canDashboard && dashboard.data ? String(dashboard.data.pendingOrders) : '—'}
              />
            </Card>
          </View>
          <View style={styles.cell}>
            <Card>
              <Metric
                label="Pending MoMo"
                value={
                  canOrders && momo.data != null && !momo.error ? String(momo.data) : '—'
                }
                hint={
                  !canOrders
                    ? 'Orders permission required'
                    : momo.error
                      ? 'Unable to load this metric'
                      : 'Online payments awaiting confirmation'
                }
              />
            </Card>
          </View>
          <View style={styles.cell}>
            <Card>
              <Metric
                label="Low stock"
                value={canDashboard && dashboard.data ? String(dashboard.data.lowStockItems) : '—'}
              />
            </Card>
          </View>
        </View>
      </ScreenState>
    </Screen>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cell: { width: '48%', flexGrow: 1 },
})
