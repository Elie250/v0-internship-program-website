'use client'

import { useEffect } from 'react'

export function ArticleViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `fn-view-${slug}`
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    void fetch(`/api/engineering/articles/${slug}/view`, { method: 'POST' })
  }, [slug])

  return null
}
