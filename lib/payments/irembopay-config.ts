import { COMPANY } from '@/lib/company/constants'

export type IremboPayConfig = {
  secretKey: string
  publicKey: string
  environment: 'sandbox' | 'production'
  paymentAccountIdentifier: string
  productCode: string
  enabled: boolean
  apiBaseUrl: string
}

export function getIremboPayConfig(): IremboPayConfig {
  const secretKey = process.env.IREMBOPAY_SECRET_KEY?.trim() ?? ''
  const publicKey = process.env.IREMBOPAY_PUBLIC_KEY?.trim() ?? ''
  const environment =
    process.env.IREMBOPAY_ENVIRONMENT?.trim().toLowerCase() === 'production'
      ? 'production'
      : 'sandbox'
  const paymentAccountIdentifier =
    process.env.IREMBOPAY_PAYMENT_ACCOUNT_IDENTIFIER?.trim() ?? ''
  const productCode = process.env.IREMBOPAY_PRODUCT_CODE?.trim() ?? ''

  const apiBaseUrl =
    environment === 'production'
      ? 'https://api.irembopay.com'
      : 'https://api.sandbox.irembopay.com'

  return {
    secretKey,
    publicKey,
    environment,
    paymentAccountIdentifier,
    productCode,
    apiBaseUrl,
    enabled: Boolean(
      secretKey && publicKey && paymentAccountIdentifier && productCode
    ),
  }
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    COMPANY.publicSiteUrl.replace(/\/$/, '')
  )
}
