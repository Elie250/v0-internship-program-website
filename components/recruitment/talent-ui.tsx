'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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

export function JobCard({ job }: { job: RecruitmentJobWithOrganization }) {
  const org = job.organization
  return (
    <Card className="border-slate-200 hover:border-slate-300 transition-colors">
      <CardContent className="p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {org?.name ?? 'Employer'}
            </p>
            <Link
              href={jobPublicPath(job)}
              className="text-lg font-semibold text-slate-900 hover:text-[var(--brand-navy)]"
            >
              {job.title}
            </Link>
          </div>
          {job.category ? (
            <Badge variant="outline" className="text-slate-600">
              {job.category}
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          {job.location ? <span>{job.location}</span> : null}
          {job.employment_type ? <span>{formatEmploymentType(job.employment_type)}</span> : null}
          {job.work_mode ? <span>{formatWorkMode(job.work_mode)}</span> : null}
        </div>
        {job.description ? (
          <p className="text-sm text-slate-700 line-clamp-2">{job.description}</p>
        ) : null}
        <Link href={jobPublicPath(job)} className="text-sm font-medium text-[var(--brand-navy)] underline">
          View role
        </Link>
      </CardContent>
    </Card>
  )
}

export function PoweredByFooter() {
  return (
    <p className="text-xs text-slate-500 pt-8 border-t border-slate-200">
      Powered by Energy &amp; Logics
    </p>
  )
}

export function TalentShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode
  title?: string
  subtitle?: string
}) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/jobs" className="text-xs font-bold uppercase tracking-wider text-[var(--brand-navy)]">
              Energy &amp; Logics Talent
            </Link>
            {title ? <h1 className="text-xl font-bold text-slate-900 mt-1">{title}</h1> : null}
            {subtitle ? <p className="text-sm text-slate-600 mt-0.5">{subtitle}</p> : null}
          </div>
          <nav className="flex flex-wrap gap-3 text-sm">
            <Link href="/jobs" className="text-slate-700 hover:text-[var(--brand-navy)]">
              Jobs
            </Link>
            <Link href="/jobs/auth/continue" className="text-slate-700 hover:text-[var(--brand-navy)]">
              Sign in
            </Link>
            <Link href="/app" className="text-slate-700 hover:text-[var(--brand-navy)]">
              My applications
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </main>
  )
}
