import { NextResponse } from 'next/server'
import { setCoursePackageActive, updateCoursePackage } from '@/lib/admin/course-packages'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; packageId: string }> }
) {
  const { id, packageId } = await params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  if (body.action === 'activate' || body.action === 'deactivate') {
    const result = await setCoursePackageActive(id, packageId, body.action === 'activate')
    if (!result.ok) {
      const status = result.error === 'Unauthorized' ? 401 : result.error === 'Forbidden' ? 403 : 400
      return NextResponse.json(result, { status })
    }
    return NextResponse.json(result)
  }

  const result = await updateCoursePackage(id, packageId, {
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
  return NextResponse.json(result)
}
