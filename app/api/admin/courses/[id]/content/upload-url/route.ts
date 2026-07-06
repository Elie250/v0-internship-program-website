import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { createCourseMaterialUploadTarget } from '@/lib/storage/course-material-upload'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_PROGRAMS)
    const { id: courseId } = await params

    const body = await request.json()
    const target = await createCourseMaterialUploadTarget(courseId, {
      name: String(body.name ?? ''),
      type: String(body.type ?? ''),
      size: Number(body.size ?? 0),
    })

    if (!target.ok) {
      return NextResponse.json({ error: target.error }, { status: target.status })
    }

    return NextResponse.json({
      signedUrl: target.signedUrl,
      path: target.path,
      publicUrl: target.publicUrl,
      contentType: target.contentType,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to prepare upload'
    const status = message === 'Unauthorized' || message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
