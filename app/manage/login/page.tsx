import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { ShopLoginForm } from '@/components/shop-portal/shop-login-form'
import {
  getShopPortalSession,
  isCurrentRequestShopHost,
} from '@/lib/shop/portal-session'
import { sanitizeShopReturnPath } from '@/lib/shop/safe-return-path'

export const metadata: Metadata = {
  title: 'Staff Sign In | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default async function ShopManageLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const onShopHost = await isCurrentRequestShopHost()
  if (!onShopHost) {
    redirect('/auth/login')
  }

  const session = await getShopPortalSession()
  const params = await searchParams
  const rawReturn =
    typeof params.returnTo === 'string'
      ? params.returnTo
      : Array.isArray(params.returnTo)
        ? params.returnTo[0]
        : undefined
  const returnTo = sanitizeShopReturnPath(rawReturn)

  if (session) {
    redirect(returnTo)
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Energy &amp; Logics
          </p>
          <h1 className="text-2xl font-semibold text-[var(--brand-navy,#1e3a5f)]">
            Shop staff sign in
          </h1>
          <p className="text-sm text-slate-600">
            Sign in with your Energy &amp; Logics staff account to access POS and inventory.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
            <ShopLoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
