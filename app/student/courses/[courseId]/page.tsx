'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { getStudentCourse, type StudentCourse } from '@/app/actions/student-learning'
import { StudentPortalShell } from '@/components/student/student-portal-shell'
import { LessonViewer } from '@/components/student/lesson-viewer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft, FileText, Link2, PlayCircle } from 'lucide-react'

export default function StudentCoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = String(params.courseId)
  const [course, setCourse] = useState<StudentCourse | null>(null)
  const [userName, setUserName] = useState('')
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStudentCourse(courseId).then((result) => {
      if (!result.success) {
        if (result.error.includes('log in')) {
          router.push('/auth/login')
          return
        }
        setError(result.error)
      } else {
        setCourse(result.data)
        setUserName(
          [result.user.firstName, result.user.lastName].filter(Boolean).join(' ') || result.user.email
        )
        if (result.data.lessons[0]) {
          setActiveLessonId(result.data.lessons[0].id)
        }
      }
      setLoading(false)
    })
  }, [courseId, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-muted-foreground">Loading course…</p>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center space-y-3 max-w-md">
          <p className="text-destructive">{error}</p>
          <Link href="/student/dashboard"><Button variant="outline">Back to dashboard</Button></Link>
        </div>
      </div>
    )
  }

  const activeLesson = course.lessons.find((l) => l.id === activeLessonId) ?? course.lessons[0]

  const lessonIcon = (type: string) => {
    if (type === 'video') return PlayCircle
    if (type === 'pdf') return FileText
    return Link2
  }

  return (
    <StudentPortalShell userName={userName}>
      <Link href="/student/dashboard">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2">
          <ChevronLeft className="h-4 w-4 mr-1" />
          My courses
        </Button>
      </Link>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="bg-white rounded-xl border overflow-hidden h-fit lg:sticky lg:top-4">
          <div className="text-on-dark p-4 border-b bg-[var(--brand-navy)]">
            <h1 className="font-bold leading-snug">{course.title}</h1>
            <p className="text-xs text-white/70 mt-1">{course.lessons.length} lessons</p>
          </div>
          <ul className="divide-y max-h-[60vh] overflow-y-auto">
            {course.lessons.length === 0 ? (
              <li className="p-4 text-sm text-muted-foreground">
                No lessons uploaded yet. Check back soon — your instructor is preparing materials.
              </li>
            ) : (
              course.lessons.map((lesson, index) => {
                const Icon = lessonIcon(lesson.content_type)
                return (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      onClick={() => setActiveLessonId(lesson.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 flex items-start gap-3 text-sm hover:bg-muted/50 transition',
                        activeLessonId === lesson.id && 'bg-[#1e3a5f]/5 border-l-2 border-l-[#1e3a5f]'
                      )}
                    >
                      <span className="text-muted-foreground text-xs mt-0.5 w-4">{index + 1}</span>
                      <Icon className="h-4 w-4 shrink-0 text-[#1e3a5f] mt-0.5" />
                      <span>{lesson.title}</span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </aside>

        <div>
          {activeLesson ? (
            <LessonViewer lesson={activeLesson} />
          ) : (
            <div className="bg-white rounded-xl border p-8 text-center text-muted-foreground">
              <p>{course.description || 'Course overview'}</p>
            </div>
          )}
        </div>
      </div>
    </StudentPortalShell>
  )
}
