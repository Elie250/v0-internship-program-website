import { NextResponse } from 'next/server'
import { getRecruitmentSessionUser } from '@/lib/recruitment/authz'
import { getJobByIdWithOrganization, isJobAcceptingApplications } from '@/lib/recruitment/jobs'
import { getActiveApplicationForJob } from '@/lib/recruitment/applications'

/** Authenticated apply context — resolves job by internal id server-side. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const user = await getRecruitmentSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { jobId } = await context.params
    const { job, error } = await getJobByIdWithOrganization(jobId)
    if (error) return NextResponse.json({ error }, { status: 500 })
    if (!job || job.status !== 'published' || job.organization?.status !== 'active') {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const existing = await getActiveApplicationForJob(jobId, user.id)

    return NextResponse.json({
      job: {
        id: job.id,
        title: job.title,
        slug: job.slug,
        organization: job.organization,
        acceptingApplications: isJobAcceptingApplications(job),
      },
      existingApplication: existing.application,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load apply context' }, { status: 500 })
  }
}
