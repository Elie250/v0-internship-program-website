'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Bookmark } from 'lucide-react'

export function ArticleBookmarkButton({
  articleId,
  initialBookmarked = false,
}: {
  articleId: string
  initialBookmarked?: boolean
}) {
  const router = useRouter()
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setBookmarked(initialBookmarked)
  }, [initialBookmarked])

  const toggle = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/engineering/engagements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          articleId,
          action: bookmarked ? 'unbookmark' : 'bookmark',
        }),
      })
      if (res.status === 401) {
        router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`)
        return
      }
      const data = await res.json()
      if (res.ok) setBookmarked(Boolean(data.bookmarked))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void toggle()}
      disabled={loading}
      className={bookmarked ? 'border-amber-300 bg-amber-50 text-amber-900' : ''}
    >
      <Bookmark className={`h-4 w-4 mr-2 ${bookmarked ? 'fill-current' : ''}`} />
      {bookmarked ? 'Saved' : 'Save article'}
    </Button>
  )
}
