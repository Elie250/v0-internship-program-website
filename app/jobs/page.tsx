import Link from 'next/link'
import { Suspense } from 'react'
import { listPublicJobs, listPublicJobFilterOptions } from '@/lib/recruitment/jobs'
import { JobBoardFilters } from '@/components/recruitment/job-board-filters'
import {
  EmptyState,
  JobCard,
  TalentShell,
} from '@/components/recruitment/talent-ui'
import { Button } from '@/components/ui/button'
import { COMPANY } from '@/lib/company/constants'

export const metadata = {
  title: `Careers — ${COMPANY.brandName}`,
  description: `Find engineering and professional roles from employers on ${COMPANY.brandName}.`,
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function param(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function buildQuery(parts: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(parts)) {
    if (value) params.set(key, value)
  }
  return params.toString()
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
  const hasActiveFilters = Boolean(search || organization || location || employmentType || category)
  const featuredEmployers = filters.organizations.slice(0, 6)

  const hero = (
    <section className="relative overflow-hidden border-b border-slate-200/80">
      <div
        className="absolute inset-0 bg-[linear-gradient(165deg,#f8fafc_0%,#eef3f8_42%,#e7eef6_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 20%, rgba(126,184,232,0.35), transparent 42%), radial-gradient(circle at 88% 12%, rgba(30,58,95,0.08), transparent 36%)',
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-10 sm:pt-16 sm:pb-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-navy)]/80">
          Careers
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl sm:text-5xl font-semibold tracking-tight text-slate-900 text-balance">
          Find your next role
        </h1>
        <p className="mt-4 max-w-xl text-base sm:text-lg text-slate-600 leading-relaxed">
          Browse opportunities from engineering and industry employers — one profile, one CV, apply
          with email.
        </p>

        <form action="/jobs" method="get" className="mt-8 max-w-2xl">
          <label htmlFor="hero-search" className="sr-only">
            Search jobs
          </label>
          <div className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-[0_18px_50px_-28px_rgba(30,58,95,0.55)]">
            <input
              id="hero-search"
              name="search"
              defaultValue={search}
              placeholder="Search by role, skill, or keyword"
              className="h-12 flex-1 rounded-xl border-0 bg-transparent px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            />
            {organization ? <input type="hidden" name="organization" value={organization} /> : null}
            {location ? <input type="hidden" name="location" value={location} /> : null}
            {employmentType ? <input type="hidden" name="employmentType" value={employmentType} /> : null}
            {category ? <input type="hidden" name="category" value={category} /> : null}
            <Button
              type="submit"
              className="h-12 shrink-0 rounded-xl px-6 bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-deep)]"
            >
              Search roles
            </Button>
          </div>
        </form>

        {filters.categories.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/jobs"
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                !category
                  ? 'border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white'
                  : 'border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300'
              }`}
            >
              All disciplines
            </Link>
            {filters.categories.map((cat) => {
              const active = category === cat
              const href = `/jobs?${buildQuery({
                search,
                organization,
                location,
                employmentType,
                category: cat,
              })}`
              return (
                <Link
                  key={cat}
                  href={href}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white'
                      : 'border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </Link>
              )
            })}
          </div>
        ) : null}
      </div>
    </section>
  )

  return (
    <TalentShell hero={hero} wide>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        {featuredEmployers.length > 0 ? (
          <section className="mb-10">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Hiring partners</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {featuredEmployers.map((org) => (
                <Link
                  key={org.slug}
                  href={`/jobs?organization=${org.slug}`}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                    organization === org.slug
                      ? 'border-[var(--brand-navy)] bg-[var(--brand-navy)]/5 text-[var(--brand-navy)]'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {org.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid lg:grid-cols-[280px_1fr] gap-8 lg:gap-10">
          <aside className="hidden lg:block">
            <Suspense fallback={<p className="text-sm text-slate-600">Loading filters…</p>}>
              <JobBoardFilters filters={filters} />
            </Suspense>
          </aside>

          <section className="space-y-5">
            <div className="lg:hidden rounded-2xl border border-slate-200 bg-white p-4">
              <details>
                <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                  Filters &amp; search
                </summary>
                <div className="mt-4">
                  <Suspense fallback={<p className="text-sm text-slate-600">Loading filters…</p>}>
                    <JobBoardFilters filters={filters} compact />
                  </Suspense>
                </div>
              </details>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {total} open role{total === 1 ? '' : 's'}
                  {hasActiveFilters ? ' matching your search' : ''}
                </p>
              </div>
            </div>

            {jobs.length === 0 ? (
              <EmptyState
                title="No matching roles right now"
                description="Try another discipline, location, or keyword — new opportunities are published regularly."
                action={
                  hasActiveFilters ? (
                    <Link href="/jobs">
                      <Button variant="outline">Clear filters</Button>
                    </Link>
                  ) : null
                }
              />
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard key={`${job.organization?.slug}-${job.slug}`} job={job} />
                ))}
              </div>
            )}

            {totalPages > 1 ? (
              <div className="flex items-center justify-between text-sm pt-2">
                {page > 1 ? (
                  <Link
                    href={`/jobs?${buildQuery({
                      search,
                      organization,
                      location,
                      employmentType,
                      category,
                      page: String(page - 1),
                    })}`}
                    className="font-medium text-[var(--brand-navy)] hover:underline"
                  >
                    Previous
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-slate-500">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={`/jobs?${buildQuery({
                      search,
                      organization,
                      location,
                      employmentType,
                      category,
                      page: String(page + 1),
                    })}`}
                    className="font-medium text-[var(--brand-navy)] hover:underline"
                  >
                    Next
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </TalentShell>
  )
}
