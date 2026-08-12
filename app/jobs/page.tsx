import Link from 'next/link'
import { COMPANY } from '@/lib/company/constants'

export const metadata = {
  title: `Talent — ${COMPANY.brandName}`,
  description: 'Energy & Logics Talent — multi-employer recruitment and technical screening platform.',
}

export default function JobsLandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-16 space-y-8">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-navy)]">
          Energy &amp; Logics Talent
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Recruitment &amp; technical screening for employers
        </h1>
        <p className="text-slate-700 leading-relaxed">
          A multi-tenant talent platform operated by {COMPANY.brandName}. Employers publish roles and
          screen candidates; candidates keep one reusable account across organizations. Job board
          and screening launch in later phases.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/jobs/auth/continue"
            className="inline-flex items-center rounded-md bg-[var(--brand-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Continue with Email
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Candidate app
          </Link>
          <Link
            href="/employer"
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Employer portal
          </Link>
        </div>
        <p className="text-xs text-slate-500 pt-8 border-t border-slate-200">
          Powered by {COMPANY.brandName} · {COMPANY.publicSiteUrl.replace(/^https?:\/\//, '')}
        </p>
      </div>
    </main>
  )
}
