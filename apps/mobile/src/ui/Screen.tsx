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
import { colors, space } from '@/src/theme'

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
  children,
}: {
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyTitle?: string
  emptyBody?: string
  onRetry?: () => void
  children: ReactNode
}) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.navy} size="large" />
      </View>
    )
  }
  if (error) {
    return (
      <View style={styles.banner}>
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
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>{emptyTitle || 'Nothing here yet'}</Text>
        {emptyBody ? <Text style={styles.emptyBody}>{emptyBody}</Text> : null}
      </View>
    )
  }
  return <>{children}</>
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.md, paddingBottom: 40, gap: space.md },
  center: { paddingVertical: 48, alignItems: 'center', gap: 8 },
  banner: {
    backgroundColor: colors.redSoft,
    borderRadius: 12,
    padding: space.md,
  },
  error: { color: colors.red, fontSize: 15, lineHeight: 22 },
  retry: { color: colors.navy, fontWeight: '800', fontSize: 15 },
  retryHit: { minHeight: 44, justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.navy },
  emptyBody: { fontSize: 14, color: colors.muted, textAlign: 'center', maxWidth: 280 },
})
