'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'

function TrackSubmitButton() {
  const t = useShopT()
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-[var(--brand-navy,#1e3a5f)] text-white hover:bg-[var(--brand-navy,#1e3a5f)]/90 sm:w-auto"
    >
      {pending ? t('storefront.track.loading') : t('storefront.nav.track')}
    </Button>
  )
}

export function StorefrontTrackHeader() {
  const t = useShopT()

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        {t('storefront.track.heading')}
      </h1>
      <p className="mt-3 text-base leading-relaxed text-slate-600">{t('storefront.track.body')}</p>
    </div>
  )
}

export function StorefrontTrackNotFound() {
  const t = useShopT()

  return (
    <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950">
      {t('storefront.track.notFound')}
    </p>
  )
}

export function StorefrontTrackForm({ defaultOrder = '' }: { defaultOrder?: string }) {
  const t = useShopT()

  return (
    <form action="/track" method="get" className="mt-8 space-y-4">
      <div>
        <Label htmlFor="order">{t('storefront.track.orderNumber')}</Label>
        <Input
          id="order"
          name="order"
          required
          defaultValue={defaultOrder}
          autoComplete="off"
          spellCheck={false}
          placeholder="EL-NYZ-20260827-0001"
          className="mt-1 font-mono"
        />
        <p className="mt-2 text-xs text-slate-500">{t('storefront.track.example')}</p>
      </div>
      <TrackSubmitButton />
    </form>
  )
}
