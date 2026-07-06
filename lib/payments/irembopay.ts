import crypto from 'crypto'
import { getIremboPayConfig } from '@/lib/payments/irembopay-config'

export type IremboPayCustomer = {
  email: string
  name: string
  phoneNumber?: string
}

export type CreateInvoiceInput = {
  transactionId: string
  unitAmount: number
  quantity?: number
  description?: string
  customer?: IremboPayCustomer
  expiryAt?: string
}

export type IremboPayInvoice = {
  invoiceNumber: string
  transactionId: string
  paymentLinkUrl: string
  paymentStatus: string
  amount: number
  currency: string
  paidAt?: string | null
  paymentMethod?: string | null
  paymentReference?: string | null
}

type ApiEnvelope<T> = {
  success?: boolean
  message?: string
  data?: T
  errors?: Array<{ code?: string; detail?: string }>
}

export function isIremboPayEnabled(): boolean {
  return getIremboPayConfig().enabled
}

export function generateIremboTransactionId(prefix: string): string {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
}

async function iremboRequest<T>(
  path: string,
  init?: RequestInit
): Promise<{ data?: T; error?: string }> {
  const config = getIremboPayConfig()
  if (!config.secretKey) {
    return { error: 'IremboPay is not configured' }
  }

  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'irembopay-secretKey': config.secretKey,
      'X-API-Version': '2',
      ...(init?.headers ?? {}),
    },
  })

  const payload = (await response.json()) as ApiEnvelope<T>
  if (!response.ok || payload.success === false) {
    const detail =
      payload.errors?.map((e) => e.detail).filter(Boolean).join('; ') ||
      payload.message ||
      `IremboPay request failed (${response.status})`
    return { error: detail }
  }

  if (!payload.data) {
    return { error: payload.message || 'Empty IremboPay response' }
  }

  return { data: payload.data }
}

export async function createIremboPayInvoice(
  input: CreateInvoiceInput
): Promise<{ invoice?: IremboPayInvoice; error?: string }> {
  const config = getIremboPayConfig()
  if (!config.enabled) {
    return { error: 'IremboPay is not configured on this site yet.' }
  }

  const expiryAt =
    input.expiryAt ??
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const body = {
    transactionId: input.transactionId,
    paymentAccountIdentifier: config.paymentAccountIdentifier,
    description: input.description ?? 'Engineering Hub payment',
    language: 'EN',
    expiryAt,
    customer: input.customer
      ? {
          email: input.customer.email,
          name: input.customer.name,
          phoneNumber: input.customer.phoneNumber ?? '',
        }
      : undefined,
    paymentItems: [
      {
        code: config.productCode,
        quantity: input.quantity ?? 1,
        unitAmount: input.unitAmount,
      },
    ],
  }

  const result = await iremboRequest<IremboPayInvoice>('/payments/invoices', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  if (result.error || !result.data) {
    return { error: result.error || 'Failed to create invoice' }
  }

  return { invoice: result.data }
}

export async function getIremboPayInvoice(
  invoiceReference: string
): Promise<{ invoice?: IremboPayInvoice; error?: string }> {
  const encoded = encodeURIComponent(invoiceReference)
  const result = await iremboRequest<IremboPayInvoice>(
    `/payments/invoices/${encoded}`,
    { method: 'GET' }
  )

  if (result.error || !result.data) {
    return { error: result.error || 'Invoice not found' }
  }

  return { invoice: result.data }
}

export function verifyIremboPayWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const config = getIremboPayConfig()
  if (!config.secretKey || !signatureHeader) return false

  let timestamp: string | null = null
  let signatureHash: string | null = null

  for (const element of signatureHeader.split(',')) {
    const [prefix, value] = element.split('=')
    if (prefix === 't') timestamp = value
    if (prefix === 's') signatureHash = value
  }

  if (!timestamp || !signatureHash) return false

  const signedPayload = `${timestamp}#${rawBody}`
  const expectedSignature = crypto
    .createHmac('sha256', config.secretKey)
    .update(signedPayload)
    .digest('hex')

  try {
    const valid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signatureHash, 'hex')
    )
    if (!valid) return false

    const currentTime = Date.now()
    const timestampInt = Number.parseInt(timestamp, 10)
    if (Number.isFinite(timestampInt) && Math.abs(currentTime - timestampInt) > 300_000) {
      return false
    }

    return true
  } catch {
    return expectedSignature === signatureHash
  }
}
