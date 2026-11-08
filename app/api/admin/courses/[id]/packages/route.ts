import { NextResponse } from 'next/server'
import {
  createCoursePackage,
  listAdminCoursePackages,
  previewStudentCoursePackages,
} from '@/lib/admin/course-packages'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(request.url)
  if (url.searchParams.get('preview') === 'student') {
    const result = await previewStudentCoursePackages(id)
    if (!result.ok) {
      const status = result.error === 'Unauthorized' ? 401 : result.error === 'Forbidden' ? 403 : 400
      return NextResponse.json(result, { status })
    }
    return NextResponse.json(result)
  }

  const result = await listAdminCoursePackages(id)
  if (!result.ok) {
    const status = result.error === 'Unauthorized' ? 401 : result.error === 'Forbidden' ? 403 : 400
    return NextResponse.json(result, { status })
  }
  return NextResponse.json(result)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const result = await createCoursePackage(id, {
    name: body.name,
    description: body.description,
    benefits: body.benefits,
    listPrice: body.listPrice ?? body.list_price,
    discountAmount: body.discountAmount ?? body.discount_amount,
    isActive: body.isActive ?? body.is_active,
    sortOrder: body.sortOrder ?? body.sort_order,
  })
  if (!result.ok) {
    const status = result.error === 'Unauthorized' ? 401 : result.error === 'Forbidden' ? 403 : 400
    return NextResponse.json(result, { status })
  }
  return NextResponse.json(result, { status: 201 })
}
