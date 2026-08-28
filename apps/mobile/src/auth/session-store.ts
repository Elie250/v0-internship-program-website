import { create } from 'zustand'
import { configureApiClient } from '@/src/api/client'
import { fetchStaffSession, loginStaff, logoutStaff } from '@/src/api/staff'
import type { StaffUser } from '@/src/api/types'
import { clearStaffToken, readStaffToken, writeStaffToken } from '@/src/auth/secure-session'

type SessionState = {
  hydrated: boolean
  token: string | null
  user: StaffUser | null
  hydrate: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  expire: () => Promise<void>
}

export const useSessionStore = create<SessionState>((set, get) => ({
  hydrated: false,
  token: null,
  user: null,

  hydrate: async () => {
    const token = await readStaffToken()
    if (!token) {
      set({ hydrated: true, token: null, user: null })
      return
    }
    set({ token })
    try {
      const session = await fetchStaffSession()
      set({ hydrated: true, user: session.user, token })
    } catch {
      await clearStaffToken()
      set({ hydrated: true, token: null, user: null })
    }
  },

  signIn: async (email, password) => {
    const result = await loginStaff(email, password)
    await writeStaffToken(result.token)
    set({ token: result.token, user: result.user, hydrated: true })
  },

  signOut: async () => {
    try {
      if (get().token) await logoutStaff()
    } catch {
      /* still clear locally */
    }
    await clearStaffToken()
    set({ token: null, user: null, hydrated: true })
  },

  expire: async () => {
    await clearStaffToken()
    set({ token: null, user: null, hydrated: true })
  },
}))

configureApiClient({
  getToken: () => useSessionStore.getState().token,
  onUnauthorized: () => useSessionStore.getState().expire(),
})
