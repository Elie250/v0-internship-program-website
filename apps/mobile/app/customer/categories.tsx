import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { usePublicCatalogue } from '@/src/features/shop/hooks'
import { useShopText } from '@/src/i18n/locale-store'
import { Screen, ScreenState } from '@/src/ui/Screen'
import { colors, control, space, type } from '@/src/theme'

export default function CustomerCategories() {
  const router = useRouter()
  const t = useShopText()
  const query = usePublicCatalogue()

  return (
    <Screen refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Text style={type.kicker}>{t('brand.short')}</Text>
      <Text style={type.screenTitle}>{t('nav.categories')}</Text>
      <ScreenState
        loading={query.isLoading && !query.data}
        error={query.error ? t('catalogue.error') : null}
        empty={(query.data?.categories.length ?? 0) === 0}
        emptyTitle={t('catalogue.empty')}
        onRetry={() => void query.refetch()}
      >
        <View style={styles.list}>
          {(query.data?.categories ?? []).map((category, index, all) => (
            <Pressable
              key={category.slug}
              onPress={() =>
                router.push(
                  `/customer/search?category=${encodeURIComponent(category.slug)}` as never
                )
              }
              accessibilityRole="button"
              accessibilityLabel={category.name}
              style={({ pressed }) => [
                styles.row,
                index < all.length - 1 && styles.rowLine,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.label}>{category.name}</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
                importantForAccessibility="no"
              />
            </Pressable>
          ))}
        </View>
      </ScreenState>
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    minHeight: control.height,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.s12,
  },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  pressed: { backgroundColor: colors.background },
  label: { ...type.productName, flex: 1 },
})
