import Link from 'next/link'
import { TalentShell } from '@/components/recruitment/talent-ui'

export const metadata = {
  title: 'Create an account',
}

export default function RegisterChoicePage() {
  return (
    <TalentShell title="Create an account" subtitle="How will you use the platform?">
      <div className="mx-auto max-w-2xl grid sm:grid-cols-2 gap-4">
        <Link
          href="/jobs/register/candidate"
          className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-[var(--brand-navy)]/30 hover:shadow-sm transition-all"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]">
            Candidate
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">I&apos;m looking for a job</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Create a candidate account, add your profile and CV, and apply to open roles.
          </p>
        </Link>
        <Link
          href="/jobs/register/employer"
          className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-[var(--brand-navy)]/30 hover:shadow-sm transition-all"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]">
            Employer / Partner
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            I&apos;m hiring / representing an organization
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Create a hiring login and submit an organization request. A company workspace opens only
            after Energy &amp; Logics approval, or when an existing company admin invites you.
          </p>
        </Link>
      </div>
      <p className="mx-auto max-w-2xl mt-6 text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/jobs/auth/continue" className="font-medium text-[var(--brand-navy)] hover:underline">
          Sign in
        </Link>
      </p>
    </TalentShell>
  )
}
