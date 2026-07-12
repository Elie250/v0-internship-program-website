'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { EngineerPageFrame } from '@/components/engineer/engineer-page-frame'
import { EngineerMembershipCard } from '@/components/engineer/engineer-membership-card'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SupportAccessSummary } from '@/lib/support/types'
import {
  Bot,
  BookOpen,
  Calculator,
  Headphones,
  PenLine,
  Sparkles,
  Users,
} from 'lucide-react'

const quickLinks = [
  {
    href: '/engineer/community',
    title: 'Community',
    description: 'Discuss field fixes and share knowledge with other engineers.',
    icon: Users,
    color: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  {
    href: '/engineer/ai',
    title: 'AI assistant',
    description: 'Get quick answers on wiring, PLC, and troubleshooting.',
    icon: Bot,
    color: 'bg-violet-50 text-violet-700 border-violet-100',
  },
  {
    href: '/engineer/support',
    title: 'Human support',
    description: 'Open engineer-reviewed tickets on paid plans.',
    icon: Headphones,
    color: 'bg-amber-50 text-amber-800 border-amber-100',
  },
  {
    href: '/engineer/field-notes',
    title: 'Field Notes',
    description: 'Draft practical articles for the public blog.',
    icon: PenLine,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    href: '/engineer/tools',
    title: 'Engineering tools',
    description: 'Calculators for electrical, PLC, solar, and more.',
    icon: Calculator,
    color: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  {
    href: '/subscriber',
    title: 'Subscriber hub',
    description: 'Saved articles, recommendations, and digest preferences.',
    icon: Sparkles,
    color: 'bg-rose-50 text-rose-700 border-rose-100',
  },
]

export default function EngineerDashboardPage() {
  const [access, setAccess] = useState<SupportAccessSummary | null>(null)
  const [articleCount, setArticleCount] = useState(0)

  useEffect(() => {
    void Promise.all([
      fetch('/api/support/subscribe', { credentials: 'same-origin' }).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch('/api/engineer/articles', { credentials: 'same-origin' }).then((r) =>
        r.ok ? r.json() : []
      ),
    ]).then(([accessData, articles]) => {
      setAccess(accessData)
      setArticleCount(Array.isArray(articles) ? articles.length : 0)
    })
  }, [])

  return (
    <EngineerPageFrame
      title="Overview"
      description="Your engineering workspace"
    >
      <div className="space-y-6 max-w-5xl">
        <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6">
          <h2 className="text-xl font-bold text-slate-900">Engineer Community Hub</h2>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Community discussions, AI assist, support tickets, Field Notes authoring, and
            calculators — all in one place. Use the sidebar to jump between sections.
          </p>
        </div>

        <EngineerMembershipCard access={access} />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-slate-200">
            <CardContent className="pt-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Plan</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">
                {access?.hasActiveSubscription
                  ? access.subscription?.plan?.name ?? 'Active'
                  : 'Not subscribed'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Community posts</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">
                {access?.canPostCommunity ? 'Enabled' : 'Upgrade to post'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Support tickets</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">
                {access?.canSubmitTicket ? 'Available' : 'Paid plans only'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">Your drafts</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">{articleCount}</p>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Quick access</h3>
            <Link href="/engineering" className="text-sm text-[var(--brand-navy)] underline">
              Public Field Notes
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl border bg-white p-5 hover:shadow-md transition-shadow no-underline"
                >
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border ${item.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-semibold text-slate-900 mt-3">{item.title}</p>
                  <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                </Link>
              )
            })}
          </div>
        </section>

        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="py-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-[var(--brand-navy)]" />
              <div>
                <p className="font-medium text-slate-900">New to the hub?</p>
                <p className="text-sm text-slate-600">
                  Start with Community, try the AI assistant, or browse calculators in Tools.
                </p>
              </div>
            </div>
            <Badge variant="outline">Engineer portal</Badge>
          </CardContent>
        </Card>
      </div>
    </EngineerPageFrame>
  )
}
