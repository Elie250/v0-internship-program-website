import { NextResponse } from 'next/server'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import { uploadCourseMaterialFile } from '@/lib/storage/course-material-upload'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    await requireLecturerCourseAccess(courseId)

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const result = await uploadCourseMaterialFile(courseId, file)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, hint: result.hint },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: result.url, path: result.path })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed'
    const status =
      message === 'Unauthorized' || message.includes('not assigned') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
