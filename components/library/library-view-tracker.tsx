'use client'

import { useEffect } from 'react'

export function LibraryViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    void fetch(`/api/library/${encodeURIComponent(slug)}/view`, { method: 'POST' }).catch(() => {})
  }, [slug])

  return null
}
