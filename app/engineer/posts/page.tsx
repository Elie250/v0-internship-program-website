'use client'

import { EngineerPageFrame } from '@/components/engineer/engineer-page-frame'
import { EngineerPostsPanel } from '@/components/engineer/engineer-posts-panel'
import { useEffect, useState } from 'react'

export default function EngineerPostsPage() {
  const [authorId, setAuthorId] = useState<string | null>(null)

  useEffect(() => {
    void fetch('/api/engineer/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.id) setAuthorId(String(data.id))
      })
      .catch(() => {})
  }, [])

  return (
    <EngineerPageFrame
      title="Public posts"
      description="Share updates on your profile"
    >
      <div className="max-w-2xl">
        {authorId ? (
          <EngineerPostsPanel authorId={authorId} />
        ) : (
          <p className="text-sm text-slate-500">Loading…</p>
        )}
      </div>
    </EngineerPageFrame>
  )
}
