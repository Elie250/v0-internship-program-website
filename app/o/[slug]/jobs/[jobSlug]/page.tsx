import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicJobBySlugs, isJobAcceptingApplications } from '@/lib/recruitment/jobs'
import {
  formatEmploymentType,
  formatWorkMode,
} from '@/lib/recruitment/types'
import { PoweredByFooter, TalentShell } from '@/components/recruitment/talent-ui'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; jobSlug: string }>
}) {
  const { slug, jobSlug } = await params
  const { job } = await getPublicJobBySlugs(slug, jobSlug)
  if (!job) return { title: 'Job not found' }
  return {
    title: `${job.title} — ${job.organization?.name ?? 'Employer'}`,
    description: job.description?.slice(0, 160) ?? undefined,
  }
}

function Section({ title, body }: { title: string; body: string | null | undefined }) {
  if (!body?.trim()) return null
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">{body}</div>
    </section>
  )
}

export default async function PublicJobDetailPage({
  params,
}: {
  params: Promise<{ slug: string; jobSlug: string }>
}) {
  const { slug, jobSlug } = await params
  const { job } = await getPublicJobBySlugs(slug, jobSlug)
  if (!job) notFound()

  const accepting = isJobAcceptingApplications(job)
  const org = job.organization

  return (
    <TalentShell>
      <article className="max-w-3xl space-y-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex flex-wrap items-start gap-4">
            {org?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logo_url} alt="" className="h-14 w-14 rounded-md object-contain border border-slate-200" />
            ) : null}
            <div className="space-y-2 flex-1">
              <p className="text-sm font-semibold text-slate-600">{org?.name}</p>
              <h1 className="text-3xl font-bold text-slate-900">{job.title}</h1>
              <div className="flex flex-wrap gap-2">
                {job.category ? <Badge variant="outline">{job.category}</Badge> : null}
                {!accepting ? <Badge variant="outline">Applications closed</Badge> : null}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                {job.location ? <span>{job.location}</span> : null}
                {job.employment_type ? <span>{formatEmploymentType(job.employment_type)}</span> : null}
                {job.work_mode ? <span>{formatWorkMode(job.work_mode)}</span> : null}
              </div>
              {job.application_deadline ? (
                <p className="text-sm text-slate-600">
                  Apply by {new Date(job.application_deadline).toLocaleDateString()}
                </p>
              ) : null}
            </div>
          </div>

          {accepting ? (
            <Link href={`/o/${slug}/jobs/${jobSlug}/apply`}>
              <Button className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
                Apply for this role
              </Button>
            </Link>
          ) : (
            <p className="text-sm text-slate-600">This role is not currently accepting applications.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-6">
          <Section title="About the role" body={job.description} />
          <Section title="Responsibilities" body={job.responsibilities} />
          <Section title="Requirements" body={job.requirements} />
          <Section title="Qualifications" body={job.qualifications} />
        </div>

        <PoweredByFooter />
      </article>
    </TalentShell>
  )
}
