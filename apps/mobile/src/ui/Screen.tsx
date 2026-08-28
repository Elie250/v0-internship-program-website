import { ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { colors, space, type } from '@/src/theme'

export function Screen({
  children,
  refreshing,
  onRefresh,
}: {
  children: ReactNode
  refreshing?: boolean
  onRefresh?: () => void
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  )
}

export function ScreenState({
  loading,
  error,
  empty,
  emptyTitle,
  emptyBody,
  onRetry,
  fill,
  children,
}: {
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyTitle?: string
  emptyBody?: string
  onRetry?: () => void
  fill?: boolean
  children: ReactNode
}) {
  if (loading) {
    return (
      <View style={[styles.center, fill && styles.fill]}>
        <ActivityIndicator color={colors.navy} size="large" />
      </View>
    )
  }
  if (error) {
    return (
      <View style={[styles.banner, fill && styles.fill]}>
        <Text style={styles.error}>{error}</Text>
        {onRetry ? (
          <Pressable onPress={onRetry} style={styles.retryHit}>
            <Text style={styles.retry}>Try again</Text>
          </Pressable>
        ) : null}
      </View>
    )
  }
  if (empty) {
    return (
      <View style={[styles.center, fill && styles.fill]}>
        <Text style={styles.emptyTitle}>{emptyTitle || 'Nothing here yet'}</Text>
        <Text style={styles.emptyBody}>{emptyBody || 'Nothing to show right now.'}</Text>
      </View>
    )
  }
  return <>{children}</>
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, paddingBottom: 40, gap: space.md },
  center: { paddingVertical: 48, alignItems: 'center', gap: 8 },
  fill: { flex: 1, justifyContent: 'center' },
  banner: {
    backgroundColor: colors.redSoft,
    borderRadius: 12,
    padding: space.md,
  },
  error: { color: colors.red, fontSize: 15, lineHeight: 22 },
  retry: { ...type.heading },
  retryHit: { minHeight: 44, justifyContent: 'center' },
  emptyTitle: { ...type.heading, fontSize: 17 },
  emptyBody: { ...type.meta, textAlign: 'center', maxWidth: 280 },
})
