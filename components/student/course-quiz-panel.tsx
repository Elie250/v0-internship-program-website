'use client'

import { useCallback, useEffect, useState } from 'react'
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
  RotateCcw,
  XCircle,
} from 'lucide-react'

type StudentQuiz = {
  id: string
  title: string
  description: string | null
  passing_score: number
  questionCount: number
  questions: Array<{ id: string; question: string; options: string[] }>
  mySubmission: {
    score: number
    passed: boolean
    attemptCount: number
    correctCount: number | null
    totalQuestions: number | null
    submittedAt: string | null
  } | null
}

type QuizListResponse = {
  quizzes: StudentQuiz[]
  averageScore: number | null
  completedQuizzes: number
  totalQuizzes: number
  certificate: { code: string; issuedAt: string } | null
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
  results: GradedAnswer[]
}

export function CourseQuizPanel({ courseId }: { courseId: string }) {
  const [data, setData] = useState<QuizListResponse | null>(null)
  const [activeQuiz, setActiveQuiz] = useState<StudentQuiz | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

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

  const startQuiz = (quiz: StudentQuiz) => {
    setActiveQuiz(quiz)
    setAnswers({})
    setGradeResult(null)
    setError('')
  }

  const closeQuiz = () => {
    setActiveQuiz(null)
    setGradeResult(null)
    setAnswers({})
    void load()
  }

  const submitQuiz = async () => {
    if (!activeQuiz) return
    const unanswered = activeQuiz.questions.filter((q) => answers[q.id] === undefined)
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
        body: JSON.stringify({ answers }),
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

  // Quiz-taking / results view
  if (activeQuiz) {
    return (
      <Card className="mt-6 border-slate-200">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg text-slate-900">{activeQuiz.title}</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-700"
              onClick={closeQuiz}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              All assessments
            </Button>
          </div>
          {activeQuiz.description && !gradeResult ? (
            <p className="text-sm text-slate-600">{activeQuiz.description}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5">
          {gradeResult ? (
            <>
              <div
                className={cn(
                  'rounded-lg border p-4',
                  gradeResult.passed
                    ? 'border-green-200 bg-green-50'
                    : 'border-amber-200 bg-amber-50'
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
                    ? `You passed (pass mark ${activeQuiz.passing_score}%). Your lecturer confirms averages before certificates are issued.`
                    : `Below the ${activeQuiz.passing_score}% pass mark. Review the answers below and retake the assessment.`}
                  {' '}Attempt #{gradeResult.attemptCount}.
                </p>
              </div>

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
                            {isCorrect ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-700" />
                            ) : isChosen ? (
                              <XCircle className="h-4 w-4 shrink-0 text-red-700" />
                            ) : (
                              <span className="h-4 w-4 shrink-0" />
                            )}
                            {option}
                            {isChosen && !isCorrect ? (
                              <span className="ml-auto text-xs font-medium">Your answer</span>
                            ) : null}
                            {isCorrect ? (
                              <span className="ml-auto text-xs font-medium">Correct answer</span>
                            ) : null}
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

              <div className="flex flex-wrap gap-2">
                {!gradeResult.passed ? (
                  <Button
                    type="button"
                    className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
                    onClick={() => startQuiz(activeQuiz)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake assessment
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="text-slate-900 border-slate-300"
                  onClick={closeQuiz}
                >
                  Back to all assessments
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                {activeQuiz.questionCount} questions · pass mark {activeQuiz.passing_score}%. Choose
                one answer per question. Correct answers are shown after you submit.
              </p>

              {activeQuiz.questions.map((question, index) => (
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
                          onChange={() =>
                            setAnswers((prev) => ({ ...prev, [question.id]: optIndex }))
                          }
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
                disabled={submitting}
                onClick={submitQuiz}
              >
                {submitting ? 'Grading…' : 'Submit answers'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  // Quiz list view
  return (
    <Card className="mt-6 border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
          <ClipboardCheck className="h-5 w-5 text-[var(--brand-navy)]" />
          Assessments
        </CardTitle>
        <p className="text-sm text-slate-600">
          Complete every assessment. Your average score across all of them decides your certificate.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <div className="rounded-lg border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-slate-900">
              {data.completedQuizzes} of {data.totalQuizzes} assessments completed
            </p>
            {data.averageScore != null ? (
              <Badge className="bg-slate-100 text-slate-900">
                Average: {data.averageScore}%
              </Badge>
            ) : null}
          </div>
          <Progress
            value={data.totalQuizzes ? (data.completedQuizzes / data.totalQuizzes) * 100 : 0}
            className="h-2"
          />
        </div>

        {data.certificate ? (
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
                  {quiz.questionCount} questions · pass mark {quiz.passing_score}%
                  {quiz.mySubmission
                    ? ` · attempt${quiz.mySubmission.attemptCount > 1 ? 's' : ''}: ${quiz.mySubmission.attemptCount}`
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
                  </Badge>
                ) : (
                  <Badge className="mt-1.5 bg-slate-100 text-slate-700">Not attempted</Badge>
                )}
              </div>
              <Button
                type="button"
                className={cn(
                  quiz.mySubmission?.passed
                    ? 'border-slate-300 text-slate-900'
                    : 'bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90'
                )}
                variant={quiz.mySubmission?.passed ? 'outline' : 'default'}
                onClick={() => startQuiz(quiz)}
              >
                {quiz.mySubmission ? (quiz.mySubmission.passed ? 'Retake' : 'Try again') : 'Start assessment'}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
