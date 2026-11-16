import { NextResponse } from 'next/server'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import { listPracticalSubmissionsForCourse } from '@/lib/learning/practical-assessment-service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    await requireLecturerCourseAccess(courseId)
    const { rows, error } = await listPracticalSubmissionsForCourse(courseId)
    if (error) return NextResponse.json({ error }, { status: 503 })
    // Do not expose public CDN URLs or raw storage_key paths; use signed-download routes.
    const submissions = rows.map((row) => ({
      ...row,
      artifacts: row.artifacts.map((artifact) => ({
        id: artifact.id,
        file_name: artifact.file_name,
        content_type: artifact.content_type,
        byte_size: artifact.byte_size,
        label: artifact.label,
        sort_order: artifact.sort_order,
        download_path: `/api/lecturer/courses/${courseId}/practicals/artifacts/${artifact.id}`,
      })),
    }))
    return NextResponse.json({ submissions })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load submissions'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
