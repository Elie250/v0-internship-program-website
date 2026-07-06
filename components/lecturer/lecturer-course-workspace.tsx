'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logoutUser } from '@/app/actions/auth-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { CourseLessonManager } from '@/components/learning/course-lesson-manager'
import { LecturerQuizBuilder } from '@/components/lecturer/lecturer-quiz-builder'
import { LecturerResultsPanel } from '@/components/lecturer/lecturer-results-panel'
import { PROGRAM_TYPE_LABELS } from '@/lib/enrollment/program-types'
import type { ProgramType } from '@/lib/enrollment/program-types'
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Home,
  LogOut,
  Users,
  Video,
} from 'lucide-react'

type CourseDetail = {
  id: string
  title: string
  description: string | null
  status: string
  program_type?: ProgramType
  pricing: number | null
  duration: string | null
  scheduled_at?: string | null
  location?: string | null
  meeting_link?: string | null
  enrollment_stats: { total: number; admitted: number; pending: number }
}

type Enrollment = {
  id: string
  applicant_name: string
  applicant_email: string
  applicant_phone: string | null
  status: string
  admitted_at: string | null
  created_at: string
}

type StudentProgress = {
  enrollmentId: string
  userId: string | null
  name: string
  email: string
  status: string
  progressPercent: number
  completedLessons: number
  totalLessons: number
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    admitted: 'bg-green-100 text-green-800',
    payment_pending_review: 'bg-amber-100 text-amber-900',
    payment_rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-slate-200 text-slate-700',
  }
  return map[status] ?? 'bg-slate-100 text-slate-800'
}

