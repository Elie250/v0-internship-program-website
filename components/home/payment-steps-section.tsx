import Link from 'next/link'
import { Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { COMPANY, PAYMENT } from '@/lib/company/constants'

export function PaymentStepsSection() {
  return (
    <section className="py-16 px-4 bg-white border-t border-slate-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-navy)] mb-2">
            Payment
          </p>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">How to pay with MTN MoMo</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Paid programmes require MoMo payment and receipt upload after you log in. Free programmes
            skip this step — enroll and access materials immediately.
          </p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-[var(--brand-navy)]" />
              <CardTitle className="text-xl text-slate-900">{PAYMENT.method}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">MoMo Pay Code</p>
                <p className="text-2xl font-bold text-[var(--brand-navy)] mt-1">{PAYMENT.momoPayCode}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Account name</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{PAYMENT.accountName}</p>
              </div>
            </div>

            <ol className="space-y-3 text-sm text-slate-700 list-decimal list-inside">
              {PAYMENT.steps.map((step) => (
                <li key={step} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>

            <p className="text-sm text-slate-600">
              Questions? Call{' '}
              <a href={`tel:${COMPANY.phone}`} className="text-[var(--brand-navy)] font-medium underline">
                {COMPANY.phoneDisplay}
              </a>{' '}
              or email{' '}
              <a href={`mailto:${COMPANY.email}`} className="text-[var(--brand-navy)] font-medium underline">
                {COMPANY.email}
              </a>
              .
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/auth/login?redirect=%2Fstudent%2Fcourses">
                <Button className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
                  Log in to enroll & pay
                </Button>
              </Link>
              <Link href="/payment-instructions">
                <Button variant="outline" className="text-slate-800 border-slate-300">
                  Full payment instructions
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
