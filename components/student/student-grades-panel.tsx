'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Award, BookOpen } from 'lucide-react'

type GradeCourse = {
  courseId: string
  courseTitle: string
  enrollmentId: string
  progressPercent: number
  completedLessons: number
  totalLessons: number
  quizzes: Array<{ title: string; score: number | null; passed: boolean; attemptCount: number }>
  averageScore: number | null
  attendancePresent: number
  attendanceTotal: number
  certificateStatus: string | null
  certificateCode: string | null
}

export function StudentGradesPanel() {
  const [courses, setCourses] = useState<GradeCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/grades', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { courses: [] }))
      .then((d) => setCourses(d.courses ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-slate-600">Loading grades…</p>

  if (courses.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="py-10 text-center text-slate-600">
          Grades appear once you are admitted to a programme.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <Card key={course.enrollmentId} className="border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {course.courseTitle}
              </CardTitle>
              <Link
                href={`/student/courses/${course.courseId}`}
                className="text-xs font-medium text-[var(--brand-navy)] underline"
              >
                Open classroom
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Lesson progress</span>
                <span>
                  {course.completedLessons}/{course.totalLessons} ({course.progressPercent}%)
                </span>
              </div>
              <Progress value={course.progressPercent} className="h-1.5" />
            </div>

            {course.quizzes.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Assessments</p>
                <ul className="space-y-1.5">
                  {course.quizzes.map((q) => (
                    <li
                      key={q.title}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm border border-slate-100 rounded-md px-2 py-1.5"
                    >
                      <span className="text-slate-800">{q.title}</span>
                      <span className="text-xs">
                        {q.score != null ? (
                          <Badge className={q.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {q.score}% {q.passed ? 'Pass' : 'Fail'}
                          </Badge>
                        ) : (
                          <span className="text-slate-500">Not taken</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                {course.averageScore != null ? (
                  <p className="text-xs text-slate-600 mt-2">
                    Average score: <strong className="text-slate-900">{course.averageScore}%</strong>
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No quizzes published yet.</p>
            )}

            <p className="text-xs text-slate-600">
              Live attendance: {course.attendancePresent}/{course.attendanceTotal} sessions marked present
            </p>

            {course.certificateCode ? (
              <p className="text-xs flex items-center gap-1.5 text-[var(--brand-navy)] font-medium">
                <Award className="h-3.5 w-3.5" />
                Certificate {course.certificateStatus === 'pending_admin' ? 'pending admin approval' : 'issued'} —{' '}
                {course.certificateCode}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
