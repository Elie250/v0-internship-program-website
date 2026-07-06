import { NextResponse } from 'next/server'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import { certifyStudentCompletion, queryCourseQuizStandings } from '@/lib/learning/quiz'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    await requireLecturerCourseAccess(courseId)

    const { standings, passingScore, error } = await queryCourseQuizStandings(courseId)
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ standings, passingScore })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load results'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const { user } = await requireLecturerCourseAccess(courseId)

    const body = await request.json()
    const enrollmentId = String(body.enrollmentId ?? '')
    if (!enrollmentId) {
      return NextResponse.json({ error: 'enrollmentId required' }, { status: 400 })
    }

    const result = await certifyStudentCompletion({
      courseId,
      enrollmentId,
      issuedBy: user.id,
    })

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ certificateCode: result.certificateCode })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to certify'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
