import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MomoPayCard } from '@/components/payment/momo-pay-card'
import { loadPublicCompanyProfile } from '@/lib/platform/site-settings'
import { PAYMENT } from '@/lib/company/constants'
import { CheckCircle2 } from 'lucide-react'

export default async function PaymentInstructionsPage() {
  const profile = await loadPublicCompanyProfile()

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="text-on-dark bg-[var(--brand-navy)] py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">Payment Instructions</h1>
          <p className="text-white/85 text-lg">
            {profile.brandName} uses manual payment verification—pay via MTN MoMo, then submit your
            receipt for admin approval. No online payment gateway.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <Card className="border-[#1e3a5f]/20">
          <CardHeader>
            <CardTitle>{profile.payment.method}</CardTitle>
          </CardHeader>
          <CardContent>
            <MomoPayCard
              momoPayCode={profile.payment.momoPayCode}
              accountName={profile.payment.accountName}
              workflow={profile.payment.workflow}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step-by-step</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {PAYMENT.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-slate-800">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step.replace('4402091', profile.payment.momoPayCode)}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6 flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-900 space-y-2">
              <p className="font-semibold">After you pay</p>
              <p>
                Our admin team will review your receipt visually and confirm your enrollment.
                Questions? Call{' '}
                <a href={`tel:${profile.phone}`} className="underline font-medium">
                  {profile.phoneDisplay}
                </a>{' '}
                or email{' '}
                <a href={`mailto:${profile.email}`} className="underline font-medium">
                  {profile.email}
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Link href="/apply">
            <Button className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">Apply for a programme</Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="outline" className="text-slate-800">Create an account</Button>
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
