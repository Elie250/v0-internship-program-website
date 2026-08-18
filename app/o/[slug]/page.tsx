import Link from 'next/link'
import { getOrganizationBySlug } from '@/lib/recruitment/organizations'
import { COMPANY } from '@/lib/company/constants'
import { notFound } from 'next/navigation'
import { TalentShell } from '@/components/recruitment/talent-ui'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { organization } = await getOrganizationBySlug(slug)
  if (!organization || organization.status !== 'active') return { title: 'Employer' }
  return {
    title: `${organization.name} — Careers`,
    description: organization.careers_blurb ?? organization.description ?? undefined,
  }
}

export default async function OrganizationPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { organization } = await getOrganizationBySlug(slug)
  if (!organization || organization.status !== 'active') notFound()

  const blurb =
    organization.careers_blurb ||
    organization.description ||
    `Browse open roles from ${organization.name} on the ${COMPANY.brandName} careers platform.`

  return (
    <TalentShell>
      <div className="max-w-3xl space-y-8">
        <Link href="/jobs" className="text-sm font-medium text-[var(--brand-navy)] hover:underline">
          ← Back to all roles
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-start gap-4">
            {organization.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={organization.logo_url}
                alt=""
                className="h-16 w-16 rounded-xl border border-slate-200 object-contain bg-white p-1"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xl font-semibold text-[var(--brand-navy)]">
                {organization.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Employer
              </p>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
                {organization.name}
              </h1>
            </div>
          </div>
          <p className="text-slate-700 leading-relaxed text-[15px]">{blurb}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/jobs?organization=${slug}`}>
              <Button className="h-11 rounded-xl bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-deep)]">
                View open roles
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline" className="h-11 rounded-xl">
                Browse all jobs
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </TalentShell>
  )
}
