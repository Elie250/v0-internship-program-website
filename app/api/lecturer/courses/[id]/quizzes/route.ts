import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireLecturerCourseAccess } from '@/lib/lecturer/access'
import { queryCourseQuizzes, QUIZ_TABLES_HINT } from '@/lib/learning/quiz'

type QuestionInput = {
  question?: string
  options?: unknown[]
  correct_index?: number
  explanation?: string | null
  parameters?: unknown
  answer_spec?: unknown
}

function sanitizeQuestions(raw: unknown): {
  questions: Array<{
    question: string
    options: string[]
    correct_index: number
    explanation: string | null
    sort_order: number
    parameters: unknown
    answer_spec: unknown
  }>
  error?: string
} {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { questions: [], error: 'Add at least one question' }
  }

  const questions = []
  for (let i = 0; i < raw.length; i++) {
    const q = raw[i] as QuestionInput
    const text = String(q.question ?? '').trim()
    const options = (Array.isArray(q.options) ? q.options : []).map((o) => String(o).trim()).filter(Boolean)
    const correctIndex = Number(q.correct_index)
    const answerSpec =
      q.answer_spec && typeof q.answer_spec === 'object' && !Array.isArray(q.answer_spec)
        ? q.answer_spec
        : {}
    const hasExpression =
      typeof (answerSpec as { expression?: string }).expression === 'string' &&
      String((answerSpec as { expression?: string }).expression).trim().length > 0

    if (!text) return { questions: [], error: `Question ${i + 1} is empty` }
    if (!hasExpression && options.length < 2) {
      return { questions: [], error: `Question ${i + 1} needs at least 2 choices (or an answer expression)` }
    }
    if (!hasExpression && (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length)) {
      return { questions: [], error: `Select the correct answer for question ${i + 1}` }
    }

    questions.push({
      question: text,
      options: hasExpression && options.length < 2 ? ['(auto)', '(auto)'] : options,
      correct_index: hasExpression ? 0 : correctIndex,
      explanation: q.explanation ? String(q.explanation).trim() || null : null,
      sort_order: i,
      parameters: Array.isArray(q.parameters) ? q.parameters : [],
      answer_spec: answerSpec,
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
    const integrity = {
      max_attempts: Math.max(1, Math.min(10, Number(body.max_attempts) || 3)),
      time_limit_minutes: Math.max(5, Math.min(180, Number(body.time_limit_minutes) || 45)),
      shuffle_questions: body.shuffle_questions !== false,
      shuffle_options: body.shuffle_options !== false,
      require_lessons_complete: body.require_lessons_complete !== false,
      lock_after_pass: body.lock_after_pass !== false,
      cooldown_minutes: Math.max(0, Math.min(10080, Number(body.cooldown_minutes) || 60)),
      require_fullscreen: body.require_fullscreen === true,
      reveal_answers:
        body.reveal_answers === 'never' || body.reveal_answers === 'after_pass'
          ? body.reveal_answers
          : 'after_all_attempts',
      integrity_thresholds:
        body.integrity_thresholds && typeof body.integrity_thresholds === 'object'
          ? body.integrity_thresholds
          : {},
    }

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
          ...integrity,
        },
      ])
      .select('id')
      .single()

    if (createError) {
      // Pre-migration 80/82: retry without optional integrity columns
      if (
        createError.message.includes('require_fullscreen') ||
        createError.message.includes('integrity_thresholds') ||
        createError.message.includes('schema cache')
      ) {
        const {
          require_fullscreen: _fs,
          integrity_thresholds: _th,
          ...legacyIntegrity
        } = integrity
        const legacy = await supabaseAdmin
          .from('course_assessments')
          .insert([
            {
              course_id: courseId,
              title,
              description: String(body.description ?? '').trim() || null,
              passing_score: passingScore,
              sort_order: Number(body.sort_order) || 0,
              created_by: user.id,
              ...legacyIntegrity,
            },
          ])
          .select('id')
          .single()
        if (legacy.error) return NextResponse.json({ error: legacy.error.message }, { status: 500 })

        const { error: insertError } = await supabaseAdmin.from('assessment_questions').insert(
          questions.map((q) => ({ ...q, assessment_id: legacy.data.id }))
        )
        if (insertError) {
          await supabaseAdmin.from('course_assessments').delete().eq('id', legacy.data.id)
          const message = insertError.message.includes('assessment_questions')
            ? QUIZ_TABLES_HINT
            : insertError.message
          return NextResponse.json({ error: message }, { status: 500 })
        }
        return NextResponse.json({ id: legacy.data.id }, { status: 201 })
      }
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

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
    if (body.max_attempts !== undefined) {
      update.max_attempts = Math.max(1, Math.min(10, Number(body.max_attempts) || 3))
    }
    if (body.time_limit_minutes !== undefined) {
      update.time_limit_minutes = Math.max(5, Math.min(180, Number(body.time_limit_minutes) || 45))
    }
    if (body.shuffle_questions !== undefined) {
      update.shuffle_questions = body.shuffle_questions === true
    }
    if (body.shuffle_options !== undefined) {
      update.shuffle_options = body.shuffle_options === true
    }
    if (body.require_lessons_complete !== undefined) {
      update.require_lessons_complete = body.require_lessons_complete === true
    }
    if (body.lock_after_pass !== undefined) {
      update.lock_after_pass = body.lock_after_pass === true
    }
    if (body.require_fullscreen !== undefined) {
      update.require_fullscreen = body.require_fullscreen === true
    }
    if (body.cooldown_minutes !== undefined) {
      update.cooldown_minutes = Math.max(0, Math.min(10080, Number(body.cooldown_minutes) || 0))
    }
    if (body.reveal_answers !== undefined) {
      const reveal = String(body.reveal_answers)
      update.reveal_answers =
        reveal === 'never' || reveal === 'after_pass' ? reveal : 'after_all_attempts'
    }
    if (body.integrity_thresholds !== undefined) {
      update.integrity_thresholds =
        body.integrity_thresholds && typeof body.integrity_thresholds === 'object'
          ? body.integrity_thresholds
          : {}
    }

    const { error: updateError } = await supabaseAdmin
      .from('course_assessments')
      .update(update)
      .eq('id', quizId)

    if (updateError) {
      if (
        updateError.message.includes('require_fullscreen') ||
        updateError.message.includes('integrity_thresholds') ||
        updateError.message.includes('schema cache')
      ) {
        const retry = { ...update }
        delete retry.require_fullscreen
        delete retry.integrity_thresholds
        const legacy = await supabaseAdmin
          .from('course_assessments')
          .update(retry)
          .eq('id', quizId)
        if (legacy.error) return NextResponse.json({ error: legacy.error.message }, { status: 500 })
      } else {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

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
