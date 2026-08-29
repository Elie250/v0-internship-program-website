import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Redirect, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { z } from 'zod'
import { ApiError } from '@/src/api/client'
import { useSessionStore } from '@/src/auth/session-store'
import { BackLink } from '@/src/ui/BackLink'
import { PrimaryButton } from '@/src/ui/Button'
import { Input } from '@/src/ui/Input'
import { colors, font, space, type } from '@/src/theme'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormValues = z.infer<typeof schema>

export default function LoginScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const token = useSessionStore((s) => s.token)
  const user = useSessionStore((s) => s.user)
  const hydrated = useSessionStore((s) => s.hydrated)
  const signIn = useSessionStore((s) => s.signIn)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (hydrated && token && user) router.replace('/staff')
  }, [hydrated, token, user, router])

  if (hydrated && token && user) return <Redirect href="/staff" />

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, space.sm) }]}>
        <BackLink
          label="Shop"
          accessibilityLabel="Back to shop"
          onPress={() => router.replace('/customer' as never)}
        />
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.mark} accessibilityLabel="Energy & Logics">
              <Image
                source={require('../assets/energy-logics-company-mark.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
            <View style={styles.brandCopy}>
              <Text style={styles.brand} accessibilityRole="header">
                <Text style={styles.brandEnergy}>Energy</Text>
                <Text style={styles.brandLogics}> & Logics</Text>
              </Text>
              <Text style={styles.slogan}>Engineering Sustainable Solutions</Text>
            </View>
          </View>
          <Text style={type.appTitle}>Staff POS</Text>
          <Text style={type.helper}>Sign in with your shop staff account.</Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={form.control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="you@energyandlogics.com"
                accessibilityLabel="Email"
                error={form.formState.errors.email?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                secureTextEntry
                autoComplete="password"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Password"
                accessibilityLabel="Password"
                error={form.formState.errors.password?.message}
              />
            )}
          />

          {form.formState.errors.root ? (
            <Text style={type.error}>{form.formState.errors.root.message}</Text>
          ) : null}

          <PrimaryButton
            label="Sign in"
            loading={form.formState.isSubmitting}
            onPress={form.handleSubmit(async (values) => {
              try {
                await signIn(values.email.trim(), values.password)
                router.replace('/staff')
              } catch (error) {
                const message =
                  error instanceof ApiError
                    ? error.message
                    : 'Unable to sign in. Check your email and password.'
                form.setError('root', { message })
              }
            })}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background },
  topBar: {
    paddingHorizontal: space.lg,
    paddingBottom: 0,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    justifyContent: 'center',
  },
  hero: { marginBottom: space.xl, gap: space.md, alignItems: 'flex-start' },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    width: '100%',
  },
  mark: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 112, height: 112 },
  brandCopy: { flex: 1, justifyContent: 'center', gap: 4 },
  brand: { color: colors.primary },
  brandEnergy: {
    fontFamily: font.bold,
    fontSize: 22,
    color: colors.primary,
  },
  brandLogics: {
    fontFamily: font.regular,
    fontSize: 22,
    fontStyle: 'italic',
    color: colors.primary,
  },
  slogan: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    color: colors.textMuted,
  },
  form: { gap: space.md },
})
