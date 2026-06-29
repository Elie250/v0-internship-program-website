'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, logoutUser } from '@/app/actions/auth-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PROGRAM_TYPE_LABELS } from '@/lib/enrollment/program-types'
import type { ProgramType } from '@/lib/enrollment/program-types'
import { CourseLessonManager } from '@/components/learning/course-lesson-manager'
import { LecturerAssessmentsPanel } from '@/components/lecturer/lecturer-assessments-panel'
import {
  BookOpen,
  Users,
  LogOut,
  Home,
  ExternalLink,
  Video,
  LayoutDashboard,
} from 'lucide-react'

type EnrollmentStats = { total: number; admitted: number; pending: number }

type LecturerCourse = {
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
  enrollment_stats: EnrollmentStats
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

function statusBadge(status: string) {
  const map: Record<string, string> = {
    admitted: 'bg-green-100 text-green-800',
    payment_pending_review: 'bg-amber-100 text-amber-900',
    payment_rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-slate-200 text-slate-700',
  }
  return map[status] ?? 'bg-slate-100 text-slate-800'
}

export function LecturerDashboardView() {
  const router = useRouter()
  const [user, setUser] = useState<{
    firstName?: string
    lastName?: string
    role: string
    permissions?: string[]
  } | null>(null)
  const [courses, setCourses] = useState<LecturerCourse[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [panelLoading, setPanelLoading] = useState(false)

  const loadCourses = useCallback(async () => {
    const res = await fetch('/api/lecturer/courses', { credentials: 'same-origin' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to load programmes')
    const list = Array.isArray(data) ? data : []
    setCourses(list)
    setSelectedCourseId((current) => current ?? list[0]?.id ?? null)
    return list
  }, [])

  const loadCoursePanel = useCallback(async (courseId: string) => {
    setPanelLoading(true)
    try {
      const enrollRes = await fetch(`/api/lecturer/courses/${courseId}/enrollments`, {
        credentials: 'same-origin',
      })
      const enrollData = await enrollRes.json()
      if (!enrollRes.ok) throw new Error(enrollData.error || 'Failed to load students')
      setEnrollments(Array.isArray(enrollData) ? enrollData : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course details')
    } finally {
      setPanelLoading(false)
    }
  }, [])

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
      try {
        await loadCourses()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [router, loadCourses])

  useEffect(() => {
    if (selectedCourseId) {
      void loadCoursePanel(selectedCourseId)
    }
  }, [selectedCourseId, loadCoursePanel])

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null
  const totalStudents = courses.reduce((sum, c) => sum + c.enrollment_stats.admitted, 0)
  const canOpenAdmin =
    user?.role === 'admin' || user?.permissions?.includes('admin:access')

  const handleLessonFeedback = (message: { type: 'success' | 'error'; text: string }) => {
    if (message.type === 'success') {
      setSuccess(message.text)
      setError('')
    } else {
      setError(message.text)
      setSuccess('')
    }
  }

  const handleLogout = async () => {
    await logoutUser()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Loading…</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-3 px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Lecturer Dashboard</h1>
            <p className="text-sm text-slate-600">
              Welcome, {user.firstName} {user.lastName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canOpenAdmin ? (
              <Link href="/admin/dashboard/courses">
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Admin panel
                </Button>
              </Link>
            ) : null}
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
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
        ) : null}
        {success ? (
          <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">{success}</p>
        ) : null}

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Assigned programmes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{courses.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" /> Admitted students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalStudents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Published programmes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {courses.filter((c) => c.status === 'published').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-600 space-y-2">
              <p>No programmes assigned yet.</p>
              <p className="text-sm">
                Ask an administrator to assign you under <strong>Admin → Programs</strong> when
                creating or editing a course.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-[280px_1fr] gap-6">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-base">My programmes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {courses.map((course) => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition ${
                      selectedCourseId === course.id
                        ? 'border-[var(--brand-navy)] bg-[var(--brand-navy)]/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-medium text-sm text-slate-900">{course.title}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {PROGRAM_TYPE_LABELS[course.program_type ?? 'training']}
                      </Badge>
                      <Badge
                        className={
                          course.status === 'published'
                            ? 'bg-green-100 text-green-800 text-[10px]'
                            : 'bg-amber-100 text-amber-900 text-[10px]'
                        }
                      >
                        {course.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {course.enrollment_stats.admitted} admitted ·{' '}
                      {course.enrollment_stats.pending} pending payment
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {selectedCourse ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedCourse.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-700">
                    <p>{selectedCourse.description || 'No description'}</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {selectedCourse.duration ? <p><strong>Duration:</strong> {selectedCourse.duration}</p> : null}
                      <p>
                        <strong>Price:</strong>{' '}
                        {Number(selectedCourse.pricing ?? 0) > 0
                          ? `${Number(selectedCourse.pricing).toLocaleString()} RWF`
                          : 'Free'}
                      </p>
                      {selectedCourse.scheduled_at ? (
                        <p>
                          <strong>Starts:</strong>{' '}
                          {new Date(selectedCourse.scheduled_at).toLocaleString()}
                        </p>
                      ) : null}
                      {selectedCourse.location ? (
                        <p><strong>Location:</strong> {selectedCourse.location}</p>
                      ) : null}
                    </div>
                    {selectedCourse.meeting_link ? (
                      <a
                        href={selectedCourse.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[var(--brand-navy)] underline"
                      >
                        Join link <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : null}
                    <p className="text-xs text-slate-500">
                      Publishing and lecturer assignment are managed by admin. You can manage
                      lessons and view enrolled students here.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4" /> Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {panelLoading ? (
                      <p className="text-sm text-slate-500">Loading students…</p>
                    ) : enrollments.length === 0 ? (
                      <p className="text-sm text-slate-600">No enrollments yet for this programme.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-slate-600">
                              <th className="py-2 pr-3">Name</th>
                              <th className="py-2 pr-3">Email</th>
                              <th className="py-2 pr-3">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {enrollments.map((row) => (
                              <tr key={row.id} className="border-b border-slate-100">
                                <td className="py-2 pr-3">{row.applicant_name}</td>
                                <td className="py-2 pr-3">{row.applicant_email}</td>
                                <td className="py-2 pr-3">
                                  <Badge className={statusBadge(row.status)}>{row.status}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Video className="w-4 h-4" /> Lessons & materials
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedCourseId ? (
                      <CourseLessonManager
                        key={selectedCourseId}
                        courseId={selectedCourseId}
                        mode="lecturer"
                        onFeedback={handleLessonFeedback}
                      />
                    ) : null}
                  </CardContent>
                </Card>

                {selectedCourseId ? (
                  <LecturerAssessmentsPanel courseId={selectedCourseId} />
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  )
}
