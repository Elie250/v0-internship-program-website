'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/app/actions/auth-service'
import { LecturerPortalShell } from '@/components/lecturer/lecturer-portal-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PROGRAM_TYPE_LABELS } from '@/lib/enrollment/program-types'
import type { ProgramType } from '@/lib/enrollment/program-types'
import { BookOpen, Users, FileBarChart, Calculator } from 'lucide-react'
import { LecturerBroadcastPanel } from '@/components/lecturer/lecturer-broadcast-panel'
import {
  LecturerCreateCourseDialog,
  courseStatusLabel,
  lecturerCourseStatusBadgeClass,
} from '@/components/lecturer/lecturer-create-course-dialog'
import { NotificationBadge } from '@/components/ui/notification-badge'
import {
  isDeliveryPortalRole,
  deliveryLoginRoleForUser,
  isMentorDeliveryRole,
  portalBranding,
} from '@/lib/lecturer/delivery-portal'

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
  pending_certificates?: number
  notification_count?: number
}

export function LecturerDashboardView() {
  const router = useRouter()
  const [userRole, setUserRole] = useState('lecturer')
  const [userName, setUserName] = useState('')
  const [courses, setCourses] = useState<LecturerCourse[]>([])
  const [atRiskCount, setAtRiskCount] = useState(0)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadCourses = useCallback(async () => {
    const res = await fetch('/api/lecturer/courses', { credentials: 'same-origin' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to load programmes')
    setCourses(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    const init = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser || !isDeliveryPortalRole(currentUser.role)) {
        router.push(`/auth/login?role=${deliveryLoginRoleForUser(currentUser?.role ?? 'lecturer')}`)
        return
      }
      setUserRole(currentUser.role)
      setUserName(
        [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') ||
          currentUser.email ||
          (isMentorDeliveryRole(currentUser.role) ? 'Mentor' : 'Lecturer')
      )
      try {
        await loadCourses()
        const studentsRes = await fetch('/api/lecturer/students', { credentials: 'same-origin' })
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json()
          setAtRiskCount(studentsData.summary?.atRisk ?? 0)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    void init()
  }, [router, loadCourses])

  const totalStudents = courses.reduce((sum, c) => sum + c.enrollment_stats.admitted, 0)
  const totalNotifications = courses.reduce((sum, c) => sum + (c.notification_count ?? 0), 0)

  const branding = portalBranding(userRole)
  const isMentor = isMentorDeliveryRole(userRole)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-700">Loading…</p>
      </div>
    )
  }

  return (
    <LecturerPortalShell userName={userName} userRole={userRole}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-950">{branding.programmesLabel}</h1>
              {totalNotifications > 0 ? <NotificationBadge count={totalNotifications} /> : null}
              {atRiskCount > 0 ? (
                <Link href="/lecturer/students" className="inline-flex items-center gap-2 no-underline">
                  <NotificationBadge count={atRiskCount} size="sm" />
                  <span className="text-sm font-medium text-slate-700">at-risk students</span>
                </Link>
              ) : null}
            </div>
            <p className="text-sm text-slate-700 mt-1">
              {isMentor
                ? 'Manage assigned career guidance and mentorship programmes, participants, and sessions.'
                : 'Open a classroom to manage lessons, students, assessments, and reports.'}
            </p>
          </div>
          <LecturerCreateCourseDialog onCreated={loadCourses} isMentor={isMentor} />
        </div>

        {error ? (
          <p className="text-sm text-red-800 bg-red-50 border border-red-300 rounded-md p-3 font-medium">{error}</p>
        ) : null}

        {!isMentor ? (
          <div>
            <h2 className="text-lg font-semibold text-slate-950 mb-3">Broadcast to students</h2>
            <LecturerBroadcastPanel />
          </div>
        ) : null}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-900">
                <BookOpen className="w-4 h-4" /> Programmes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{courses.length}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-900">
                <Users className="w-4 h-4" /> Admitted students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{totalStudents}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-900">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">
                {courses.filter((c) => c.status === 'published').length}
              </p>
            </CardContent>
          </Card>
          <Link href="/lecturer/tools" className="no-underline hover:no-underline">
            <Card className="border-slate-200 h-full hover:border-[var(--brand-navy)]/40 hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <p className="text-sm text-slate-600 flex items-center gap-1.5">
                  <Calculator className="h-4 w-4" />
                  Engineering tools
                </p>
                <p className="text-sm font-semibold text-[var(--brand-navy)] mt-2">
                  Calculators &amp; helpers →
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {courses.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="pt-6 text-center text-slate-700 space-y-3">
              <p>No programmes yet.</p>
              <p className="text-sm">
                Use <strong>Propose new programme</strong> above to submit a course for admin review,
                or ask an administrator to assign you under <strong>Admin → Programs</strong>.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {courses.map((course) => (
              <Card key={course.id} className="border-slate-300 overflow-hidden hover:shadow-md transition-shadow relative">
                {(course.notification_count ?? 0) > 0 ? (
                  <div className="absolute top-3 right-3 z-10">
                    <NotificationBadge count={course.notification_count ?? 0} />
                  </div>
                ) : null}
                <CardHeader className="pb-2 pr-12">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="outline" className="text-slate-800 border-slate-300">
                      {PROGRAM_TYPE_LABELS[course.program_type ?? 'training']}
                    </Badge>
                    <Badge className={lecturerCourseStatusBadgeClass(course.status)}>
                      {courseStatusLabel(course.status)}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg text-slate-950 font-bold">{course.title}</CardTitle>
                  <p className="text-xs text-slate-700 mt-1">
                    {course.enrollment_stats.admitted} admitted · {course.enrollment_stats.pending}{' '}
                    pending
                    {(course.pending_certificates ?? 0) > 0
                      ? ` · ${course.pending_certificates} certificates`
                      : ''}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-700 line-clamp-2">
                    {course.description || 'Manage lessons, students, and assessments in your classroom.'}
                  </p>
                  <Link href={`/lecturer/courses/${course.id}`}>
                    <Button className="w-full bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Open classroom
                    </Button>
                  </Link>
                  <Link href={`/lecturer/courses/${course.id}?tab=reports`}>
                    <Button variant="outline" className="w-full text-slate-800 border-slate-300">
                      <FileBarChart className="w-4 h-4 mr-2" />
                      View reports
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </LecturerPortalShell>
  )
}
