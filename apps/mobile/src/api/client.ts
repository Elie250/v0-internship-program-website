import Constants from 'expo-constants'
import { PRODUCTION_API_BASE_URL, resolveApiBaseUrl } from '@/src/api/config'
import { sanitizeApiErrorMessage, type ApiErrorCode } from '@/src/api/errors'

export { PRODUCTION_API_BASE_URL, resolveApiBaseUrl }

export function getApiBaseUrl(): string {
  return resolveApiBaseUrl({
    env: process.env.EXPO_PUBLIC_API_BASE_URL,
    extra: Constants.expoConfig?.extra?.apiBaseUrl,
    isDev: typeof __DEV__ !== 'undefined' ? __DEV__ : false,
  })
}

function logApiFailure(details: {
  method: string
  url: string
  status: number
  code: ApiErrorCode
  reason?: string
}) {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return
  const extra = details.reason ? ` ${details.reason}` : ''
  console.warn(
    `[el-api] ${details.method} ${details.url} -> ${details.code} HTTP ${details.status}${extra}`
  )
}

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode

  constructor(message: string, status: number, code: ApiErrorCode = 'http') {
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
let expireInFlight: Promise<void> | null = null

export function configureApiClient(options: {
  getToken: TokenProvider
  onUnauthorized?: UnauthorizedHandler
}) {
  tokenProvider = options.getToken
  onUnauthorized = options.onUnauthorized ?? null
}

async function notifyUnauthorized() {
  if (!onUnauthorized) return
  if (expireInFlight) {
    await expireInFlight
    return
  }
  expireInFlight = Promise.resolve(onUnauthorized()).then(() => undefined)
  try {
    await expireInFlight
  } finally {
    expireInFlight = null
  }
}

function shouldRetry(status: number, attempt: number, method: string): boolean {
  if (attempt >= 2) return false
  if (method !== 'GET') return false
  if (status >= 400 && status < 500) return false
  return status === 0 || status >= 500
}

function codeForStatus(status: number): ApiErrorCode {
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status >= 500) return 'http'
  return 'http'
}

function abortError(error: unknown): boolean {
  return (
    (error instanceof Error && error.name === 'AbortError') ||
    (typeof error === 'object' && error != null && 'name' in error && error.name === 'AbortError')
  )
}

export type StaffRequestOptions = RequestInit & {
  /** Login must not expire an empty session or rewrite the error as "session expired". */
  expireOn401?: boolean
  isLogin?: boolean
  timeoutMs?: number
}

export async function publicRequest<T>(
  path: string,
  init: Omit<StaffRequestOptions, 'expireOn401' | 'isLogin'> = {}
): Promise<T> {
  return jsonRequest<T>(path, { ...init, auth: false, expireOn401: false })
}

export async function staffRequest<T>(
  path: string,
  init: StaffRequestOptions = {}
): Promise<T> {
  return jsonRequest<T>(path, { ...init, auth: true })
}

async function jsonRequest<T>(
  path: string,
  init: StaffRequestOptions & { auth: boolean }
): Promise<T> {
  const { expireOn401 = true, isLogin = false, timeoutMs = 25_000, auth: useAuth, ...requestInit } =
    init
  const method = (requestInit.method || 'GET').toUpperCase()
  const url = `${getApiBaseUrl()}${path}`
  let attempt = 0

  const fail = (error: ApiError, reason?: string): ApiError => {
    logApiFailure({ method, url, status: error.status, code: error.code, reason })
    return error
  }

  while (true) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const token = await tokenProvider()
      const headers = new Headers(requestInit.headers)
      headers.set('Accept', 'application/json')
      if (requestInit.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
      if (useAuth && token) headers.set('Authorization', `Bearer ${token}`)

      const response = await fetch(url, {
        ...requestInit,
        method,
        headers,
        signal: controller.signal,
      })

      const text = await response.text()
      let parsed: unknown = undefined
      let jsonOk = false
      if (text.trim()) {
        try {
          parsed = JSON.parse(text)
          jsonOk = true
        } catch {
          jsonOk = false
        }
      }

      const data = jsonOk && parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
      const serverMessage =
        typeof data.error === 'string'
          ? data.error
          : typeof data.message === 'string'
            ? data.message
            : undefined

      if (response.status === 401) {
        if (expireOn401 && !isLogin) await notifyUnauthorized()
        throw fail(
          new ApiError(
            sanitizeApiErrorMessage({
              status: 401,
              code: 'unauthorized',
              serverMessage,
              isLogin,
            }),
            401,
            'unauthorized'
          )
        )
      }

      if (!response.ok) {
        if (shouldRetry(response.status, attempt, method)) {
          attempt += 1
          continue
        }
        const code = codeForStatus(response.status)
        throw fail(
          new ApiError(
            sanitizeApiErrorMessage({
              status: response.status,
              code,
              serverMessage,
              isLogin,
            }),
            response.status,
            code
          ),
          jsonOk ? undefined : 'non-json body'
        )
      }

      if (!text.trim() || !jsonOk) {
        throw fail(
          new ApiError(
            sanitizeApiErrorMessage({ status: 500, code: 'invalid_json' }),
            500,
            'invalid_json'
          ),
          'invalid json'
        )
      }

      return parsed as T
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (abortError(error)) {
        if (shouldRetry(0, attempt, method)) {
          attempt += 1
          continue
        }
        throw fail(
          new ApiError(sanitizeApiErrorMessage({ status: 0, code: 'timeout' }), 0, 'timeout')
        )
      }
      if (shouldRetry(0, attempt, method)) {
        attempt += 1
        continue
      }
      throw fail(
        new ApiError(sanitizeApiErrorMessage({ status: 0, code: 'network' }), 0, 'network')
      )
    } finally {
      clearTimeout(timer)
    }
  }
}
