import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Image } from 'expo-image'
import { File, Paths } from 'expo-file-system'
import { Ionicons } from '@expo/vector-icons'
import { ApiError } from '@/src/api/client'
import { USER_MESSAGES } from '@/src/api/errors'
import { createPublicOrder, uploadPublicReceipt } from '@/src/api/public'
import {
  checkoutAttemptFingerprint,
  newOnlineIdempotencyKey,
} from '@/src/features/shop/checkout-idempotency'
import { checkoutFieldErrorKey, checkoutSubmitMessage } from '@/src/features/shop/checkout-error'
import {
  checkoutDetailsSchema,
  emptyCartCannotCheckout,
  hasMoMoProof,
  type CheckoutDetails,
} from '@/src/features/shop/checkout-schema'
import { shopCartDisplayTotal, useShopCart } from '@/src/features/shop/cart-store'
import { useSyncCartStock } from '@/src/features/shop/hooks'
import { ShopHeader } from '@/src/features/shop/ShopHeader'
import { ShopScreen } from '@/src/features/shop/ShopScreen'
import { shopColor, shopRadius } from '@/src/features/shop/shop-theme'
import { formatRwf } from '@/src/format'
import { useShopText } from '@/src/i18n/locale-store'
import type { ShopUiKey } from '@/src/i18n/messages/en'
import { font } from '@/src/theme'

type Step = 'details' | 'payment' | 'review'

