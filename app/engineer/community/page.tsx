'use client'

import { useEffect, useState } from 'react'
import { EngineerPageFrame } from '@/components/engineer/engineer-page-frame'
import { EngineerMembershipCard } from '@/components/engineer/engineer-membership-card'
import { EngineerCommunityPanel } from '@/components/engineer/engineer-community'
import type { SupportAccessSummary } from '@/lib/support/types'

export default function EngineerCommunityPage() {
  const [access, setAccess] = useState<SupportAccessSummary | null>(null)

  useEffect(() => {
    void fetch('/api/support/subscribe', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setAccess)
  }, [])

  return (
    <EngineerPageFrame title="Community" description="Discuss with fellow engineers">
      <div className="space-y-6 max-w-4xl">
        <EngineerMembershipCard access={access} compact />
        <EngineerCommunityPanel access={access} />
      </div>
    </EngineerPageFrame>
  )
}
