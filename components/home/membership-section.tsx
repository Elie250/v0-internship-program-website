import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getMembershipPlans } from '@/lib/platform/queries'
import { HomeSectionHeader } from '@/components/home/home-section-header'
import { loadHomePersonalization } from '@/lib/home/personalization'

const STUDENT_PORTAL_LOGIN = '/auth/login?redirect=%2Fstudent%2Fcourses'
const ENGINEER_SUPPORT = '/auth/login?redirect=%2Fengineering-support'

const DEFAULT_FREE_BENEFITS = [
  'Career guidance & mentorship content',
  'Public webinars & events',
  'Browse free training programmes',
  'Engineer community (read & reply)',
]

const DEFAULT_PREMIUM_BENEFITS = [
  'All paid training, internship & workshop programmes',
  'Human support tickets with SLA',
  'AI technical assistant (PLC, electrical, embedded)',
  'Engineer community — start discussions',
  'Priority enrollment after MoMo receipt review',
  'Certificates on eligible programmes',
]

export async function MembershipSection() {
  const [plans, personalization] = await Promise.all([getMembershipPlans(), loadHomePersonalization()])
  const freePlan = plans.find((p) => p.plan_type === 'free')
  const premiumPlan = plans.find((p) => p.plan_type === 'premium')

  const freeItems =
    freePlan?.benefits?.length && freePlan.benefits.length > 0
      ? freePlan.benefits
      : DEFAULT_FREE_BENEFITS

  const premiumItems =
    premiumPlan?.benefits?.length && premiumPlan.benefits.length > 0
      ? premiumPlan.benefits
      : premiumPlan?.features?.length && premiumPlan.features.length > 0
        ? premiumPlan.features
        : DEFAULT_PREMIUM_BENEFITS

  return (
    <section id="membership" className="home-section home-section--muted">
      <div className="max-w-5xl mx-auto">
        <HomeSectionHeader
          eyebrow="Plans"
          title={personalization?.hasEnrollment ? 'Your access' : 'Free & premium access'}
          description={
            personalization?.hasEnrollment
              ? 'You already have active programme access. Open your portal to continue learning or browse more courses.'
              : 'Start free with career resources and community. Upgrade for full programmes, engineer support, and AI tools.'
          }
        />

        {personalization?.hasEnrollment ? (
          <Card className="border-[var(--brand-navy)]/20 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">You&apos;re enrolled</CardTitle>
              <p className="text-sm text-slate-600">
                {personalization.activeCourses.length} active{' '}
                {personalization.activeCourses.length === 1 ? 'programme' : 'programmes'} on your account.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {personalization.activeCourses.map((course) => (
                  <li key={course.id}>
                    <Link
                      href={course.href}
                      className="text-sm font-medium text-[var(--brand-navy)] underline underline-offset-2"
                    >
                      {course.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link href={personalization.portal.href}>
                  <Button className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
                    Open student portal
                  </Button>
                </Link>
                <Link href="/student/courses?track=training">
                  <Button variant="outline" className="text-slate-800 border-slate-300">
                    Browse more courses
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <PlanCard
            title={freePlan?.name ?? 'Free'}
            items={freeItems}
            ctaLabel="Get started — free"
            ctaUrl={STUDENT_PORTAL_LOGIN}
          />
          <PlanCard
            title={premiumPlan?.name ?? 'Premium'}
            items={premiumItems}
            ctaLabel="Sign in — premium access"
            ctaUrl={STUDENT_PORTAL_LOGIN}
            secondaryCtaLabel="Engineering support plans"
            secondaryCtaUrl={ENGINEER_SUPPORT}
            highlighted
            price={premiumPlan?.price}
            badge="Most complete"
          />
        </div>
        )}

        <p className="text-center text-sm text-slate-600 mt-8">
          Paid programmes use{' '}
          <Link href="/payment-instructions" className="text-[var(--brand-navy)] font-medium underline">
            MTN MoMo verification
          </Link>
          {' '}after enrollment — upload your receipt and our team confirms access.
        </p>
      </div>
    </section>
  )
}

function PlanCard({
  title,
  items,
  ctaLabel,
  ctaUrl,
  secondaryCtaLabel,
  secondaryCtaUrl,
  highlighted,
  price,
  badge,
}: {
  title: string
  items: string[]
  ctaLabel: string
  ctaUrl: string
  secondaryCtaLabel?: string
  secondaryCtaUrl?: string
  highlighted?: boolean
  price?: number | null
  badge?: string
}) {
  return (
    <Card
      className={
        highlighted
          ? 'border-[var(--brand-navy)] shadow-lg bg-white relative overflow-hidden'
          : 'border-slate-200 bg-white'
      }
    >
      {badge && highlighted ? (
        <div className="absolute top-0 right-0 bg-[var(--brand-navy)] text-white text-xs font-semibold px-3 py-1 rounded-bl-lg flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          {badge}
        </div>
      ) : null}
      <CardHeader>
        <CardTitle className="text-2xl text-slate-900">{title}</CardTitle>
        {price != null && price > 0 ? (
          <p className="text-slate-600">Programmes from {price.toLocaleString()} RWF</p>
        ) : highlighted ? (
          <p className="text-slate-600">Pay per programme via MoMo · includes support & AI</p>
        ) : (
          <p className="text-slate-600">No subscription fee</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="h-4 w-4 shrink-0 text-[var(--brand-navy)] mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
        <div className="space-y-2 pt-2">
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
          {secondaryCtaLabel && secondaryCtaUrl ? (
            <Link href={secondaryCtaUrl} className="block">
              <Button variant="ghost" className="w-full text-[var(--brand-navy)] text-sm">
                {secondaryCtaLabel}
              </Button>
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