export default function CustomerCheckout() {
  const router = useRouter()
  const t = useShopText()
  useSyncCartStock()
  const lines = useShopCart((s) => s.lines)
  const clearCart = useShopCart((s) => s.clear)
  const displayTotal = shopCartDisplayTotal(lines)
  const [step, setStep] = useState<Step>('details')
  const [receiptUri, setReceiptUri] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const attempt = useRef({ fingerprint: '', key: '' })

  const form = useForm<CheckoutDetails>({
    resolver: zodResolver(checkoutDetailsSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      fulfillmentType: 'pickup',
      deliveryAddress: '',
      notes: '',
    },
  })

  const fulfillmentType = form.watch('fulfillmentType')
  const empty = emptyCartCannotCheckout(lines.length)
  const proofOk = hasMoMoProof(receiptUrl, receiptNumber)

  const fieldError = (name: keyof CheckoutDetails): string | undefined => {
    const message = form.formState.errors[name]?.message
    return message ? t(checkoutFieldErrorKey(message)) : undefined
  }

  const pickReceipt = async () => {
    setFormError(null)
    try {
      const picked = await File.pickFileAsync(undefined, 'image/*')
      const file = unwrapPickedFile(picked)
      if (!file) return
      const local = copyReceiptForUpload(file)
      setReceiptUri(local.uri)
      setReceiptUrl('')
      setUploading(true)
      const uploaded = await uploadPublicReceipt(local)
      setReceiptUrl(uploaded.url)
    } catch (error) {
      if (error instanceof Error && /cancel|dismiss|canceled/i.test(error.message)) return
      setReceiptUrl('')
      setFormError(
        error instanceof ApiError && error.message !== USER_MESSAGES.generic
          ? error.message
          : t('checkout.receiptFailed')
      )
    } finally {
      setUploading(false)
    }
  }

  const goPayment = form.handleSubmit(() => {
    setFormError(null)
    setStep('payment')
  })

  const goReview = () => {
    if (!proofOk) {
      setFormError(t('checkout.receiptRequired'))
      return
    }
    setFormError(null)
    setStep('review')
  }

  const submitOrder = async (values: CheckoutDetails) => {
    if (submitting || uploading || empty || !proofOk) return
    const fingerprint = checkoutAttemptFingerprint({
      slugs: lines.map((line) => ({ slug: line.slug, quantity: line.quantity })),
      customerName: values.customerName,
      customerEmail: values.customerEmail,
      customerPhone: values.customerPhone,
      fulfillmentType: values.fulfillmentType,
      deliveryAddress: values.deliveryAddress,
    })
    if (attempt.current.fingerprint !== fingerprint) {
      attempt.current = { fingerprint, key: newOnlineIdempotencyKey() }
    }
    setSubmitting(true)
    setFormError(null)
    try {
      const created = await createPublicOrder({
        items: lines.map((line) => ({
          slug: line.slug,
          quantity: line.quantity,
          quotedUnitPrice: line.displayPrice,
        })),
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone,
        fulfillmentType: values.fulfillmentType,
        deliveryAddress: values.deliveryAddress,
        notes: values.notes,
        receiptUrl,
        receiptNumber,
        idempotencyKey: attempt.current.key,
      })
      clearCart()
      router.replace(
        `/customer/order/${encodeURIComponent(created.orderNumber)}?placed=1` as never
      )
    } catch (error) {
      const mapped = checkoutSubmitMessage(error)
      setFormError(mapped.text ?? t(mapped.key as ShopUiKey))
    } finally {
      setSubmitting(false)
    }
  }

  const back = () => {
    setFormError(null)
    if (step === 'review') setStep('payment')
    else if (step === 'payment') setStep('details')
    else router.back()
  }

  const summary = useMemo(
    () =>
      lines.map((line) => (
        <View key={line.slug} style={styles.summaryRow}>
          <View style={styles.summaryThumb}>
            {line.image ? (
              <Image source={{ uri: line.image }} style={styles.summaryImage} contentFit="contain" />
            ) : (
              <Ionicons name="cube-outline" size={18} color={shopColor.muted} />
            )}
          </View>
          <View style={styles.summaryBody}>
            <Text style={styles.summaryName} numberOfLines={2}>
              {line.name}
            </Text>
            <Text style={styles.summaryMeta}>
              {t('cart.line', { unit: line.sellingUnitLabel, n: line.quantity })}
            </Text>
          </View>
          <Text style={styles.summaryPrice}>{formatRwf(line.displayPrice * line.quantity)}</Text>
        </View>
      )),
    [lines, t]
  )

  if (empty) {
    return (
      <ShopScreen>
        <ShopHeader title={t('checkout.title')} showSearch={false} onBack={() => router.back()} />
        <Text style={styles.empty}>{t('checkout.emptyCart')}</Text>
        <Pressable
          onPress={() => router.push('/customer' as never)}
          accessibilityRole="button"
          accessibilityLabel={t('cart.continue')}
          style={styles.primary}
        >
          <Text style={styles.primaryLabel}>{t('cart.continue')}</Text>
        </Pressable>
      </ShopScreen>
    )
  }

  return (
    <ShopScreen>
      <ShopHeader title={t('checkout.title')} showSearch={false} onBack={back} />
      <Text style={styles.stepHint}>
        {step === 'details'
          ? t('checkout.contact')
          : step === 'payment'
            ? t('common.payment')
            : t('checkout.review')}
      </Text>

      {step === 'details' ? (
        <View style={styles.card}>
          <Field label={t('checkout.name')} error={fieldError('customerName')}>
            <Controller
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoCapitalize="words"
                  style={styles.input}
                  accessibilityLabel={t('checkout.name')}
                />
              )}
            />
          </Field>
          <Field label={t('checkout.email')} error={fieldError('customerEmail')}>
            <Controller
              control={form.control}
              name="customerEmail"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  accessibilityLabel={t('checkout.email')}
                />
              )}
            />
          </Field>
          <Field label={t('checkout.phone')} error={fieldError('customerPhone')}>
            <Controller
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  keyboardType="phone-pad"
                  style={styles.input}
                  accessibilityLabel={t('checkout.phone')}
                />
              )}
            />
          </Field>
          <Text style={styles.label}>{t('checkout.fulfillment')}</Text>
          <View style={styles.choiceRow}>
            {(['pickup', 'delivery'] as const).map((value) => (
              <Pressable
                key={value}
                onPress={() => form.setValue('fulfillmentType', value)}
                accessibilityRole="button"
                accessibilityState={{ selected: fulfillmentType === value }}
                accessibilityLabel={t(value === 'pickup' ? 'checkout.pickup' : 'checkout.delivery')}
                style={[styles.choice, fulfillmentType === value && styles.choiceOn]}
              >
                <Text style={[styles.choiceLabel, fulfillmentType === value && styles.choiceLabelOn]}>
                  {t(value === 'pickup' ? 'checkout.pickup' : 'checkout.delivery')}
                </Text>
              </Pressable>
            ))}
          </View>
          {fulfillmentType === 'delivery' ? (
            <Field label={t('checkout.address')} error={fieldError('deliveryAddress')}>
              <Controller
                control={form.control}
                name="deliveryAddress"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    multiline
                    style={[styles.input, styles.multiline]}
                    accessibilityLabel={t('checkout.address')}
                  />
                )}
              />
            </Field>
          ) : null}
          <Field label={t('checkout.notes')}>
            <Controller
              control={form.control}
              name="notes"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  multiline
                  style={[styles.input, styles.multiline]}
                  accessibilityLabel={t('checkout.notes')}
                />
              )}
            />
          </Field>
        </View>
      ) : null}

      {step === 'payment' ? (
        <View style={styles.card}>
          <Text style={styles.paymentTitle}>{t('checkout.paymentMomo')}</Text>
          <Text style={styles.hint}>{t('checkout.momoHint')}</Text>
          <View style={styles.momoBox}>
            <Text style={styles.momoLabel}>{t('checkout.momoCode')}</Text>
            <Text style={styles.momoValue}>{t('checkout.momoPayCodeValue')}</Text>
            <Text style={styles.momoLabel}>{t('checkout.momoAccount')}</Text>
            <Text style={styles.momoAccount}>{t('checkout.momoAccountValue')}</Text>
            <Text style={styles.momoAmount}>
              {t('common.total')}: {formatRwf(displayTotal)}
            </Text>
          </View>
          <Text style={styles.label}>{t('checkout.receiptUpload')}</Text>
          {receiptUri ? (
            <Image source={{ uri: receiptUri }} style={styles.receipt} contentFit="contain" />
          ) : null}
          <Pressable
            onPress={() => void pickReceipt()}
            disabled={uploading}
            accessibilityRole="button"
            accessibilityLabel={receiptUri ? t('checkout.receiptReplace') : t('checkout.receiptPick')}
            style={[styles.secondary, uploading && styles.disabled]}
          >
            {uploading ? (
              <ActivityIndicator color={shopColor.green} />
            ) : (
              <Text style={styles.secondaryLabel}>
                {receiptUri ? t('checkout.receiptReplace') : t('checkout.receiptPick')}
              </Text>
            )}
          </Pressable>
          {uploading ? <Text style={styles.hint}>{t('checkout.receiptUploading')}</Text> : null}
          {receiptUrl ? <Text style={styles.ready}>{t('checkout.receiptReady')}</Text> : null}
          <Field label={t('checkout.receiptRef')}>
            <TextInput
              value={receiptNumber}
              onChangeText={setReceiptNumber}
              style={styles.input}
              accessibilityLabel={t('checkout.receiptRef')}
            />
          </Field>
        </View>
      ) : null}

      {step === 'review' ? (
        <View style={styles.card}>
          <Text style={styles.section}>{t('checkout.summary')}</Text>
          {summary}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('common.total')}</Text>
            <Text style={styles.total}>{formatRwf(displayTotal)}</Text>
          </View>
          <Text style={styles.hint}>{t('checkout.previewHint')}</Text>
          <Text style={styles.meta}>
            {form.getValues('customerName')} · {form.getValues('customerPhone')}
          </Text>
          <Text style={styles.meta}>
            {form.getValues('fulfillmentType') === 'delivery'
              ? t('checkout.delivery')
              : t('checkout.pickup')}
          </Text>
          <Text style={styles.meta}>{t('checkout.paymentMomo')}</Text>
        </View>
      ) : null}

      {formError ? <Text style={styles.error}>{formError}</Text> : null}

      {step === 'details' ? (
        <Pressable
          onPress={() => void goPayment()}
          accessibilityRole="button"
          accessibilityLabel={t('checkout.continuePayment')}
          style={styles.primary}
        >
          <Text style={styles.primaryLabel}>{t('checkout.continuePayment')}</Text>
        </Pressable>
      ) : null}

      {step === 'payment' ? (
        <Pressable
          onPress={goReview}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityState={{ disabled: uploading }}
          accessibilityLabel={t('checkout.continueReview')}
          style={[styles.primary, uploading && styles.disabled]}
        >
          <Text style={styles.primaryLabel}>{t('checkout.continueReview')}</Text>
        </Pressable>
      ) : null}

      {step === 'review' ? (
        <Pressable
          onPress={() => void form.handleSubmit(submitOrder)()}
          disabled={submitting || uploading}
          accessibilityRole="button"
          accessibilityState={{ disabled: submitting || uploading }}
          accessibilityLabel={submitting ? t('checkout.submitting') : t('checkout.submit')}
          style={[styles.primary, (submitting || uploading) && styles.disabled]}
        >
          {submitting ? (
            <ActivityIndicator color={shopColor.white} />
          ) : (
            <Text style={styles.primaryLabel}>{t('checkout.submit')}</Text>
          )}
        </Pressable>
      ) : null}

      {step !== 'review' ? (
        <View style={styles.card}>
          <Text style={styles.section}>{t('checkout.summary')}</Text>
          {summary}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('common.total')}</Text>
            <Text style={styles.total}>{formatRwf(displayTotal)}</Text>
          </View>
        </View>
      ) : null}
    </ShopScreen>
  )
}

