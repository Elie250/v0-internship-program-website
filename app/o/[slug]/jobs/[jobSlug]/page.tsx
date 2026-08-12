import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicJobBySlugs, isJobAcceptingApplications, applicationClosedReason } from '@/lib/recruitment/jobs'
import { formatEmploymentType, formatWorkMode } from '@/lib/recruitment/types'
import { MetaChip, TalentShell } from '@/components/recruitment/talent-ui'
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
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
      <div className="text-slate-700 whitespace-pre-wrap leading-relaxed text-[15px]">{body}</div>
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
  const closedReason = applicationClosedReason(job)
  const org = job.organization

  return (
    <TalentShell>
      <div className="mb-6">
        <Link
          href="/jobs"
          className="text-sm font-medium text-[var(--brand-navy)] hover:underline"
        >
          ← Back to all roles
        </Link>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-8 lg:gap-10 items-start">
        <article className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-start gap-4">
              {org?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={org.logo_url}
                  alt=""
                  className="h-14 w-14 rounded-xl object-contain border border-slate-200 bg-white p-1"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg font-semibold text-[var(--brand-navy)]">
                  {(org?.name ?? 'E').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="space-y-2 flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-500">
                  {org?.slug ? (
                    <Link href={`/o/${org.slug}`} className="hover:text-[var(--brand-navy)]">
                      {org.name}
                    </Link>
                  ) : (
                    org?.name
                  )}
                </p>
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 text-balance">
                  {job.title}
                </h1>
                <div className="flex flex-wrap gap-2 pt-1">
                  {job.location ? <MetaChip>{job.location}</MetaChip> : null}
                  {job.employment_type ? (
                    <MetaChip>{formatEmploymentType(job.employment_type)}</MetaChip>
                  ) : null}
                  {job.work_mode ? <MetaChip>{formatWorkMode(job.work_mode)}</MetaChip> : null}
                  {job.category ? (
                    <Badge variant="outline" className="border-slate-200 text-slate-600 font-normal">
                      {job.category}
                    </Badge>
                  ) : null}
                  {!accepting ? (
                    <Badge variant="outline" className="border-amber-200 text-amber-800 bg-amber-50">
                      {closedReason === 'deadline_passed'
                        ? 'Deadline passed'
                        : 'Applications closed'}
                    </Badge>
                  ) : null}
                </div>
                {job.application_deadline ? (
                  <p className="text-sm text-slate-600">
                    Apply by{' '}
                    <span className="font-medium text-slate-800">
                      {new Date(job.application_deadline).toLocaleDateString()}
                    </span>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="lg:hidden">
              {accepting ? (
                <Link href={`/o/${slug}/jobs/${jobSlug}/apply`}>
                  <Button className="w-full h-11 rounded-xl bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-deep)]">
                    Apply for this role
                  </Button>
                </Link>
              ) : (
                <p className="text-sm text-slate-600">This role is not currently accepting applications.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-8">
            <Section title="About the role" body={job.description} />
            <Section title="Responsibilities" body={job.responsibilities} />
            <Section title="Requirements" body={job.requirements} />
            <Section title="Qualifications" body={job.qualifications} />
          </div>
        </article>

        <aside className="hidden lg:block sticky top-24 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_0_rgba(15,23,42,0.04)] space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Employer</p>
              <p className="mt-1 font-semibold text-slate-900">{org?.name}</p>
            </div>
            {accepting ? (
              <Link href={`/o/${slug}/jobs/${jobSlug}/apply`}>
                <Button className="w-full h-11 rounded-xl bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-deep)]">
                  Apply for this role
                </Button>
              </Link>
            ) : (
              <p className="text-sm text-slate-600">Applications are closed for this role.</p>
            )}
            <p className="text-xs text-slate-500 leading-relaxed">
              Continue with Email — no password to create. Your profile and CV can be reused across
              employers.
            </p>
          </div>
        </aside>
      </div>
    </TalentShell>
  )
}
