import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PaymentCtaSection() {
  return (
    <section className="py-12 px-4 bg-white border-t border-slate-100">
      <div className="max-w-3xl mx-auto text-center">
        <div className="relative mx-auto mb-6 h-44 w-44 sm:h-52 sm:w-52 rounded-xl overflow-hidden bg-[#FFCC00] shadow-sm">
          <Image
            src="/images/mtn-momo.png"
            alt="MTN Mobile Money — Just MoMo it"
            fill
            className="object-cover"
            sizes="208px"
          />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Pay with MTN MoMo</h2>
        <p className="text-slate-600 mb-6 max-w-lg mx-auto">
          Paid programmes use manual MoMo verification — pay, upload your receipt, and our team confirms your enrollment.
        </p>

        <div className="mb-8 inline-flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-left">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600/10">
            <Globe className="h-5 w-5 text-indigo-700" />
          </span>
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
              IremboPay
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                <Clock className="h-3 w-3" />
                Coming soon
              </span>
            </p>
            <p className="text-xs text-indigo-800/80">
              Instant checkout with MTN MoMo, Airtel Money, and international cards — launching soon.
            </p>
          </div>
        </div>

        <div className="flex justify-center">
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
      </div>
    </section>
  )
}
