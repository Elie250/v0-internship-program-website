import type { Metadata } from 'next'

/**
 * Minimal Shop Management landing for Phase 1C.1 host-routing proof.
 * Full portal shell and auth arrive in later 1C commits.
 */
export const metadata: Metadata = {
  title: 'Shop Management | Energy & Logics',
  description: 'Energy & Logics Shop Management Platform',
  robots: { index: false, follow: false },
}

export default function ShopManageLandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-6">
      <div className="max-w-lg w-full space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Energy &amp; Logics
        </p>
        <h1 className="text-2xl font-semibold text-[var(--brand-navy,#1e3a5f)]">
          Shop Management Platform
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Staff portal for POS, inventory, and sales. Host routing is active. Sign-in and
          operations screens will be enabled in the next setup steps.
        </p>
        <p className="text-xs text-slate-500">
          Customer storefront remains on the main site at <code className="font-mono">/shop</code>.
        </p>
      </div>
    </main>
  )
}
