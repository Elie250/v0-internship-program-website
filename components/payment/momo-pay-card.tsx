import Image from 'next/image'
import { PAYMENT } from '@/lib/company/constants'
import { cn } from '@/lib/utils'

type MomoPayCardProps = {
  className?: string
  amountLabel?: string
  compact?: boolean
  momoPayCode?: string
  accountName?: string
  workflow?: string
}

export function MomoPayCard({
  className,
  amountLabel,
  compact = false,
  momoPayCode = PAYMENT.momoPayCode,
  accountName = PAYMENT.accountName,
  workflow = PAYMENT.workflow,
}: MomoPayCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[#FFCC00]/40 bg-[#FFCC00]/10 overflow-hidden',
        className
      )}
    >
      <div className={cn('flex flex-col sm:flex-row', compact ? 'sm:items-stretch' : '')}>
        <div
          className={cn(
            'relative bg-[#FFCC00] shrink-0 mx-auto sm:mx-0',
            compact ? 'h-44 w-44 sm:h-40 sm:w-40' : 'h-52 w-52 sm:h-56 sm:w-56'
          )}
        >
          <Image
            src="/images/mtn-momo.png"
            alt="MTN Mobile Money — Just MoMo it"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 224px, 224px"
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
              <p className="font-bold text-xl text-[var(--brand-navy)] mt-0.5">{momoPayCode}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Account name</p>
              <p className="font-semibold text-slate-900 mt-0.5">{accountName}</p>
            </div>
          </div>
          {!compact ? (
            <p className="text-xs text-slate-600">{workflow}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
