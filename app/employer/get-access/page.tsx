import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TalentShell } from '@/components/recruitment/talent-ui'
import { getRecruitmentSessionUser } from '@/lib/recruitment/authz'

export const metadata = {
  title: 'Hiring access',
}

export default async function EmployerGetAccessPage() {
  const user = await getRecruitmentSessionUser()
  if (user) {
    redirect('/employer/pending')
  }

  return (
    <TalentShell
      title="Hiring access"
      subtitle="Create an employer account to request a company workspace. Access is granted after Energy & Logics approval or a company admin invitation."
    >
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5">
        <ol className="list-decimal pl-5 text-sm text-slate-600 space-y-2 leading-relaxed">
          <li>Register with your work email (creates your login only).</li>
          <li>
            If you are a new hiring partner, Energy &amp; Logics reviews your organization request.
          </li>
          <li>If your company already hires here, ask a company admin to invite your email.</li>
          <li>After approval or invite acceptance, open the employer workspace.</li>
        </ol>
        <div className="flex flex-wrap gap-3">
          <Link href="/jobs/register/employer">
            <Button className="rounded-xl bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-deep)]">
              Register as employer
            </Button>
          </Link>
          <Link href="/jobs/auth/continue?redirect=/employer/pending">
            <Button variant="outline" className="rounded-xl">
              Check approval status
            </Button>
          </Link>
          <Link href="/jobs">
            <Button variant="outline" className="rounded-xl">
              Browse jobs
            </Button>
          </Link>
        </div>
      </div>
    </TalentShell>
  )
}
