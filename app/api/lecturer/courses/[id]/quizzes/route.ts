import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import { queryCourseQuizzes, QUIZ_TABLES_HINT } from '@/lib/learning/quiz'

type QuestionInput = {
  question?: string
  options?: unknown[]
  correct_index?: number
  explanation?: string | null
}

function sanitizeQuestions(raw: unknown): { questions: Array<{
  question: string
  options: string[]
  correct_index: number
  explanation: string | null
  sort_order: number
}>; error?: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { questions: [], error: 'Add at least one question' }
  }

  const questions = []
  for (let i = 0; i < raw.length; i++) {
    const q = raw[i] as QuestionInput
    const text = String(q.question ?? '').trim()
    const options = (Array.isArray(q.options) ? q.options : []).map((o) => String(o).trim()).filter(Boolean)
    const correctIndex = Number(q.correct_index)

    if (!text) return { questions: [], error: `Question ${i + 1} is empty` }
    if (options.length < 2) return { questions: [], error: `Question ${i + 1} needs at least 2 choices` }
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      return { questions: [], error: `Select the correct answer for question ${i + 1}` }
    }

    questions.push({
      question: text,
      options,
      correct_index: correctIndex,
      explanation: q.explanation ? String(q.explanation).trim() || null : null,
      sort_order: i,
    })
  }
  return { questions }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    await requireLecturerCourseAccess(courseId)

    const { quizzes, error } = await queryCourseQuizzes(courseId, { includeAnswers: true })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json(quizzes)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load quizzes'
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

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const title = String(body.title ?? '').trim()
    if (!title) return NextResponse.json({ error: 'Quiz title is required' }, { status: 400 })

    const { questions, error: qError } = sanitizeQuestions(body.questions)
    if (qError) return NextResponse.json({ error: qError }, { status: 400 })

    const passingScore = Math.max(1, Math.min(100, Number(body.passing_score) || 70))

    const { data: quiz, error: createError } = await supabaseAdmin
      .from('course_assessments')
      .insert([
        {
          course_id: courseId,
          title,
          description: String(body.description ?? '').trim() || null,
          passing_score: passingScore,
          sort_order: Number(body.sort_order) || 0,
          created_by: user.id,
        },
      ])
      .select('id')
      .single()

    if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })

    const { error: insertError } = await supabaseAdmin.from('assessment_questions').insert(
      questions.map((q) => ({ ...q, assessment_id: quiz.id }))
    )

    if (insertError) {
      await supabaseAdmin.from('course_assessments').delete().eq('id', quiz.id)
      const message = insertError.message.includes('assessment_questions')
        ? QUIZ_TABLES_HINT
        : insertError.message
      return NextResponse.json({ error: message }, { status: 500 })
    }

    return NextResponse.json({ id: quiz.id }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create quiz'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    await requireLecturerCourseAccess(courseId)

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const quizId = String(body.quizId ?? '')
    if (!quizId) return NextResponse.json({ error: 'quizId required' }, { status: 400 })

    const { data: quiz } = await supabaseAdmin
      .from('course_assessments')
      .select('id, course_id')
      .eq('id', quizId)
      .maybeSingle()

    if (!quiz || String(quiz.course_id) !== courseId) {
      return NextResponse.json({ error: 'Quiz not found for this programme' }, { status: 404 })
    }

    if (body.delete === true) {
      const { error } = await supabaseAdmin.from('course_assessments').delete().eq('id', quizId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.title !== undefined) {
      const title = String(body.title).trim()
      if (!title) return NextResponse.json({ error: 'Quiz title is required' }, { status: 400 })
      update.title = title
    }
    if (body.description !== undefined) {
      update.description = String(body.description ?? '').trim() || null
    }
    if (body.passing_score !== undefined) {
      update.passing_score = Math.max(1, Math.min(100, Number(body.passing_score) || 70))
    }
    if (body.is_published !== undefined) {
      update.is_published = body.is_published === true
    }

    const { error: updateError } = await supabaseAdmin
      .from('course_assessments')
      .update(update)
      .eq('id', quizId)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    if (body.questions !== undefined) {
      const { questions, error: qError } = sanitizeQuestions(body.questions)
      if (qError) return NextResponse.json({ error: qError }, { status: 400 })

      await supabaseAdmin.from('assessment_questions').delete().eq('assessment_id', quizId)
      const { error: insertError } = await supabaseAdmin.from('assessment_questions').insert(
        questions.map((q) => ({ ...q, assessment_id: quizId }))
      )
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update quiz'
    return NextResponse.json({ error: message }, { status: 403 })
  }
}
