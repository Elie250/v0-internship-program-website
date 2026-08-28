import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Redirect, useRouter } from 'expo-router'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { z } from 'zod'
import { ApiError } from '@/src/api/client'
import { useSessionStore } from '@/src/auth/session-store'
import { PrimaryButton } from '@/src/ui/Button'
import { colors, space } from '@/src/theme'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormValues = z.infer<typeof schema>

export default function LoginScreen() {
  const router = useRouter()
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
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
      <View style={styles.hero}>
        <Text style={styles.kicker}>Energy & Logics</Text>
        <Text style={styles.title}>Nyanza Shop Staff</Text>
        <Text style={styles.sub}>Sign in with your shop staff account.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <Controller
          control={form.control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              style={styles.input}
              placeholder="you@energyandlogics.com"
              placeholderTextColor={colors.muted}
            />
          )}
        />
        {form.formState.errors.email ? (
          <Text style={styles.error}>{form.formState.errors.email.message}</Text>
        ) : null}

        <Text style={styles.label}>Password</Text>
        <Controller
          control={form.control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              secureTextEntry
              autoComplete="password"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.muted}
            />
          )}
        />
        {form.formState.errors.password ? (
          <Text style={styles.error}>{form.formState.errors.password.message}</Text>
        ) : null}

        {form.formState.errors.root ? (
          <Text style={styles.error}>{form.formState.errors.root.message}</Text>
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
                error instanceof ApiError ? error.message : 'Unable to sign in. Check your email and password.'
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
  wrap: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: space.lg, justifyContent: 'center' },
  hero: { marginBottom: space.xl, gap: 6 },
  kicker: { color: colors.amber, fontWeight: '800', letterSpacing: 0.6 },
  title: { fontSize: 28, fontWeight: '800', color: colors.navy },
  sub: { color: colors.muted, fontSize: 15 },
  form: { gap: 10 },
  label: { fontWeight: '700', color: colors.slate, marginTop: 8 },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: space.md,
    fontSize: 16,
    color: colors.navy,
  },
  error: { color: colors.red, fontSize: 13 },
})
