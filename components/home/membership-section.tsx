import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getMembershipPlans } from '@/lib/platform/queries'

export async function MembershipSection() {
  const plans = await getMembershipPlans()
  const freePlan = plans.find((p) => p.plan_type === 'free')
  const premiumPlan = plans.find((p) => p.plan_type === 'premium')

  return (
    <section className="py-16 px-4 bg-slate-50/80">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        <PlanCard
          title={freePlan?.name ?? 'Free Plan'}
          items={freePlan?.benefits?.length ? freePlan.benefits : ['Mentorship', 'Career Guidance', 'Webinar']}
          ctaLabel={freePlan?.cta_label ?? 'Register Free'}
          ctaUrl={freePlan?.cta_url ?? '/auth/register'}
        />
        <PlanCard
          title={premiumPlan?.name ?? 'Premium Plan'}
          items={
            premiumPlan?.benefits?.length
              ? premiumPlan.benefits
              : ['Trainings', 'Internship', 'Engineering Support', 'Workshop']
          }
          ctaLabel={premiumPlan?.cta_label ?? 'Upgrade to Premium'}
          ctaUrl={premiumPlan?.cta_url ?? '/auth/register'}
          highlighted
          price={premiumPlan?.price}
        />
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
    <Card className={highlighted ? 'border-[#1e3a5f] shadow-lg' : ''}>
      <CardHeader>
        <CardTitle className="text-2xl text-[#1e3a5f]">{title}</CardTitle>
        {price != null && price > 0 && (
          <p className="text-muted-foreground">From {price.toLocaleString()} RWF</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-[#1e3a5f]" />
              {item}
            </li>
          ))}
        </ul>
        <Link href={ctaUrl}>
          <Button className={highlighted ? 'w-full bg-[#1e3a5f] hover:bg-[#1e3a5f]/90' : 'w-full'} variant={highlighted ? 'default' : 'outline'}>
            {ctaLabel}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
