import Link from 'next/link'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { COMPANY, PAYMENT } from '@/lib/company/constants'
import { CheckCircle2, Smartphone } from 'lucide-react'

export default function PaymentInstructionsPage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-[#1e3a5f] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-3">Payment Instructions</h1>
          <p className="text-white/85 text-lg">
            {COMPANY.brandName} uses manual payment verification—pay via MTN MoMo, then submit your
            receipt for admin approval. No online payment gateway.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <Card className="border-[#1e3a5f]/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Smartphone className="h-6 w-6 text-[#1e3a5f]" />
              <CardTitle>{PAYMENT.method}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm text-muted-foreground">MoMo Pay Code</p>
              <p className="text-3xl font-bold tracking-wide text-[#1e3a5f]">{PAYMENT.momoPayCode}</p>
              <p className="text-sm">
                Account name: <strong>{PAYMENT.accountName}</strong>
              </p>
            </div>
            <p className="text-sm text-muted-foreground">{PAYMENT.workflow}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step-by-step</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {PAYMENT.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1e3a5f] text-white text-xs flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
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
                <a href={`tel:${COMPANY.phone}`} className="underline font-medium">
                  {COMPANY.phoneDisplay}
                </a>{' '}
                or email{' '}
                <a href={`mailto:${COMPANY.email}`} className="underline font-medium">
                  {COMPANY.email}
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
            <Button variant="outline">Create an account</Button>
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
