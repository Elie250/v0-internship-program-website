'use client'

/**
 * Browser → /api/staff/* helper. Never talks to Supabase directly.
 */
export async function fetchStaffApi<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<{ ok: true; data: T; status: number } | { ok: false; error: string; status: number }> {
  try {
    const res = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error:
          typeof (data as { error?: string }).error === 'string'
            ? (data as { error: string }).error
            : 'Request failed',
      }
    }
    return { ok: true, data: data as T, status: res.status }
  } catch {
    return { ok: false, error: 'Network error', status: 0 }
  }
}

export type StaffListResponse<T> = {
  items: T[]
  page: number
  limit: number
  total: number
}
