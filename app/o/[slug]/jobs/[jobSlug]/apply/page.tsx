import { notFound } from 'next/navigation'
import { getPublishedJobRecordBySlugs, isJobAcceptingApplications } from '@/lib/recruitment/jobs'
import { ApplyFlow } from '@/components/recruitment/apply-flow'

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ slug: string; jobSlug: string }>
}) {
  const { slug, jobSlug } = await params
  const { job } = await getPublishedJobRecordBySlugs(slug, jobSlug)
  if (!job || !isJobAcceptingApplications(job)) notFound()

  const org = Array.isArray(job.organization) ? job.organization[0] : job.organization

  return (
    <ApplyFlow
      orgSlug={slug}
      jobSlug={jobSlug}
      jobId={job.id}
      jobTitle={job.title}
      organizationName={org?.name ?? 'Employer'}
    />
  )
}
