const DEFAULT_BASE = 'https://shop.energyandlogics.com'

export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || DEFAULT_BASE
  return raw.replace(/\/$/, '')
}

export class ApiError extends Error {
  readonly status: number
  readonly code: 'unauthorized' | 'forbidden' | 'network' | 'http'

  constructor(message: string, status: number, code: ApiError['code'] = 'http') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export type TokenProvider = () => string | null | Promise<string | null>
export type UnauthorizedHandler = () => void | Promise<void>

let tokenProvider: TokenProvider = () => null
let onUnauthorized: UnauthorizedHandler | null = null

export function configureApiClient(options: {
  getToken: TokenProvider
  onUnauthorized?: UnauthorizedHandler
}) {
  tokenProvider = options.getToken
  onUnauthorized = options.onUnauthorized ?? null
}

function shouldRetry(status: number, attempt: number, method: string): boolean {
  if (attempt >= 2) return false
  if (method !== 'GET') return false
  if (status >= 400 && status < 500) return false
  return status === 0 || status >= 500
}

export async function staffRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const method = (init.method || 'GET').toUpperCase()
  let attempt = 0

  while (true) {
    try {
      const token = await tokenProvider()
      const headers = new Headers(init.headers)
      headers.set('Accept', 'application/json')
      if (init.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
      if (token) headers.set('Authorization', `Bearer ${token}`)

      const response = await fetch(`${getApiBaseUrl()}${path}`, {
        ...init,
        method,
        headers,
      })

      const data = (await response.json().catch(() => ({}))) as {
        error?: string
        message?: string
      }

      if (response.status === 401) {
        await onUnauthorized?.()
        throw new ApiError(
          typeof data.error === 'string' ? data.error : 'Session expired. Sign in again.',
          401,
          'unauthorized'
        )
      }

      if (!response.ok) {
        if (shouldRetry(response.status, attempt, method)) {
          attempt += 1
          continue
        }
        throw new ApiError(
          typeof data.error === 'string'
            ? data.error
            : typeof data.message === 'string'
              ? data.message
              : 'Request failed',
          response.status,
          response.status === 403 ? 'forbidden' : 'http'
        )
      }

      return data as T
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (shouldRetry(0, attempt, method)) {
        attempt += 1
        continue
      }
      throw new ApiError('Network error. Check your connection and try again.', 0, 'network')
    }
  }
}
