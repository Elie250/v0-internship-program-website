import Link from 'next/link'
import { ArrowRight, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PaymentCtaSection() {
  return (
    <section className="py-12 px-4 bg-white border-t border-slate-100">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--brand-navy)]/10 mb-4">
          <Smartphone className="h-6 w-6 text-[var(--brand-navy)]" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Pay with MTN MoMo</h2>
        <p className="text-slate-600 mb-6 max-w-lg mx-auto">
          Paid programmes use manual MoMo verification — pay, upload your receipt, and our team confirms your enrollment.
        </p>
        <Link href="/payment-instructions">
          <Button
            size="lg"
            className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90 h-12 px-8"
          >
            View payment steps
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  )
}