export function LecturerCourseWorkspace({ courseId }: { courseId: string }) {
  const router = useRouter()
  const [user, setUser] = useState<{ firstName?: string; lastName?: string } | null>(null)
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([])
  const [lessonCount, setLessonCount] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const coursesRes = await fetch('/api/lecturer/courses', { credentials: 'same-origin' })
      const coursesData = await coursesRes.json()
      if (!coursesRes.ok) throw new Error(coursesData.error || 'Failed to load course')

      const match = (Array.isArray(coursesData) ? coursesData : []).find(
        (c: CourseDetail) => c.id === courseId
      )
      if (!match) throw new Error('Program not found or not assigned to you.')
      setCourse(match)

      const [enrollRes, progressRes] = await Promise.all([
        fetch(`/api/lecturer/courses/${courseId}/enrollments`, { credentials: 'same-origin' }),
        fetch(`/api/lecturer/courses/${courseId}/progress`, { credentials: 'same-origin' }),
      ])
      const enrollData = await enrollRes.json()
      const progressData = await progressRes.json()

      if (!enrollRes.ok) throw new Error(enrollData.error || 'Failed to load students')
      setEnrollments(Array.isArray(enrollData) ? enrollData : [])

      if (progressRes.ok) {
        setStudentProgress(progressData.students ?? [])
        setLessonCount(progressData.lessonCount ?? 0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load classroom')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    const init = async () => {
      const currentUser = await getCurrentUser()
      if (
        !currentUser ||
        (currentUser.role !== 'lecturer' && currentUser.role !== 'instructor')
      ) {
        router.push('/auth/login?role=lecturer')
        return
      }
      setUser(currentUser)
      await load()
    }
    void init()
  }, [router, load])

  const handleLessonFeedback = (message: { type: 'success' | 'error'; text: string }) => {
    if (message.type === 'success') {
      setSuccess(message.text)
      setError('')
      void load()
    } else {
      setError(message.text)
      setSuccess('')
    }
  }

  const handleLogout = async () => {
    await logoutUser()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-700">Loading classroom…</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-red-700 font-medium">{error || 'Course unavailable'}</p>
          <Link href="/lecturer/dashboard">
            <Button variant="outline" className="text-slate-900">Back to dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const progressByEnrollment = new Map(studentProgress.map((s) => [s.enrollmentId, s]))
  const avgProgress =
    studentProgress.length > 0
      ? Math.round(
          studentProgress.reduce((sum, s) => sum + s.progressPercent, 0) / studentProgress.length
        )
      : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-3 px-4 py-4">
          <div className="min-w-0">
            <Link
              href="/lecturer/dashboard"
              className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-1 no-underline"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              All programmes
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{course.title}</h1>
            <p className="text-sm text-slate-600">
              {user?.firstName} {user?.lastName} · Lecturer classroom
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" className="text-slate-800" onClick={() => router.push('/')}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button variant="ghost" className="text-red-700 hover:bg-red-50" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6 app-form-surface">
        {error ? (
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
        ) : null}
        {success ? (
          <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">{success}</p>
        ) : null}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardContent className="pt-4">
              <p className="text-sm text-slate-600">Lessons</p>
              <p className="text-2xl font-bold text-slate-900">{lessonCount}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-4">
              <p className="text-sm text-slate-600">Admitted students</p>
              <p className="text-2xl font-bold text-slate-900">{course.enrollment_stats.admitted}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-4">
              <p className="text-sm text-slate-600">Pending payment</p>
              <p className="text-2xl font-bold text-amber-800">{course.enrollment_stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardContent className="pt-4">
              <p className="text-sm text-slate-600">Avg. progress</p>
              <p className="text-2xl font-bold text-[var(--brand-navy)]">{avgProgress}%</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white border border-slate-200 flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="lessons" className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white">
              <BookOpen className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Lessons
            </TabsTrigger>
            <TabsTrigger value="students" className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Students
            </TabsTrigger>
            <TabsTrigger value="assessments" className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white">
              Assessments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Programme overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                <p>{course.description || 'No description'}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-slate-800">
                    {PROGRAM_TYPE_LABELS[course.program_type ?? 'training']}
                  </Badge>
                  <Badge className={course.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}>
                    {course.status}
                  </Badge>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 pt-2">
                  {course.duration ? <p><strong className="text-slate-900">Duration:</strong> {course.duration}</p> : null}
                  <p>
                    <strong className="text-slate-900">Price:</strong>{' '}
                    {Number(course.pricing ?? 0) > 0
                      ? `${Number(course.pricing).toLocaleString()} RWF`
                      : 'Free'}
                  </p>
                </div>
                {course.meeting_link ? (
                  <a
                    href={course.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--brand-navy)] font-medium underline"
                  >
                    Default live session link <ExternalLink className="w-3 h-3" />
                  </a>
                ) : null}
                <p className="text-xs text-slate-500 pt-2">
                  Publishing and pricing are managed by admin. Use the Lessons tab to upload materials
                  students see in their course player.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lessons">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                  <Video className="w-4 h-4" /> Lessons & materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CourseLessonManager
                  key={courseId}
                  courseId={courseId}
                  mode="lecturer"
                  onFeedback={handleLessonFeedback}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base text-slate-900">Student roster & progress</CardTitle>
              </CardHeader>
              <CardContent>
                {enrollments.length === 0 ? (
                  <p className="text-sm text-slate-600">No enrollments yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-slate-700">
                          <th className="py-2 pr-3 font-semibold">Name</th>
                          <th className="py-2 pr-3 font-semibold">Email</th>
                          <th className="py-2 pr-3 font-semibold">Status</th>
                          <th className="py-2 pr-3 font-semibold min-w-[140px]">Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrollments.map((row) => {
                          const prog = progressByEnrollment.get(row.id)
                          const percent = prog?.progressPercent ?? 0
                          return (
                            <tr key={row.id} className="border-b border-slate-100">
                              <td className="py-3 pr-3 text-slate-900">{row.applicant_name}</td>
                              <td className="py-3 pr-3 text-slate-700">{row.applicant_email}</td>
                              <td className="py-3 pr-3">
                                <Badge className={statusBadge(row.status)}>{row.status}</Badge>
                              </td>
                              <td className="py-3 pr-3">
                                {row.status === 'admitted' && prog ? (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-600">
                                      <span>{prog.completedLessons}/{prog.totalLessons}</span>
                                      <span>{percent}%</span>
                                    </div>
                                    <Progress value={percent} className="h-1.5" />
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-4">
            <LecturerQuizBuilder courseId={courseId} />
            <LecturerResultsPanel courseId={courseId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
