'use client'

import { useShopT } from '@/components/shop-portal/shop-i18n-provider'

export function ShopPageHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mb-6 space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand-navy,#1e3a5f)]">
        {title}
      </h1>
      <p className="max-w-2xl text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  )
}

export function ShopPlaceholderPanel({
  title,
  body,
  phaseHint,
}: {
  title: string
  body: string
  phaseHint: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-medium text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{body}</p>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-400">
        {phaseHint}
      </p>
    </div>
  )
}

export function ShopForbiddenPanel() {
  const t = useShopT()
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
      <h2 className="text-base font-medium text-amber-950">{t('forbidden.title')}</h2>
      <p className="mt-2 text-sm text-amber-900/80 leading-relaxed">{t('forbidden.body')}</p>
    </div>
  )
}
