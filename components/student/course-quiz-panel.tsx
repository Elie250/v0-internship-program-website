'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  Lock,
  RotateCcw,
  Shield,
  Timer,
  XCircle,
} from 'lucide-react'

type QuizSecurity = {
  maxAttempts: number
  attemptsRemaining: number
  timeLimitMinutes: number | null
  canStart: boolean
  blockReason: string | null
  inProgressAttemptId: string | null
  expiresAt: string | null
  requireLessonsComplete: boolean
}

type StudentQuiz = {
  id: string
  title: string
  description: string | null
  passing_score: number
  questionCount: number
  mySubmission: {
    score: number
    passed: boolean
    attemptCount: number
    correctCount: number | null
    totalQuestions: number | null
    submittedAt: string | null
    locked: boolean
  } | null
  security: QuizSecurity
}

type QuizListResponse = {
  quizzes: StudentQuiz[]
  averageScore: number | null
  completedQuizzes: number
  totalQuizzes: number
  lessonProgress: { complete: boolean; total: number; completed: number }
  certificate: { code: string; issuedAt: string; status: string } | null
}

type AttemptQuestion = {
  id: string
  question: string
  options: string[]
}

type GradedAnswer = {
  questionId: string
  question: string
  options: string[]
  chosenIndex: number
  correctIndex: number
  correct: boolean
  explanation: string | null
}

