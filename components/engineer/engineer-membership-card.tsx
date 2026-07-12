'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SupportAccessSummary } from '@/lib/support/types'

export function EngineerMembershipCard({
  access,
  compact = false,
}: {
  access: SupportAccessSummary | null
  compact?: boolean
}) {
  return (
    <Card className={compact ? 'border-slate-200' : 'border-slate-200 bg-gradient-to-r from-slate-50 to-white'}>
      <CardContent className={compact ? 'py-4' : 'pt-6 flex flex-wrap items-center justify-between gap-4'}>
        <div>
          <h2 className={compact ? 'text-base font-semibold text-slate-900' : 'text-xl font-semibold text-slate-900'}>
            Your membership
          </h2>
          {access?.hasActiveSubscription ? (
            <p className="text-sm text-slate-600 mt-1">
              <strong>{access.subscription?.plan?.name}</strong>
              {access.planTier === 'free' ? ' (Free)' : ' (Paid)'}
              {access.subscription?.ends_at
                ? ` · until ${new Date(access.subscription.ends_at).toLocaleDateString()}`
                : ''}
            </p>
          ) : (
            <p className="text-sm text-slate-600 mt-1">
              Join the free community plan or upgrade for tickets, AI, and posting.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {access?.hasActiveSubscription ? (
            <Badge
              className={
                access.planTier === 'paid' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-800'
              }
            >
              {access.planTier === 'paid' ? 'Paid member' : 'Free member'}
            </Badge>
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <Link href="/subscriber">Subscriber hub</Link>
          </Button>
          <Button size="sm" className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90" asChild>
            <Link href="/engineering-support">
              {access?.hasActiveSubscription ? 'Manage plan' : 'Choose a plan'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
