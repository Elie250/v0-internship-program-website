'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { getStudentCourse, type StudentCourse } from '@/app/actions/student-learning'
import { StudentPortalShell } from '@/components/student/student-portal-shell'
import { CourseAssessmentPanel } from '@/components/student/course-assessment-panel'
import { LessonViewer } from '@/components/student/lesson-viewer'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Link2,
  PlayCircle,
  Radio,
  Download,
} from 'lucide-react'

async function saveLessonProgress(input: {
  courseId: string
  contentId: string
  enrollmentId: string
  completed?: boolean
}) {
  const res = await fetch('/api/student/lesson-progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(input),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to save progress')
}

export default function StudentCoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = String(params.courseId)
  const [course, setCourse] = useState<StudentCourse | null>(null)
  const [userName, setUserName] = useState('')
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [progressSaving, setProgressSaving] = useState(false)

  const loadCourse = useCallback(async () => {
    const result = await getStudentCourse(courseId)
    if (!result.success) {
      if (result.error.includes('log in')) {
        router.push('/auth/login')
        return
      }
      setError(result.error)
      setCourse(null)
    } else {
      setCourse(result.data)
      setUserName(
        [result.user.firstName, result.user.lastName].filter(Boolean).join(' ') ||
          result.user.email
      )
      setActiveLessonId((current) => {
        if (current && result.data.lessons.some((l) => l.id === current)) return current
        return (
          result.data.progress.resumeContentId ??
          result.data.lessons[0]?.id ??
          null
        )
      })
    }
    setLoading(false)
  }, [courseId, router])

  useEffect(() => {
    void loadCourse()
  }, [loadCourse])

  const recordLessonOpen = useCallback(
    async (lessonId: string) => {
      if (!course) return
      try {
        await saveLessonProgress({
          courseId: course.id,
          contentId: lessonId,
          enrollmentId: course.enrollmentId,
        })
      } catch {
        /* progress table may not exist yet */
      }
    },
    [course]
  )

  useEffect(() => {
    if (activeLessonId && course) {
      void recordLessonOpen(activeLessonId)
    }
  }, [activeLessonId, course, recordLessonOpen])

  const handleMarkComplete = async (lessonId: string, completed: boolean) => {
    if (!course) return
    setProgressSaving(true)
    try {
      await saveLessonProgress({
        courseId: course.id,
        contentId: lessonId,
        enrollmentId: course.enrollmentId,
        completed,
      })
      setCourse((prev) => {
        if (!prev) return prev
        const lessons = prev.lessons.map((l) =>
          l.id === lessonId ? { ...l, completed } : l
        )
        const completedCount = lessons.filter((l) => l.completed).length
        const total = lessons.length
        return {
          ...prev,
          lessons,
          progress: {
            ...prev.progress,
            completedCount,
            totalLessons: total,
            percent: total ? Math.round((completedCount / total) * 100) : 0,
            completedContentIds: lessons.filter((l) => l.completed).map((l) => l.id),
          },
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save progress')
    } finally {
      setProgressSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading course…</p>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center space-y-3 max-w-md">
          <p className="text-red-700 font-medium">{error}</p>
          <Link href="/student/dashboard">
            <Button variant="outline" className="text-slate-900 border-slate-300">
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const activeIndex = course.lessons.findIndex((l) => l.id === activeLessonId)
  const activeLesson = course.lessons[activeIndex] ?? course.lessons[0]
  const prevLesson = activeIndex > 0 ? course.lessons[activeIndex - 1] : null
  const nextLesson =
    activeIndex >= 0 && activeIndex < course.lessons.length - 1
      ? course.lessons[activeIndex + 1]
      : null

  const lessonIcon = (type: string, done: boolean) => {
    if (done) return CheckCircle2
    if (type === 'video') return PlayCircle
    if (type === 'webinar') return Radio
    if (type === 'pdf') return FileText
    if (type === 'download') return Download
    return Link2
  }

  return (
    <StudentPortalShell userName={userName}>
      <Link href="/student/dashboard">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-slate-800 hover:text-slate-950">
          <ChevronLeft className="h-4 w-4 mr-1" />
          My learning
        </Button>
      </Link>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h1 className="font-bold text-slate-900">{course.title}</h1>
          <span className="text-sm font-semibold text-[var(--brand-navy)]">
            {course.progress.percent}% complete
          </span>
        </div>
        <Progress value={course.progress.percent} className="h-2" />
        <p className="text-xs text-slate-600 mt-2">
          {course.progress.completedCount} of {course.progress.totalLessons} lessons completed
        </p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="bg-white rounded-xl border border-slate-200 overflow-hidden h-fit lg:sticky lg:top-4 shadow-sm">
          <div className="text-on-dark p-4 border-b bg-[var(--brand-navy)]">
            <p className="font-semibold leading-snug text-white">Course content</p>
            <p className="text-xs text-white/90 mt-1">{course.lessons.length} lessons</p>
          </div>
          <ul className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
            {course.lessons.length === 0 ? (
              <li className="p-4 text-sm text-slate-600">
                No lessons uploaded yet. Your instructor is preparing materials.
              </li>
            ) : (
              course.lessons.map((lesson, index) => {
                const Icon = lessonIcon(lesson.content_type, Boolean(lesson.completed))
                return (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      onClick={() => setActiveLessonId(lesson.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 flex items-start gap-3 text-sm hover:bg-slate-50 transition',
                        activeLessonId === lesson.id &&
                          'bg-slate-100 border-l-2 border-l-[var(--brand-navy)]',
                        lesson.completed && 'bg-green-50/50'
                      )}
                    >
                      <span className="text-slate-500 text-xs mt-0.5 w-4">{index + 1}</span>
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 mt-0.5',
                          lesson.completed ? 'text-green-700' : 'text-[var(--brand-navy)]'
                        )}
                      />
                      <span className="text-slate-900 font-medium">{lesson.title}</span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </aside>

        <div className="space-y-4">
          {activeLesson ? (
            <>
              <LessonViewer
                lesson={activeLesson}
                courseId={course.id}
                enrollmentId={course.enrollmentId}
                completed={Boolean(activeLesson.completed)}
                progressSaving={progressSaving}
                onProgress={(completed) => void handleMarkComplete(activeLesson.id, completed)}
              />
              <div className="flex justify-between gap-2">
                {prevLesson ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-slate-900 border-slate-300"
                    onClick={() => setActiveLessonId(prevLesson.id)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                ) : (
                  <span />
                )}
                {nextLesson ? (
                  <Button
                    type="button"
                    className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90"
                    onClick={() => setActiveLessonId(nextLesson.id)}
                  >
                    Next lesson
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-600">
              <p>{course.description || 'Course overview'}</p>
            </div>
          )}
          {course.accessState === 'active' ? (
            <CourseAssessmentPanel enrollmentId={course.enrollmentId} courseTitle={course.title} />
          ) : null}
        </div>
      </div>
    </StudentPortalShell>
  )
}
