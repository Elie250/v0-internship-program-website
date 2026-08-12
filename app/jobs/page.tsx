import Link from 'next/link'
import { Suspense } from 'react'
import { listPublicJobs, listPublicJobFilterOptions } from '@/lib/recruitment/jobs'
import { JobBoardFilters } from '@/components/recruitment/job-board-filters'
import { JobCard, PoweredByFooter, TalentShell } from '@/components/recruitment/talent-ui'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Jobs — Energy & Logics Talent',
  description: 'Discover career opportunities from employers on Energy & Logics Talent.',
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function param(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const search = param(sp.search)
  const organization = param(sp.organization)
  const location = param(sp.location)
  const employmentType = param(sp.employmentType)
  const category = param(sp.category)
  const page = Number.parseInt(param(sp.page) ?? '1', 10) || 1

  const [{ jobs, total, pageSize }, filters] = await Promise.all([
    listPublicJobs({ search, organizationSlug: organization, location, employmentType, category, page }),
    listPublicJobFilterOptions(),
  ])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <TalentShell
      title="Find your next role"
      subtitle="Multi-employer opportunities on Energy & Logics Talent"
    >
      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        <aside>
          <Suspense fallback={<p className="text-sm text-slate-600">Loading filters…</p>}>
            <JobBoardFilters filters={filters} />
          </Suspense>
        </aside>

        <section className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-600">{total} open role{total === 1 ? '' : 's'}</p>
              <p className="text-xs text-slate-500">One account applies across all employers</p>
            </div>
            <Link href="/jobs/auth/continue">
              <Button className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
                Continue with Email
              </Button>
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-slate-800 font-medium">No matching jobs right now</p>
              <p className="text-sm text-slate-600 mt-1">Try adjusting your filters or check back soon.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard key={`${job.organization?.slug}-${job.slug}`} job={job} />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between text-sm">
              {page > 1 ? (
                <Link
                  href={`/jobs?${new URLSearchParams({ ...(search ? { search } : {}), ...(organization ? { organization } : {}), page: String(page - 1) }).toString()}`}
                  className="text-[var(--brand-navy)] underline"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-slate-600">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`/jobs?${new URLSearchParams({ ...(search ? { search } : {}), ...(organization ? { organization } : {}), page: String(page + 1) }).toString()}`}
                  className="text-[var(--brand-navy)] underline"
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </div>
          ) : null}

          <PoweredByFooter />
        </section>
      </div>
    </TalentShell>
  )
}
