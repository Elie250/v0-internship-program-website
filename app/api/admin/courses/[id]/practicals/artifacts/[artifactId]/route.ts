import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/app/actions/admin-context'
import { PERMISSIONS } from '@/lib/admin/permissions'
import { getPracticalArtifactSignedUrl } from '@/lib/learning/practical-assessment-service'

/** Admin oversight download: short-lived signed URL after permission check. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; artifactId: string }> }
) {
  try {
    await requireAdminPermission(PERMISSIONS.LEARNING_STUDENTS)
    const { id: courseId, artifactId } = await params

    const result = await getPracticalArtifactSignedUrl({
      artifactId,
      courseId,
    })
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })

    return NextResponse.redirect(result.url, 302)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized'
    const status = /unauthorized|permission|forbidden/i.test(message) ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
