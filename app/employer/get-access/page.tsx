import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TalentShell } from '@/components/recruitment/talent-ui'

export const metadata = {
  title: 'Hiring access',
}

export default function EmployerGetAccessPage() {
  return (
    <TalentShell
      title="Your account is ready"
      subtitle="Hiring access is granted by Energy & Logics or an existing company admin. Creating an account does not open a company workspace on its own."
    >
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5">
        <p className="text-sm text-slate-600 leading-relaxed">
          If your company already uses this platform, ask a company admin to add your email. If you
          are setting up a new hiring partner, Energy &amp; Logics will create and activate the
          company workspace, then invite you.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/app">
            <Button variant="outline" className="rounded-xl">
              Continue as a candidate
            </Button>
          </Link>
          <Link href="/jobs">
            <Button className="rounded-xl bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-deep)]">
              Browse jobs
            </Button>
          </Link>
        </div>
      </div>
    </TalentShell>
  )
}
