import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PaymentCtaSection() {
  return (
    <section className="py-12 px-4 bg-white border-t border-slate-100">
      <div className="max-w-3xl mx-auto text-center">
        <div className="relative mx-auto mb-4 h-24 w-full max-w-sm rounded-xl overflow-hidden bg-[#FFCC00]">
          <Image
            src="/images/mtn-momo.png"
            alt="MTN Mobile Money — Just MoMo it"
            fill
            className="object-contain p-2"
            sizes="384px"
          />
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
