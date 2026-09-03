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
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radius, space, type } from '@/src/theme'

export function Screen({
  children,
  refreshing,
  onRefresh,
  safeTop = true,
}: {
  children: ReactNode
  refreshing?: boolean
  onRefresh?: () => void
  safeTop?: boolean
}) {
  const insets = useSafeAreaInsets()
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: space.md + (safeTop ? insets.top : 0) },
      ]}
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
  loadingLabel,
  error,
  errorTitle,
  empty,
  emptyTitle,
  emptyBody,
  onRetry,
  retryLabel,
  fill,
  children,
}: {
  loading?: boolean
  loadingLabel?: string
  error?: string | null
  errorTitle?: string
  empty?: boolean
  emptyTitle?: string
  emptyBody?: string
  onRetry?: () => void
  retryLabel?: string
  fill?: boolean
  children: ReactNode
}) {
  const loadingText = loadingLabel || 'Loading'
  const retryText = retryLabel || 'Try again'
  if (loading) {
    return (
      <View
        style={[styles.center, fill && styles.fill]}
        accessibilityRole="progressbar"
        accessibilityLabel={loadingText}
      >
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingLabel} maxFontSizeMultiplier={1.3}>
          {loadingText}
        </Text>
      </View>
    )
  }
  if (error) {
    return (
      <View style={[styles.banner, fill && styles.fillCenter]}>
        <Ionicons
          name="alert-circle-outline"
          size={22}
          color={colors.danger}
          importantForAccessibility="no"
        />
        {errorTitle ? (
          <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.3}>
            {errorTitle}
          </Text>
        ) : null}
        <Text style={styles.error} maxFontSizeMultiplier={1.4}>
          {error}
        </Text>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel={retryText}
            style={({ pressed }) => [styles.retryHit, pressed && styles.retryPressed]}
          >
            <Text style={styles.retry}>{retryText}</Text>
          </Pressable>
        ) : null}
      </View>
    )
  }
  if (empty) {
    return (
      <View style={[styles.center, fill && styles.fill]}>
        <Ionicons
          name="file-tray-outline"
          size={28}
          color={colors.textMuted}
          importantForAccessibility="no"
        />
        <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.3}>
          {emptyTitle || 'Nothing here yet'}
        </Text>
        <Text style={styles.emptyBody} maxFontSizeMultiplier={1.4}>
          {emptyBody || 'Nothing to show right now.'}
        </Text>
      </View>
    )
  }
  return <>{children}</>
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.md, paddingBottom: 96, gap: space.md },
  center: { paddingVertical: 48, alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg },
  fill: { flex: 1, justifyContent: 'center' },
  fillCenter: { flex: 1, justifyContent: 'center' },
  loadingLabel: { ...type.helper, color: colors.textSecondary },
  banner: {
    backgroundColor: colors.dangerSurface,
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: space.sm,
  },
  error: type.error,
  retry: { ...type.sectionTitle, color: colors.primary },
  retryHit: { minHeight: 48, justifyContent: 'center' },
  retryPressed: { opacity: 0.7 },
  emptyTitle: { ...type.sectionTitle, textAlign: 'center' },
  emptyBody: { ...type.helper, textAlign: 'center', maxWidth: 280 },
})
