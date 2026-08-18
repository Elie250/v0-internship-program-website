import { NextResponse } from 'next/server'
import { getPublicJobBySlugs, isJobAcceptingApplications } from '@/lib/recruitment/jobs'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  context: { params: Promise<{ orgSlug: string; jobSlug: string }> }
) {
  try {
    const { orgSlug, jobSlug } = await context.params
    const { job, error } = await getPublicJobBySlugs(orgSlug, jobSlug)
    if (error) return NextResponse.json({ error }, { status: 500 })
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    return NextResponse.json(
      {
        job: {
          title: job.title,
          slug: job.slug,
          description: job.description,
          responsibilities: job.responsibilities,
          requirements: job.requirements,
          qualifications: job.qualifications,
          location: job.location,
          employment_type: job.employment_type,
          work_mode: job.work_mode,
          category: job.category,
          published_at: job.published_at,
          application_deadline: job.application_deadline,
          status: job.status,
          acceptingApplications: isJobAcceptingApplications(job),
          organization: {
            name: job.organization?.name,
            slug: job.organization?.slug,
            logo_url: job.organization?.logo_url,
          },
        },
        poweredBy: 'Energy & Logics',
      },
      { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to load job' }, { status: 500 })
  }
}
