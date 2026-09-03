import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

const KEY = 'el.customer.favorites'

type FavoritesState = {
  slugs: string[]
  hydrated: boolean
  hydrate: () => Promise<void>
  toggle: (slug: string) => void
  has: (slug: string) => boolean
}

function persist(slugs: string[]) {
  void SecureStore.setItemAsync(KEY, JSON.stringify(slugs)).catch(() => undefined)
}

export const useFavorites = create<FavoritesState>((set, get) => ({
  slugs: [],
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(KEY)
      const parsed = raw ? (JSON.parse(raw) as unknown) : []
      const slugs = Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : []
      set({ slugs, hydrated: true })
    } catch {
      set({ hydrated: true })
    }
  },
  toggle: (slug) => {
    const current = get().slugs
    const slugs = current.includes(slug)
      ? current.filter((item) => item !== slug)
      : [...current, slug]
    set({ slugs })
    persist(slugs)
  },
  has: (slug) => get().slugs.includes(slug),
}))
