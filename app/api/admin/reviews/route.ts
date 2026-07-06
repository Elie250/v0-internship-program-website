import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { queryAllReviews, moderateReview, deleteReview } from '@/lib/reviews/queries'

export async function GET(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.CONTENT_SERVICES)
    const status = new URL(request.url).searchParams.get('status') ?? 'all'
    const { reviews, error } = await queryAllReviews(status)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json(reviews)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.CONTENT_SERVICES)
    const body = await request.json()
    const id = String(body.id ?? '')
    if (!id) return NextResponse.json({ error: 'Review id required' }, { status: 400 })

    const result = await moderateReview(id, {
      status: body.status,
      is_featured: body.is_featured,
      admin_reply: body.admin_reply !== undefined ? String(body.admin_reply || '') : undefined,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminPermission(PERMISSIONS.CONTENT_SERVICES)
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Review id required' }, { status: 400 })

    const result = await deleteReview(id)
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forbidden'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
