import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useLocaleStore, useShopText, type ShopLocale } from '@/src/i18n/locale-store'
import { BackLink } from '@/src/ui/BackLink'
import { Screen } from '@/src/ui/Screen'
import { colors, control, space, type } from '@/src/theme'

const OPTIONS: ShopLocale[] = ['en', 'rw']

export default function CustomerLanguage() {
  const router = useRouter()
  const t = useShopText()
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)

  return (
    <Screen>
      <BackLink
        label={t('product.back')}
        accessibilityLabel={t('product.back')}
        onPress={() => router.back()}
      />
      <Text style={type.kicker}>{t('brand.short')}</Text>
      <Text style={type.screenTitle}>{t('language.title')}</Text>
      <Text style={type.helper}>{t('language.hint')}</Text>
      <View style={styles.list}>
        {OPTIONS.map((code, index) => {
          const selected = locale === code
          return (
            <Pressable
              key={code}
              onPress={() => void setLocale(code)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={t(code === 'en' ? 'language.en' : 'language.rw')}
              style={({ pressed }) => [
                styles.row,
                index < OPTIONS.length - 1 && styles.rowLine,
                selected && styles.rowOn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.label}>{t(code === 'en' ? 'language.en' : 'language.rw')}</Text>
              {selected ? (
                <Ionicons
                  name="checkmark"
                  size={18}
                  color={colors.primary}
                  importantForAccessibility="no"
                />
              ) : null}
            </Pressable>
          )
        })}
      </View>
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
    justifyContent: 'space-between',
  },
  rowOn: { backgroundColor: colors.primarySubtle },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  pressed: { opacity: 0.88 },
  label: type.productName,
})
