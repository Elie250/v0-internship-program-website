import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getMembershipPlans } from '@/lib/platform/queries'

const STUDENT_PORTAL_LOGIN = '/auth/login?redirect=%2Fstudent%2Fcourses'

export async function MembershipSection() {
  const plans = await getMembershipPlans()
  const freePlan = plans.find((p) => p.plan_type === 'free')
  const premiumPlan = plans.find((p) => p.plan_type === 'premium')

  return (
    <section className="py-16 px-4 bg-slate-50/80 border-t border-slate-100">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-navy)] mb-2">
            Plans
          </p>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Free & premium access</h2>
          <p className="text-slate-600">
            Log in with your student account to enroll. Choose free career resources or premium
            training and internship programmes from the portal.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <PlanCard
            title={freePlan?.name ?? 'Free Plan'}
            items={
              freePlan?.benefits?.length
                ? freePlan.benefits
                : ['Mentorship', 'Career guidance', 'Public webinars']
            }
            ctaLabel="Log in — free programmes"
            ctaUrl={STUDENT_PORTAL_LOGIN}
          />
          <PlanCard
            title={premiumPlan?.name ?? 'Premium Plan'}
            items={
              premiumPlan?.benefits?.length
                ? premiumPlan.benefits
                : ['Training', 'Internship', 'Engineering support', 'Workshops']
            }
            ctaLabel="Log in — premium programmes"
            ctaUrl={STUDENT_PORTAL_LOGIN}
            highlighted
            price={premiumPlan?.price}
          />
        </div>
      </div>
    </section>
  )
}

function PlanCard({
  title,
  items,
  ctaLabel,
  ctaUrl,
  highlighted,
  price,
}: {
  title: string
  items: string[]
  ctaLabel: string
  ctaUrl: string
  highlighted?: boolean
  price?: number | null
}) {
  return (
    <Card
      className={
        highlighted
          ? 'border-[var(--brand-navy)] shadow-lg bg-white'
          : 'border-slate-200 bg-white'
      }
    >
      <CardHeader>
        <CardTitle className="text-2xl text-slate-900">{title}</CardTitle>
        {price != null && price > 0 ? (
          <p className="text-slate-600">From {price.toLocaleString()} RWF</p>
        ) : (
          <p className="text-slate-600">No subscription fee — pay per programme</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
              <Check className="h-4 w-4 shrink-0 text-[var(--brand-navy)]" />
              {item}
            </li>
          ))}
        </ul>
        <Link href={ctaUrl} className="block">
          <Button
            className={
              highlighted
                ? 'w-full bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90'
                : 'w-full text-slate-800 border-slate-300'
            }
            variant={highlighted ? 'default' : 'outline'}
          >
            {ctaLabel}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
