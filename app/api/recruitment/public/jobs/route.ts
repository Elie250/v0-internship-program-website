import { NextResponse } from 'next/server'
import { listPublicJobs, listPublicJobFilterOptions } from '@/lib/recruitment/jobs'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get('page') ?? '1', 10)
    const pageSize = Number.parseInt(searchParams.get('pageSize') ?? '20', 10)

    const [{ jobs, total, page: currentPage, pageSize: size, error }, filters] = await Promise.all([
      listPublicJobs({
        search: searchParams.get('search') ?? undefined,
        organizationSlug: searchParams.get('organization') ?? undefined,
        location: searchParams.get('location') ?? undefined,
        employmentType: searchParams.get('employmentType') ?? undefined,
        category: searchParams.get('category') ?? undefined,
        page,
        pageSize,
      }),
      listPublicJobFilterOptions(),
    ])

    if (error) return NextResponse.json({ error }, { status: 500 })

    return NextResponse.json(
      {
        jobs,
        total,
        page: currentPage,
        pageSize: size,
        filters,
      },
      { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    )
  } catch {
    return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 })
  }
}
