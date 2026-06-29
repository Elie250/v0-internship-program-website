import Image from 'next/image'
import { PAYMENT } from '@/lib/company/constants'
import { cn } from '@/lib/utils'

type MomoPayCardProps = {
  className?: string
  amountLabel?: string
  compact?: boolean
}

export function MomoPayCard({ className, amountLabel, compact = false }: MomoPayCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[#FFCC00]/40 bg-[#FFCC00]/10 overflow-hidden',
        className
      )}
    >
      <div className={cn('flex flex-col sm:flex-row', compact ? 'sm:items-center' : '')}>
        <div className={cn('relative bg-[#FFCC00] shrink-0', compact ? 'h-28 sm:w-48' : 'h-36 sm:w-56')}>
          <Image
            src="/images/mtn-momo.png"
            alt="MTN Mobile Money — Just MoMo it"
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 100vw, 224px"
            priority
          />
        </div>
        <div className={cn('p-4 sm:p-5 flex-1 space-y-3', compact ? 'py-3' : '')}>
          {amountLabel ? (
            <p className="text-sm text-slate-600">{amountLabel}</p>
          ) : null}
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">MoMo Pay Code</p>
              <p className="font-bold text-xl text-[var(--brand-navy)] mt-0.5">{PAYMENT.momoPayCode}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Account name</p>
              <p className="font-semibold text-slate-900 mt-0.5">{PAYMENT.accountName}</p>
            </div>
          </div>
          {!compact ? (
            <p className="text-xs text-slate-600">{PAYMENT.workflow}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
