import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth-service'
import { verifyEnrollmentLessonAccess } from '@/lib/learning/lesson-integrity'
import {
  queryClearedCheckpointIds,
  submitLessonCheckpoint,
} from '@/lib/learning/lesson-checkpoint-store'

function readId(value: unknown): string {
  return String(value ?? '').trim()
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Please log in.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = readId(searchParams.get('courseId') ?? searchParams.get('course_id'))
    const contentId = readId(searchParams.get('contentId') ?? searchParams.get('content_id'))

    if (!courseId || !contentId) {
      return NextResponse.json({ error: 'courseId and contentId are required' }, { status: 400 })
    }

    const access = await verifyEnrollmentLessonAccess(user.id, courseId, contentId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    const cleared = await queryClearedCheckpointIds(user.id, contentId)
    if (!cleared.ok) {
      return NextResponse.json(
        { error: cleared.error, tableReady: cleared.tableReady ?? true },
        { status: cleared.tableReady === false ? 503 : 500 }
      )
    }

    return NextResponse.json({
      clearedBlockIds: cleared.ids,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load checkpoints' },
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
    const courseId = readId(body.courseId ?? body.course_id)
    const contentId = readId(body.contentId ?? body.content_id)
    const blockId = readId(body.blockId ?? body.block_id)
    const choiceId = readId(body.choiceId ?? body.choice_id)

    if (!courseId || !contentId || !blockId || !choiceId) {
      return NextResponse.json(
        { error: 'courseId, contentId, blockId, and choiceId are required' },
        { status: 400 }
      )
    }

    const access = await verifyEnrollmentLessonAccess(user.id, courseId, contentId)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: 403 })
    }

    const result = await submitLessonCheckpoint({
      userId: user.id,
      courseId,
      contentId,
      blockId,
      choiceId,
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, tableReady: result.tableReady ?? true },
        { status: result.status }
      )
    }

    if (result.correct) {
      return NextResponse.json({
        correct: true,
        clearedBlockIds: result.clearedBlockIds,
      })
    }

    return NextResponse.json({
      correct: false,
      hint: result.hint,
      clearedBlockIds: result.clearedBlockIds,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit checkpoint' },
      { status: 500 }
    )
  }
}
