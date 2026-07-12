'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, Bot, Headphones, Home } from 'lucide-react'
import type { SupportAccessSummary } from '@/lib/support/types'
import { EngineerCommunityPanel } from '@/components/engineer/engineer-community'
import { EngineerAiAssistant } from '@/components/engineer/engineer-ai-assistant'
import { FieldNotesArticleCard } from '@/components/engineering/field-notes-article'
import type { EngineeringArticlePublic } from '@/lib/engineering/articles'

export function SubscriberHub({
  initialAccess,
  articles,
}: {
  initialAccess: SupportAccessSummary | null
  articles: EngineeringArticlePublic[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'articles'
  const [userName, setUserName] = useState('')
  const [access, setAccess] = useState<SupportAccessSummary | null>(initialAccess)

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser()
      if (!user?.id) {
        router.push('/auth/login?redirect=/subscriber')
        return
      }
      setUserName(
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Subscriber'
      )
      const res = await fetch('/api/support/subscribe', { credentials: 'same-origin' })
      if (res.ok) setAccess(await res.json())
    }
    void init()
  }, [router])

  const setTab = (value: string) => {
    router.replace(`/subscriber?tab=${value}`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[var(--brand-navy)] text-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Engineering Subscriber Hub</h1>
            <p className="text-sm text-white/80">Welcome, {userName}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="text-white hover:bg-white/15" asChild>
              <Link href="/"><Home className="h-4 w-4 mr-2" />Home</Link>
            </Button>
            <Button variant="ghost" className="text-white hover:bg-white/15" asChild>
              <Link href="/engineering"><BookOpen className="h-4 w-4 mr-2" />Field Notes</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Card className="border-slate-200">
          <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">Your membership</h2>
              {access?.hasActiveSubscription ? (
                <p className="text-sm text-slate-600 mt-1">
                  <strong>{access.subscription?.plan?.name}</strong>
                  {access.planTier === 'free' ? ' (Free)' : ' (Paid)'}
                </p>
              ) : (
                <p className="text-sm text-slate-600 mt-1">
                  Subscribe for community, AI assist, and support tickets.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {access?.hasActiveSubscription ? (
                <Badge className={access.planTier === 'paid' ? 'bg-green-100 text-green-800' : 'bg-slate-200'}>
                  {access.planTier === 'paid' ? 'Paid member' : 'Free member'}
                </Badge>
              ) : null}
              <Button variant="outline" asChild>
                <Link href="/engineering-support">
                  {access?.hasActiveSubscription ? 'Manage plan' : 'Choose a plan'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="bg-white border border-slate-200 flex flex-wrap h-auto">
            <TabsTrigger value="articles"><BookOpen className="h-4 w-4 mr-2" />Field Notes</TabsTrigger>
            <TabsTrigger value="community"><Users className="h-4 w-4 mr-2" />Community</TabsTrigger>
            <TabsTrigger value="ai"><Bot className="h-4 w-4 mr-2" />AI assistant</TabsTrigger>
            <TabsTrigger value="support"><Headphones className="h-4 w-4 mr-2" />Support</TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="space-y-4">
            <p className="text-sm text-slate-600">
              Articles matched to your subscription tier.{' '}
              <Link href="/engineering" className="text-[var(--brand-navy)] underline">Browse all</Link>
              {' · '}
              <Link href="/engineering/authors" className="text-[var(--brand-navy)] underline">Authors</Link>
            </p>
            {articles.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-slate-600">No articles yet.</CardContent></Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5">
                {articles.map((article) => (
                  <FieldNotesArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="community">
            <EngineerCommunityPanel access={access} />
          </TabsContent>

          <TabsContent value="ai">
            <EngineerAiAssistant access={access} />
          </TabsContent>

          <TabsContent value="support">
            <Card>
              <CardContent className="py-8 space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Human engineer support</h3>
                {access?.canSubmitTicket ? (
                  <>
                    <p className="text-sm text-slate-600">
                      Paid plans include engineer-reviewed tickets with SLA response times.
                    </p>
                    <Button asChild className="bg-[var(--brand-navy)] text-white">
                      <Link href="/engineering-support">Open support portal</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-600">
                      Support tickets require a paid plan. Free members can use community and limited AI.
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/engineering-support">Upgrade plan</Link>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
