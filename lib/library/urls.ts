import type { LibraryCultureType, LibraryPillar } from '@/lib/library/items'

export type LibrarySort = 'newest' | 'popular'

export type LibraryBrowseParams = {
  category?: LibraryPillar
  type?: LibraryCultureType
  lang?: string
  sort?: LibrarySort
  q?: string
}

export const LIBRARY_LANGUAGES = [
  { id: 'rw', label: 'Kinyarwanda' },
  { id: 'en', label: 'English' },
] as const

export const LIBRARY_SORT_OPTIONS: { id: LibrarySort; label: string }[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'popular', label: 'Popular' },
]

export function buildLibraryHref(params: LibraryBrowseParams): string {
  const search = new URLSearchParams()
  if (params.category) search.set('category', params.category)
  if (params.type) search.set('type', params.type)
  if (params.lang) search.set('lang', params.lang)
  if (params.sort && params.sort !== 'newest') search.set('sort', params.sort)
  if (params.q?.trim()) search.set('q', params.q.trim())
  const qs = search.toString()
  return qs ? `/library?${qs}` : '/library'
}
