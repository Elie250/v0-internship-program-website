'use client'

import { Suspense } from 'react'
import { ShopLoginForm } from '@/components/shop-portal/shop-login-form'
import { ShopLanguageSelector } from '@/components/shop-portal/shop-language-selector'
import { useShopT } from '@/components/shop-portal/shop-i18n-provider'

export function ShopLoginScreen() {
  const t = useShopT()

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-end">
          <ShopLanguageSelector compact />
        </div>
        <div className="text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t('brand.short')}
          </p>
          <h1 className="text-2xl font-semibold text-[var(--brand-navy,#1e3a5f)]">
            {t('auth.title')}
          </h1>
          <p className="text-sm text-slate-600">{t('auth.subtitle')}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Suspense fallback={<p className="text-sm text-slate-500">{t('common.loading')}</p>}>
            <ShopLoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