function unwrapPickedFile(picked: unknown): File | null {
  if (!picked) return null
  if (typeof picked === 'object' && picked !== null && 'canceled' in picked) {
    const row = picked as { canceled?: boolean; result?: File | File[] }
    if (row.canceled) return null
    const result = row.result
    return Array.isArray(result) ? result[0] ?? null : result ?? null
  }
  if (Array.isArray(picked)) return picked[0] ?? null
  return picked instanceof File ? picked : null
}

function receiptExtension(file: File): string {
  const fromName = (file.name || file.uri || '').split('?')[0].split('.').pop()?.toLowerCase()
  if (fromName === 'jpeg') return 'jpg'
  if (fromName && ['jpg', 'png', 'webp', 'gif', 'pdf'].includes(fromName)) return fromName
  const type = String(file.type || '').toLowerCase()
  if (type.includes('png')) return 'png'
  if (type.includes('webp')) return 'webp'
  if (type.includes('gif')) return 'gif'
  if (type.includes('pdf')) return 'pdf'
  return 'jpg'
}

function copyReceiptForUpload(file: File): File {
  const dest = new File(Paths.cache, `receipt-${Date.now()}.${receiptExtension(file)}`)
  try {
    file.copy(dest)
    return dest
  } catch {
    return file
  }
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  stepHint: { fontFamily: font.bold, fontSize: 20, color: shopColor.text },
  empty: { fontFamily: font.regular, fontSize: 15, color: shopColor.muted },
  card: {
    backgroundColor: shopColor.white,
    borderRadius: shopRadius.lg,
    borderWidth: 1,
    borderColor: shopColor.border,
    padding: 16,
    gap: 12,
  },
  field: { gap: 6 },
  label: { fontFamily: font.semibold, fontSize: 13, color: shopColor.text },
  input: {
    minHeight: 48,
    borderRadius: shopRadius.md,
    backgroundColor: shopColor.tile,
    paddingHorizontal: 12,
    fontFamily: font.regular,
    fontSize: 16,
    color: shopColor.text,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 },
  choiceRow: { flexDirection: 'row', gap: 8 },
  choice: {
    flex: 1,
    minHeight: 48,
    borderRadius: shopRadius.md,
    backgroundColor: shopColor.tile,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  choiceOn: { backgroundColor: shopColor.greenSoft, borderWidth: 1, borderColor: shopColor.green },
  choiceLabel: { fontFamily: font.semibold, fontSize: 13, color: shopColor.text, textAlign: 'center' },
  choiceLabelOn: { color: shopColor.green },
  paymentTitle: { fontFamily: font.bold, fontSize: 18, color: shopColor.text },
  hint: { fontFamily: font.regular, fontSize: 13, color: shopColor.muted },
  momoBox: {
    backgroundColor: '#FFF8DB',
    borderRadius: shopRadius.md,
    padding: 14,
    gap: 4,
  },
  momoLabel: { fontFamily: font.regular, fontSize: 12, color: shopColor.muted },
  momoValue: { fontFamily: font.bold, fontSize: 28, color: shopColor.text },
  momoAccount: { fontFamily: font.semibold, fontSize: 16, color: shopColor.text, marginBottom: 8 },
  momoAmount: { fontFamily: font.semibold, fontSize: 14, color: shopColor.text },
  receipt: {
    height: 180,
    borderRadius: shopRadius.md,
    backgroundColor: shopColor.tile,
  },
  ready: { fontFamily: font.semibold, fontSize: 13, color: shopColor.green },
  section: { fontFamily: font.bold, fontSize: 16, color: shopColor.text },
  summaryRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  summaryThumb: {
    width: 48,
    height: 48,
    borderRadius: shopRadius.sm,
    backgroundColor: shopColor.tile,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  summaryImage: { width: '100%', height: '100%' },
  summaryBody: { flex: 1 },
  summaryName: { fontFamily: font.semibold, fontSize: 14, color: shopColor.text },
  summaryMeta: { fontFamily: font.regular, fontSize: 12, color: shopColor.muted },
  summaryPrice: { fontFamily: font.bold, fontSize: 14, color: shopColor.green },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: font.semibold, fontSize: 16, color: shopColor.text },
  total: { fontFamily: font.bold, fontSize: 22, color: shopColor.green },
  meta: { fontFamily: font.regular, fontSize: 13, color: shopColor.textSecondary },
  error: { fontFamily: font.semibold, fontSize: 14, color: shopColor.danger },
  fieldError: { fontFamily: font.regular, fontSize: 12, color: shopColor.danger },
  primary: {
    minHeight: 48,
    borderRadius: shopRadius.pill,
    backgroundColor: shopColor.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { fontFamily: font.semibold, fontSize: 16, color: shopColor.white },
  secondary: {
    minHeight: 48,
    borderRadius: shopRadius.pill,
    backgroundColor: shopColor.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: { fontFamily: font.semibold, fontSize: 15, color: shopColor.text },
  disabled: { opacity: 0.55 },
})
