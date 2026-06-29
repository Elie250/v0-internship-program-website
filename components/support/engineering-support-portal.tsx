'use client'

import { SupportPlanCards, SupportSubscribePanel } from '@/components/support/support-subscribe-panel'
import {
  MySupportTickets,
  SupportAccessBanner,
  SupportTicketForm,
} from '@/components/support/support-ticket-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { SupportAccessSummary, SupportSubscriptionPlan } from '@/lib/support/types'

interface Category {
  id: string
  name: string
}

export function EngineeringSupportPortal({
  categories,
  plans,
  access,
  isLoggedIn,
  selectedPlan,
  onSelectPlan,
  onSubscriptionChange,
}: {
  categories: Category[]
  plans: SupportSubscriptionPlan[]
  access: SupportAccessSummary | null
  isLoggedIn: boolean
  selectedPlan: SupportSubscriptionPlan | null
  onSelectPlan: (plan: SupportSubscriptionPlan) => void
  onSubscriptionChange?: () => void
}) {
  const showSubscribe = !access?.hasActiveSubscription && access?.subscription?.status !== 'payment_pending_review'

  return (
    <div className="space-y-8">
      <SupportAccessBanner access={access} />

      {showSubscribe ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Support plans</h2>
            <p className="text-sm text-slate-600 mt-1">
              Pay via MTN MoMo, upload your receipt, and an admin will activate your subscription.
            </p>
          </div>
          <SupportPlanCards
            plans={plans}
            selectedPlanId={selectedPlan?.id}
            onSelect={onSelectPlan}
          />
          <SupportSubscribePanel
            plan={selectedPlan}
            isLoggedIn={isLoggedIn}
            onSuccess={onSubscriptionChange}
          />
        </section>
      ) : null}

      <section className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-slate-900">Support categories</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              {categories.length === 0 ? (
                <p>Categories will appear once configured by an administrator.</p>
              ) : (
                categories.map((cat) => <p key={cat.id}>• {cat.name}</p>)
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-slate-900">How it works</CardTitle></CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <p>1. Choose a plan and pay via MoMo</p>
              <p>2. Admin verifies your receipt</p>
              <p>3. Submit engineering help requests</p>
              <p>4. Track status and engineer responses</p>
            </CardContent>
          </Card>
          {isLoggedIn ? <MySupportTickets /> : null}
        </div>
        <div className="md:col-span-2">
          <SupportTicketForm categories={categories} access={access} />
        </div>
      </section>
    </div>
  )
}
