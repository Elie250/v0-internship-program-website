import Link from 'next/link'
import { getOrganizationBySlug } from '@/lib/recruitment/organizations'
import { COMPANY } from '@/lib/company/constants'
import { notFound } from 'next/navigation'

export default async function OrganizationPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { organization } = await getOrganizationBySlug(slug)
  if (!organization || organization.status !== 'active') notFound()

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Employer</p>
        <h1 className="text-3xl font-bold text-slate-900">{organization.name}</h1>
        {organization.careers_blurb ? (
          <p className="text-slate-700 leading-relaxed">{organization.careers_blurb}</p>
        ) : organization.description ? (
          <p className="text-slate-700 leading-relaxed">{organization.description}</p>
        ) : (
          <p className="text-slate-600 text-sm">Careers page foundation — jobs list comes later.</p>
        )}
        <Link
          href="/jobs"
          className="inline-flex text-sm font-medium text-[var(--brand-navy)] underline"
        >
          Browse Talent home
        </Link>
        <p className="text-xs text-slate-500 pt-8 border-t border-slate-200">
          Powered by {COMPANY.brandName}
        </p>
      </div>
    </main>
  )
}
