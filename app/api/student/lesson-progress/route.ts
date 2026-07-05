import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth-service'
import { upsertLessonProgress } from '@/lib/learning/lesson-progress'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Please log in.' }, { status: 401 })
    }

    const body = await request.json()
    const courseId = String(body.courseId ?? '').trim()
    const contentId = String(body.contentId ?? '').trim()
    const enrollmentId = body.enrollmentId ? String(body.enrollmentId) : null
    const completed =
      body.completed === true ? true : body.completed === false ? false : undefined

    if (!courseId || !contentId) {
      return NextResponse.json({ error: 'courseId and contentId are required' }, { status: 400 })
    }

    const result = await upsertLessonProgress({
      userId: user.id,
      courseId,
      contentId,
      enrollmentId,
      completed,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, tableReady: result.tableReady ?? true },
        { status: result.tableReady === false ? 503 : 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save progress' },
      { status: 500 }
    )
  }
}
