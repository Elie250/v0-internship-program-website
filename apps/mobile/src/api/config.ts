/** Production shop host. Never put service-role keys or database URLs here. */
export const PRODUCTION_API_BASE_URL = 'https://shop.energyandlogics.com'

const LOCAL_HOST =
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.0\.2\.2)$/i
const PRIVATE_LAN =
  /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/

export function isLocalDevApiHost(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return LOCAL_HOST.test(host) || PRIVATE_LAN.test(host) || host.endsWith('.local')
  } catch {
    return true
  }
}

/**
 * Resolve the public/staff API origin.
 * Development may point at a local Next.js host. Release builds always use HTTPS production
 * if the configured value is localhost, LAN, or cleartext HTTP.
 */
export function resolveApiBaseUrl(input: {
  env?: string | null
  extra?: unknown
  isDev: boolean
}): string {
  const env = typeof input.env === 'string' ? input.env.trim() : ''
  const extra = typeof input.extra === 'string' ? input.extra.trim() : ''
  const raw = (env || extra || PRODUCTION_API_BASE_URL).replace(/\/$/, '')

  if (!/^https?:\/\//i.test(raw)) {
    return PRODUCTION_API_BASE_URL
  }

  if (!input.isDev) {
    if (!raw.startsWith('https://') || isLocalDevApiHost(raw)) {
      return PRODUCTION_API_BASE_URL
    }
  }

  return raw
}
