'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { EngineerPageFrame } from '@/components/engineer/engineer-page-frame'
import { EngineerMembershipCard } from '@/components/engineer/engineer-membership-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { SupportAccessSummary } from '@/lib/support/types'

export default function EngineerSupportPage() {
  const [access, setAccess] = useState<SupportAccessSummary | null>(null)

  useEffect(() => {
    void fetch('/api/support/subscribe', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setAccess)
  }, [])

  return (
    <EngineerPageFrame title="Human support" description="Engineer-reviewed tickets">
      <div className="space-y-6 max-w-3xl">
        <EngineerMembershipCard access={access} compact />
        <Card>
          <CardContent className="py-8 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Engineer support tickets</h3>
            {access?.canSubmitTicket ? (
              <>
                <p className="text-sm text-slate-600">
                  Paid plans include human engineer review with SLA response times. Open and track
                  tickets on the support portal.
                </p>
                <ul className="text-sm text-slate-600 space-y-1 list-disc pl-5">
                  <li>Submit wiring, PLC, or site troubleshooting questions</li>
                  <li>Track status and engineer responses</li>
                  <li>Attach context from your field work</li>
                </ul>
                <Button asChild className="bg-[var(--brand-navy)] text-white">
                  <Link href="/engineering-support">Open support portal</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  Support tickets require a paid plan. Free members can still use the community
                  forum and AI assistant.
                </p>
                <Button asChild variant="outline">
                  <Link href="/engineering-support">View support plans</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </EngineerPageFrame>
  )
}