type GradeResult = {
  score: number
  passed: boolean
  correctCount: number
  totalQuestions: number
  attemptCount: number
  revealAnswers: boolean
  results: GradedAnswer[]
  integrityFlags: string[]
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function CourseQuizPanel({ courseId }: { courseId: string }) {
  const [data, setData] = useState<QuizListResponse | null>(null)
  const [activeQuiz, setActiveQuiz] = useState<StudentQuiz | null>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [attemptQuestions, setAttemptQuestions] = useState<AttemptQuestion[]>([])
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const quizShellRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await fetch(`/api/student/quizzes?courseId=${courseId}`, {
        credentials: 'same-origin',
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to load assessments')
      setData(body)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessments')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    void load()
  }, [load])

  const logIntegrity = useCallback(
    async (eventType: string) => {
      if (!activeQuiz || !attemptId) return
      try {
        await fetch(`/api/student/quizzes/${activeQuiz.id}/integrity`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attemptId, eventType }),
        })
      } catch {
        /* best effort */
      }
    },
    [activeQuiz, attemptId]
  )

  useEffect(() => {
    if (!attemptId || !expiresAt) {
      setTimeLeftMs(null)
      return
    }

    const tick = () => {
      const left = new Date(expiresAt).getTime() - Date.now()
      setTimeLeftMs(left)
      if (left <= 0) {
        void logIntegrity('attempt_expired')
      }
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [attemptId, expiresAt, logIntegrity])

  useEffect(() => {
    if (!attemptId || gradeResult) return

    const onVisibility = () => {
      void logIntegrity(document.hidden ? 'tab_hidden' : 'tab_visible')
    }
    const onBlur = () => void logIntegrity('window_blur')
    const onFocus = () => void logIntegrity('window_focus')

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
    }
  }, [attemptId, gradeResult, logIntegrity])

  useEffect(() => {
    const shell = quizShellRef.current
    if (!shell || !attemptId || gradeResult) return

    const blockClipboard = (event: ClipboardEvent) => {
      event.preventDefault()
      void logIntegrity(event.type === 'paste' ? 'paste_blocked' : 'copy_blocked')
    }

    const blockMenu = (event: Event) => {
      event.preventDefault()
      void logIntegrity('context_menu_blocked')
    }

    shell.addEventListener('paste', blockClipboard)
    shell.addEventListener('copy', blockClipboard)
    shell.addEventListener('cut', blockClipboard)
    shell.addEventListener('contextmenu', blockMenu)

    return () => {
      shell.removeEventListener('paste', blockClipboard)
      shell.removeEventListener('copy', blockClipboard)
      shell.removeEventListener('cut', blockClipboard)
      shell.removeEventListener('contextmenu', blockMenu)
    }
  }, [attemptId, gradeResult, logIntegrity])

  const startQuiz = async (quiz: StudentQuiz) => {
    setStarting(true)
    setError('')
    setGradeResult(null)
    setAnswers({})

    try {
      const res = await fetch(`/api/student/quizzes/${quiz.id}/start`, {
        method: 'POST',
        credentials: 'same-origin',
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Could not start assessment')

      setActiveQuiz(quiz)
      setAttemptId(body.attemptId)
      setAttemptQuestions(body.questions ?? [])
      setExpiresAt(body.expiresAt ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start assessment')
    } finally {
      setStarting(false)
    }
  }

  const closeQuiz = () => {
    setActiveQuiz(null)
    setAttemptId(null)
    setAttemptQuestions([])
    setExpiresAt(null)
    setGradeResult(null)
    setAnswers({})
    void load()
  }

  const submitQuiz = async () => {
    if (!activeQuiz || !attemptId) return

    if (timeLeftMs != null && timeLeftMs <= 0) {
      setError('Time is up for this attempt.')
      return
    }

    const unanswered = attemptQuestions.filter((q) => answers[q.id] === undefined)
    if (unanswered.length > 0) {
      setError(`Answer all questions before submitting (${unanswered.length} remaining)`)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/student/quizzes/${activeQuiz.id}/submit`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, answers }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Submission failed')
      setGradeResult(body)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="mt-6 border-slate-200">
        <CardContent className="py-6 text-sm text-slate-600">Loading assessments…</CardContent>
      </Card>
    )
  }

  if (!data || data.quizzes.length === 0) {
    return (
      <Card className="mt-6 border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
            <ClipboardCheck className="h-5 w-5 text-[var(--brand-navy)]" />
            Assessments
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          {error || 'Your lecturer has not published any assessments yet. Check back after finishing the lessons.'}
        </CardContent>
      </Card>
    )
  }

  if (activeQuiz && attemptId) {
    return (
      <Card className="mt-6 border-slate-200" ref={quizShellRef}>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg text-slate-900">{activeQuiz.title}</CardTitle>
            <div className="flex items-center gap-2">
              {timeLeftMs != null ? (
                <Badge
                  className={cn(
                    'font-mono',
                    timeLeftMs < 60000 ? 'bg-red-100 text-red-900' : 'bg-slate-100 text-slate-900'
                  )}
                >
                  <Timer className="h-3.5 w-3.5 mr-1" />
                  {formatCountdown(timeLeftMs)}
                </Badge>
              ) : null}
              <Button type="button" variant="ghost" size="sm" className="text-slate-700" onClick={closeQuiz}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Exit
              </Button>
            </div>
          </div>
          {!gradeResult ? (
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <Shield className="h-4 w-4 text-[var(--brand-navy)]" />
              Secured session — questions are shuffled. Copy/paste is disabled. Stay on this tab.
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5">
          {gradeResult ? (
            <>
              <div
                className={cn(
                  'rounded-lg border p-4',
                  gradeResult.passed ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
                )}
              >
                <p className="font-semibold text-slate-900 flex items-center gap-2">
                  {gradeResult.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-700" />
                  ) : (
                    <XCircle className="h-5 w-5 text-amber-700" />
                  )}
                  Score: {gradeResult.score}% ({gradeResult.correctCount}/{gradeResult.totalQuestions} correct)
                </p>
                <p className="text-sm text-slate-700 mt-1">
                  {gradeResult.passed
                    ? `You passed (pass mark ${activeQuiz.passing_score}%).`
                    : `Below the ${activeQuiz.passing_score}% pass mark.`}{' '}
                  Attempt #{gradeResult.attemptCount}.
                  {!gradeResult.revealAnswers
                    ? ' Correct answers are hidden until you use all attempts or pass (per course policy).'
                    : ''}
                </p>
                {gradeResult.integrityFlags.length > 0 ? (
                  <p className="text-xs text-amber-800 mt-2">
                    Integrity note: {gradeResult.integrityFlags.join(', ').replaceAll('_', ' ')}
                  </p>
                ) : null}
              </div>

              {gradeResult.revealAnswers ? (
                <div className="space-y-4">
                  {gradeResult.results.map((result, index) => (
                    <div
                      key={result.questionId}
                      className={cn(
                        'rounded-lg border p-4',
                        result.correct ? 'border-green-200' : 'border-red-200'
                      )}
                    >
                      <p className="font-medium text-slate-900 mb-2">
                        {index + 1}. {result.question}
                      </p>
                      <ul className="space-y-1.5">
                        {result.options.map((option, optIndex) => {
                          const isCorrect = optIndex === result.correctIndex
                          const isChosen = optIndex === result.chosenIndex
                          return (
                            <li
                              key={optIndex}
                              className={cn(
                                'text-sm rounded-md px-3 py-2 border flex items-center gap-2',
                                isCorrect
                                  ? 'bg-green-50 border-green-300 text-green-900 font-medium'
                                  : isChosen
                                    ? 'bg-red-50 border-red-300 text-red-900'
                                    : 'border-slate-200 text-slate-700'
                              )}
                            >
                              {option}
                            </li>
                          )
                        })}
                      </ul>
                      {result.explanation ? (
                        <p className="text-xs text-slate-600 mt-2 bg-slate-50 rounded-md p-2">
                          <strong>Explanation:</strong> {result.explanation}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {!gradeResult.passed && activeQuiz.security.attemptsRemaining > 0 ? (
                  <Button
                    type="button"
                    className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
                    onClick={() => void startQuiz(activeQuiz)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try again
                  </Button>
                ) : null}
                <Button type="button" variant="outline" className="text-slate-900 border-slate-300" onClick={closeQuiz}>
                  Back to all assessments
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                {attemptQuestions.length} questions · pass mark {activeQuiz.passing_score}%
              </p>

              {attemptQuestions.map((question, index) => (
                <fieldset key={question.id} className="rounded-lg border border-slate-200 p-4">
                  <legend className="font-medium text-slate-900 px-1">
                    {index + 1}. {question.question}
                  </legend>
                  <div className="space-y-1.5 mt-2">
                    {question.options.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className={cn(
                          'flex items-center gap-3 text-sm rounded-md px-3 py-2 border cursor-pointer transition',
                          answers[question.id] === optIndex
                            ? 'border-[var(--brand-navy)] bg-slate-100 font-medium text-slate-900'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          className="accent-[var(--brand-navy)]"
                          checked={answers[question.id] === optIndex}
                          onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: optIndex }))}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}

              {error ? <p className="text-sm text-red-700">{error}</p> : null}

              <Button
                type="button"
                className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
                disabled={submitting || (timeLeftMs != null && timeLeftMs <= 0)}
                onClick={submitQuiz}
              >
                {submitting ? 'Submitting…' : 'Submit answers'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-6 border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
          <ClipboardCheck className="h-5 w-5 text-[var(--brand-navy)]" />
          Assessments
        </CardTitle>
        <p className="text-sm text-slate-600 flex items-center gap-2">
          <Shield className="h-4 w-4 text-[var(--brand-navy)]" />
          Secured assessments — complete all lessons first, limited attempts, timed sessions, server-side grading.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {!data.lessonProgress.complete && data.lessonProgress.total > 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Complete all lessons before starting assessments ({data.lessonProgress.completed}/
            {data.lessonProgress.total} done).
          </div>
        ) : null}

        <div className="rounded-lg border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-slate-900">
              {data.completedQuizzes} of {data.totalQuizzes} assessments completed
            </p>
            {data.averageScore != null ? (
              <Badge className="bg-slate-100 text-slate-900">Average: {data.averageScore}%</Badge>
            ) : null}
          </div>
          <Progress value={data.totalQuizzes ? (data.completedQuizzes / data.totalQuizzes) * 100 : 0} className="h-2" />
        </div>

        {data.certificate ? (
          data.certificate.status === 'issued' ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-green-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-green-700" />
                Certificate issued — code <span className="font-mono">{data.certificate.code}</span>
              </p>
              <Link href="/student/certificates">
                <Button size="sm" className="bg-[var(--brand-navy)] text-white">
                  View certificate
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-700" />
                Your lecturer confirmed your pass — certificate awaiting admin approval.
              </p>
            </div>
          )
        ) : null}

        <ul className="space-y-3">
          {data.quizzes.map((quiz) => (
            <li
              key={quiz.id}
              className="rounded-lg border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium text-slate-900">{quiz.title}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {quiz.questionCount} questions · pass {quiz.passing_score}% · max{' '}
                  {quiz.security.maxAttempts} attempts
                  {quiz.security.timeLimitMinutes
                    ? ` · ${quiz.security.timeLimitMinutes} min limit`
                    : ''}
                </p>
                {quiz.mySubmission ? (
                  <Badge
                    className={cn(
                      'mt-1.5',
                      quiz.mySubmission.passed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-900'
                    )}
                  >
                    {quiz.mySubmission.score}% — {quiz.mySubmission.passed ? 'Passed' : 'Below pass mark'}
                    {quiz.mySubmission.locked ? ' · Locked' : ''}
                  </Badge>
                ) : (
                  <Badge className="mt-1.5 bg-slate-100 text-slate-700">Not attempted</Badge>
                )}
                {quiz.security.blockReason && !quiz.mySubmission?.locked ? (
                  <p className="text-xs text-slate-500 mt-1">{quiz.security.blockReason}</p>
                ) : null}
              </div>
              <Button
                type="button"
                className={cn(
                  quiz.mySubmission?.locked
                    ? 'border-slate-300 text-slate-500'
                    : quiz.security.canStart
                      ? 'bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90'
                      : 'border-slate-300 text-slate-700'
                )}
                variant={quiz.security.canStart && !quiz.mySubmission?.locked ? 'default' : 'outline'}
                disabled={starting || !quiz.security.canStart || Boolean(quiz.mySubmission?.locked)}
                onClick={() => void startQuiz(quiz)}
              >
                {quiz.mySubmission?.locked ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Locked
                  </>
                ) : quiz.security.inProgressAttemptId ? (
                  'Resume'
                ) : quiz.mySubmission ? (
                  quiz.security.attemptsRemaining > 0 ? 'Try again' : 'No attempts left'
                ) : (
                  'Start assessment'
                )}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
