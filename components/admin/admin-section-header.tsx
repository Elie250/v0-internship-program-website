import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AdminSectionHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'rounded-xl border border-slate-200 bg-white px-4 py-4 md:px-6 md:py-5 shadow-sm',
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-navy)]">
            Admin console
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">{title}</h1>
          {description ? <p className="text-sm text-slate-800 font-medium max-w-3xl">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2 shrink-0">{actions}</div> : null}
      </div>
    </header>
  )
}

export function adminStatusClass(status: string) {
  const map: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    pending_approval: 'bg-amber-100 text-amber-950 border-amber-200',
    inactive: 'bg-slate-200 text-slate-800 border-slate-300',
    suspended: 'bg-red-100 text-red-900 border-red-200',
    admitted: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    payment_pending_review: 'bg-amber-100 text-amber-950 border-amber-200',
    payment_rejected: 'bg-red-100 text-red-900 border-red-200',
    published: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    draft: 'bg-slate-100 text-slate-800 border-slate-200',
  }
  return map[status] ?? 'bg-slate-100 text-slate-800 border-slate-200'
}
