import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth-service'
import { upsertLessonProgress } from '@/lib/learning/lesson-progress'
import {
  completeLessonWithIntegrity,
  recordLessonHeartbeat,
  verifyEnrollmentLessonAccess,
} from '@/lib/learning/lesson-integrity'
import { maybeAutoRequestCertificate } from '@/lib/learning/certificate-auto'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Please log in.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = String(searchParams.get('courseId') ?? '').trim()
    const contentId = String(searchParams.get('contentId') ?? '').trim()

    if (!courseId || !contentId) {
      return NextResponse.json({ error: 'courseId and contentId are required' }, { status: 400 })
    }

    const access = await verifyEnrollmentLessonAccess(user.id, courseId, contentId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    return NextResponse.json({
      timeSpentSeconds: access.existing.timeSpentSeconds,
      watchPercent: access.existing.watchPercent,
      completed: access.existing.completed,
      contentType: access.contentType,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load progress' },
      { status: 500 }
    )
  }
}

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
    const heartbeat = body.heartbeat === true
    const watchPercent =
      body.watchPercent != null ? Number(body.watchPercent) : undefined
    const elapsedSeconds =
      body.elapsedSeconds != null ? Number(body.elapsedSeconds) : undefined
    const completed =
      body.completed === true ? true : body.completed === false ? false : undefined

    if (!courseId || !contentId) {
      return NextResponse.json({ error: 'courseId and contentId are required' }, { status: 400 })
    }

    const access = await verifyEnrollmentLessonAccess(user.id, courseId, contentId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    if (heartbeat) {
      const result = await recordLessonHeartbeat({
        userId: user.id,
        courseId,
        contentId,
        enrollmentId: enrollmentId ?? access.enrollmentId,
        elapsedSeconds,
        watchPercent,
      })

      if (!result.success) {
        return NextResponse.json(
          { error: result.error, tableReady: result.tableReady ?? true },
          { status: result.tableReady === false ? 503 : 400 }
        )
      }

      return NextResponse.json({
        success: true,
        heartbeat: true,
        timeSpentSeconds: result.timeSpentSeconds,
        watchPercent: result.watchPercent,
      })
    }

    if (completed === false && access.existing.completionVerified) {
      return NextResponse.json(
        { error: 'Verified lesson completion cannot be undone.' },
        { status: 400 }
      )
    }

    if (completed === true) {
      const timeSpent = Math.max(
        access.existing.timeSpentSeconds,
        elapsedSeconds != null ? Math.floor(elapsedSeconds) : 0
      )
      const watch = Math.max(
        access.existing.watchPercent,
        watchPercent != null ? Math.floor(watchPercent) : 0
      )

      const result = await completeLessonWithIntegrity({
        userId: user.id,
        courseId,
        contentId,
        enrollmentId: enrollmentId ?? access.enrollmentId,
        contentType: access.contentType,
        timeSpentSeconds: timeSpent,
        watchPercent: watch,
      })

      if (!result.success) {
        return NextResponse.json(
          { error: result.error, tableReady: result.tableReady ?? true },
          { status: result.tableReady === false ? 503 : 400 }
        )
      }

      void maybeAutoRequestCertificate({
        courseId,
        enrollmentId: enrollmentId ?? access.enrollmentId,
        userId: user.id,
      })

      return NextResponse.json({ success: true, completed: true })
    }

    const result = await upsertLessonProgress({
      userId: user.id,
      courseId,
      contentId,
      enrollmentId: enrollmentId ?? access.enrollmentId,
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
