import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { COMPANY } from '@/lib/company/constants'
import { RecruitmentAccountNav } from '@/components/recruitment/account-menu'
import {
  formatEmploymentType,
  formatWorkMode,
  type RecruitmentJobWithOrganization,
} from '@/lib/recruitment/types'

export function jobPublicPath(job: RecruitmentJobWithOrganization): string {
  const orgSlug = job.organization?.slug
  if (!orgSlug) return '/jobs'
  return `/o/${orgSlug}/jobs/${job.slug}`
}

export function BrandMark({
  href = COMPANY.publicSiteUrl,
  compact = false,
  light = false,
}: {
  href?: string
  compact?: boolean
  light?: boolean
}) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)]/40 focus-visible:ring-offset-2"
    >
      <Image
        src={COMPANY.logoUrl}
        alt={`${COMPANY.brandName} logo`}
        width={compact ? 36 : 44}
        height={compact ? 36 : 44}
        className="h-9 w-9 sm:h-11 sm:w-11 object-contain bg-white rounded-md p-0.5"
        priority
      />
      <span className="min-w-0">
        <span
          className={`block text-base sm:text-lg font-semibold tracking-tight transition-colors ${
            light ? 'text-white group-hover:text-white/90' : 'text-[var(--brand-navy)] group-hover:text-[var(--brand-navy-deep)]'
          }`}
        >
          {COMPANY.brandName}
        </span>
        {!compact ? (
          <span className={`block text-[11px] sm:text-xs leading-snug ${light ? 'text-white/70' : 'text-slate-500'}`}>
            {COMPANY.slogan}.
          </span>
        ) : null}
      </span>
    </a>
  )
}

export function RecruitmentNav() {
  // Kept for compatibility; account-aware nav lives in RecruitmentAccountNav (client).
  return (
    <nav className="flex flex-wrap items-center gap-1 sm:gap-2 text-sm" aria-label="Careers navigation">
      <Link
        href="/jobs"
        className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-[var(--brand-navy)] transition-colors"
      >
        Browse jobs
      </Link>
      <Link
        href="/jobs/auth/continue"
        className="rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 hover:text-[var(--brand-navy)] transition-colors"
      >
        Sign in
      </Link>
      <Link
        href="/jobs/register"
        className="rounded-md px-3 py-2 font-medium text-[var(--brand-navy)] hover:bg-[var(--brand-navy)]/5 transition-colors"
      >
        Create an account
      </Link>
    </nav>
  )
}

export function RecruitmentFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200/80 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-5">
        <p className="text-xs text-slate-500">Powered by {COMPANY.brandName}</p>
      </div>
    </footer>
  )
}

/** @deprecated Prefer RecruitmentFooter — kept for existing imports */
export function PoweredByFooter() {
  return (
    <p className="text-xs text-slate-500 pt-8 border-t border-slate-200">
      Powered by {COMPANY.brandName}
    </p>
  )
}

export function StatusBanner({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'error' | 'success' | 'info'
  children: React.ReactNode
}) {
  const styles =
    tone === 'error'
      ? 'bg-red-50 border-red-200 text-red-900'
      : tone === 'success'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
        : tone === 'info'
          ? 'bg-[var(--brand-navy)]/5 border-[var(--brand-navy)]/15 text-[var(--brand-navy-deep)]'
          : 'bg-slate-50 border-slate-200 text-slate-700'
  return (
    <div className={`rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed ${styles}`}>{children}</div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-[var(--brand-navy)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
      </div>
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {description ? <p className="mt-1.5 text-sm text-slate-600 max-w-md mx-auto">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[var(--brand-navy)]" aria-hidden />
      {label}
    </div>
  )
}

export function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
      {children}
    </span>
  )
}

function formatDeadline(deadline: string | null | undefined): string {
  if (!deadline) return 'Open — no deadline'
  const date = new Date(deadline)
  if (Number.isNaN(date.getTime())) return 'Open — no deadline'
  const label = date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return date.getTime() < Date.now() ? `Closed ${label}` : `Apply by ${label}`
}

export function JobCard({ job }: { job: RecruitmentJobWithOrganization }) {
  const org = job.organization
  const href = jobPublicPath(job)

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white transition-all duration-200 hover:border-[var(--brand-navy)]/25 hover:shadow-[0_12px_40px_-24px_rgba(30,58,95,0.45)]">
      <Link href={href} className="absolute inset-0 z-10" aria-label={`View ${job.title}`}>
        <span className="sr-only">View role</span>
      </Link>
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-4">
          {org?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logo_url}
              alt=""
              className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-contain bg-white p-1"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-[var(--brand-navy)]">
              {(org?.name ?? 'E').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium text-slate-500">{org?.name ?? 'Employer'}</p>
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 group-hover:text-[var(--brand-navy)] transition-colors">
              {job.title}
            </h2>
          </div>
          {job.category ? (
            <Badge variant="outline" className="shrink-0 border-slate-200 text-slate-600 font-normal">
              {job.category}
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {job.location ? <MetaChip>{job.location}</MetaChip> : null}
          {job.employment_type ? <MetaChip>{formatEmploymentType(job.employment_type)}</MetaChip> : null}
          {job.work_mode ? <MetaChip>{formatWorkMode(job.work_mode)}</MetaChip> : null}
          <MetaChip>{formatDeadline(job.application_deadline)}</MetaChip>
        </div>

        {job.description ? (
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{job.description}</p>
        ) : null}

        <p className="text-sm font-medium text-[var(--brand-navy)]">
          View role
          <span className="ml-1 inline-block transition-transform group-hover:translate-x-0.5" aria-hidden>
            →
          </span>
        </p>
      </div>
    </article>
  )
}

export function TalentShell({
  children,
  title,
  subtitle,
  hero,
  wide = false,
}: {
  children: React.ReactNode
  title?: string
  subtitle?: string
  /** Optional full-bleed hero above the content container */
  hero?: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className="recruitment-surface min-h-screen flex flex-col text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <BrandMark />
          <RecruitmentAccountNav />
        </div>
      </header>

      {hero}

      <main className={`flex-1 w-full ${wide ? '' : 'mx-auto max-w-6xl px-4 py-8 sm:py-10'}`}>
        {!hero && (title || subtitle) ? (
          <div className="mb-8 space-y-1.5">
            {title ? (
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
            ) : null}
            {subtitle ? <p className="text-sm sm:text-base text-slate-600 max-w-2xl">{subtitle}</p> : null}
          </div>
        ) : null}
        {children}
      </main>

      <RecruitmentFooter />
    </div>
  )
}
