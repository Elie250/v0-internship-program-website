import { create } from 'zustand'
import { ApiError, configureApiClient } from '@/src/api/client'
import { clearSensitiveStaffCache } from '@/src/api/query-client'
import { fetchStaffSession, loginStaff, logoutStaff } from '@/src/api/staff'
import type { StaffUser } from '@/src/api/types'
import {
  clearStaffEmail,
  clearStaffToken,
  readStaffEmail,
  readStaffLocked,
  readStaffToken,
  writeStaffEmail,
  writeStaffLocked,
  writeStaffToken,
} from '@/src/auth/secure-session'

type SessionState = {
  hydrated: boolean
  token: string | null
  user: StaffUser | null
  locked: boolean
  lastEmail: string | null
  restoreError: string | null
  hydrate: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  expire: () => Promise<void>
  lock: () => Promise<void>
  switchUser: () => Promise<void>
}

async function wipeLocalSession() {
  await clearStaffToken()
  await writeStaffLocked(false)
  await clearStaffEmail()
  clearSensitiveStaffCache()
}

export const useSessionStore = create<SessionState>((set, get) => ({
  hydrated: false,
  token: null,
  user: null,
  locked: false,
  lastEmail: null,
  restoreError: null,

  hydrate: async () => {
    const [token, locked, lastEmail] = await Promise.all([
      readStaffToken(),
      readStaffLocked(),
      readStaffEmail(),
    ])
    if (!token) {
      set({
        hydrated: true,
        token: null,
        user: null,
        locked: false,
        lastEmail,
        restoreError: null,
      })
      return
    }
    set({ token, locked, lastEmail, restoreError: null })
    try {
      const session = await fetchStaffSession()
      set({
        hydrated: true,
        user: session.user,
        token,
        locked,
        lastEmail: session.user.email || lastEmail,
        restoreError: null,
      })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'unauthorized') {
        await wipeLocalSession()
        set({
          hydrated: true,
          token: null,
          user: null,
          locked: false,
          lastEmail: null,
          restoreError: null,
        })
        return
      }
      set({
        hydrated: true,
        token: get().token,
        user: get().user,
        locked: get().locked,
        lastEmail: get().lastEmail,
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
    await writeStaffLocked(false)
    await writeStaffEmail(result.user.email || email.trim())
    clearSensitiveStaffCache()
    set({
      token: result.token,
      user: result.user,
      locked: false,
      lastEmail: result.user.email || email.trim(),
      hydrated: true,
      restoreError: null,
    })
  },

  signOut: async () => {
    try {
      if (get().token) await logoutStaff()
    } catch {
      /* still clear locally */
    }
    await wipeLocalSession()
    set({
      token: null,
      user: null,
      locked: false,
      lastEmail: null,
      hydrated: true,
      restoreError: null,
    })
  },

  expire: async () => {
    if (get().locked) {
      clearSensitiveStaffCache()
      return
    }
    await wipeLocalSession()
    set({
      token: null,
      user: null,
      locked: false,
      lastEmail: null,
      hydrated: true,
      restoreError: null,
    })
  },

  lock: async () => {
    if (!get().token) return
    await writeStaffLocked(true)
    clearSensitiveStaffCache()
    set({ locked: true })
  },

  switchUser: async () => {
    try {
      if (get().token) await logoutStaff()
    } catch {
      /* still clear locally */
    }
    await wipeLocalSession()
    set({
      token: null,
      user: null,
      locked: false,
      lastEmail: null,
      hydrated: true,
      restoreError: null,
    })
  },
}))

configureApiClient({
  getToken: () => {
    const { token, locked, hydrated } = useSessionStore.getState()
    if (!token) return null
    if (locked && hydrated) return null
    return token
  },
  onUnauthorized: () => useSessionStore.getState().expire(),
})
