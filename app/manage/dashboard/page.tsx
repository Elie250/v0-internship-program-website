import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  isCurrentRequestShopHost,
  requireShopPortalSession,
} from '@/lib/shop/portal-session'
import { ShopLogoutButton } from '@/components/shop-portal/shop-logout-button'

export const metadata: Metadata = {
  title: 'Dashboard | Energy & Logics Shop',
  robots: { index: false, follow: false },
}

export default async function ShopManageDashboardPage() {
  const onShopHost = await isCurrentRequestShopHost()
  if (!onShopHost) {
    redirect('/dashboard')
  }

  const session = await requireShopPortalSession('/dashboard')
  const { user } = session

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Energy &amp; Logics Shop
            </p>
            <h1 className="text-xl font-semibold text-[var(--brand-navy,#1e3a5f)]">Dashboard</h1>
            <p className="text-sm text-slate-600">
              {user.firstName} {user.lastName} · {user.email} · {user.role}
            </p>
          </div>
          <ShopLogoutButton />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-medium text-slate-900">Authenticated</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Staff web authentication is active. POS, products, inventory, and sales screens will be
            added in the next portal phases. Your permissions are enforced on the server for every
            staff API.
          </p>
          <ul className="mt-4 text-sm text-slate-700 list-disc pl-5 space-y-1">
            {user.permissions
              .filter((p) => p.startsWith('shop:'))
              .map((permission) => (
                <li key={permission}>
                  <code className="font-mono text-xs">{permission}</code>
                </li>
              ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/manage">Portal home</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
