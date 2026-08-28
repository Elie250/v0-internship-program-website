import { create } from 'zustand'
import { ApiError, configureApiClient } from '@/src/api/client'
import { clearSensitiveStaffCache } from '@/src/api/query-client'
import { fetchStaffSession, loginStaff, logoutStaff } from '@/src/api/staff'
import type { StaffUser } from '@/src/api/types'
import { clearStaffToken, readStaffToken, writeStaffToken } from '@/src/auth/secure-session'

type SessionState = {
  hydrated: boolean
  token: string | null
  user: StaffUser | null
  restoreError: string | null
  hydrate: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  expire: () => Promise<void>
}

async function wipeLocalSession() {
  await clearStaffToken()
  clearSensitiveStaffCache()
}

export const useSessionStore = create<SessionState>((set, get) => ({
  hydrated: false,
  token: null,
  user: null,
  restoreError: null,

  hydrate: async () => {
    const token = await readStaffToken()
    if (!token) {
      set({ hydrated: true, token: null, user: null, restoreError: null })
      return
    }
    set({ token, restoreError: null })
    try {
      const session = await fetchStaffSession()
      set({ hydrated: true, user: session.user, token, restoreError: null })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'unauthorized') {
        set({ hydrated: true, token: null, user: null, restoreError: null })
        return
      }
      set({
        hydrated: true,
        token: get().token,
        user: get().user,
        restoreError:
          error instanceof ApiError
            ? error.message
            : 'Unable to connect. Check your connection and try again.',
      })
    }
  },

  signIn: async (email, password) => {
    const result = await loginStaff(email, password)
    await writeStaffToken(result.token)
    clearSensitiveStaffCache()
    set({ token: result.token, user: result.user, hydrated: true, restoreError: null })
  },

  signOut: async () => {
    try {
      if (get().token) await logoutStaff()
    } catch {
      /* still clear locally */
    }
    await wipeLocalSession()
    set({ token: null, user: null, hydrated: true, restoreError: null })
  },

  expire: async () => {
    await wipeLocalSession()
    set({ token: null, user: null, hydrated: true, restoreError: null })
  },
}))

configureApiClient({
  getToken: () => useSessionStore.getState().token,
  onUnauthorized: () => useSessionStore.getState().expire(),
})
