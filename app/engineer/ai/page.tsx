'use client'

import { useEffect, useState } from 'react'
import { EngineerPageFrame } from '@/components/engineer/engineer-page-frame'
import { EngineerMembershipCard } from '@/components/engineer/engineer-membership-card'
import { EngineerAiAssistant } from '@/components/engineer/engineer-ai-assistant'
import type { SupportAccessSummary } from '@/lib/support/types'

export default function EngineerAiPage() {
  const [access, setAccess] = useState<SupportAccessSummary | null>(null)

  useEffect(() => {
    void fetch('/api/support/subscribe', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setAccess)
  }, [])

  return (
    <EngineerPageFrame title="AI assistant" description="Practical engineering help">
      <div className="space-y-6 max-w-4xl">
        <EngineerMembershipCard access={access} compact />
        <EngineerAiAssistant access={access} />
      </div>
    </EngineerPageFrame>
  )
}
