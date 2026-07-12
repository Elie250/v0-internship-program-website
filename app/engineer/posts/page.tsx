'use client'

import { EngineerPageFrame } from '@/components/engineer/engineer-page-frame'
import { EngineerPostsPanel } from '@/components/engineer/engineer-posts-panel'

export default function EngineerPostsPage() {
  return (
    <EngineerPageFrame
      title="Public posts"
      description="Share updates on your profile"
    >
      <div className="max-w-2xl">
        <EngineerPostsPanel isSignedIn />
      </div>
    </EngineerPageFrame>
  )
}
