import { NextResponse } from 'next/server'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import { getPracticalArtifactSignedUrl } from '@/lib/learning/practical-assessment-service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; artifactId: string }> }
) {
  try {
    const { id: courseId, artifactId } = await params
    await requireLecturerCourseAccess(courseId)

    const result = await getPracticalArtifactSignedUrl({
      artifactId,
      courseId,
    })
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })

    return NextResponse.redirect(result.url, 302)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized'
    const status = message === 'Unauthorized' || message.includes('not assigned') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
