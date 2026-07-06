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
import { BookOpen, Users, FileBarChart, Calculator, AlertTriangle } from 'lucide-react'

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

export function LecturerDashboardView() {
  const router = useRouter()
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
      if (
        !currentUser ||
        (currentUser.role !== 'lecturer' && currentUser.role !== 'instructor')
      ) {
        router.push('/auth/login?role=lecturer')
        return
      }
      setUserName(
        [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') ||
          currentUser.email ||
          'Lecturer'
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-700">Loading…</p>
      </div>
    )
  }

  return (
    <LecturerPortalShell userName={userName}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My programmes</h1>
          <p className="text-sm text-slate-600 mt-1">
            Open a classroom to manage lessons, students, assessments, and reports.
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md p-3">{error}</p>
        ) : null}

        {atRiskCount > 0 ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-amber-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  <strong>{atRiskCount}</strong> student(s) inactive for 7+ days across your
                  programmes.
                </span>
              </p>
              <Link href="/lecturer/students">
                <Button size="sm" variant="outline" className="border-amber-400 text-amber-900">
                  View all students
                </Button>
              </Link>
            </CardContent>
          </Card>
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
            <CardContent className="pt-6 text-center text-slate-700 space-y-2">
              <p>No programmes assigned yet.</p>
              <p className="text-sm">
                Ask an administrator to assign you under <strong>Admin → Programs</strong> when
                creating or editing a course.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {courses.map((course) => (
              <Card key={course.id} className="border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="outline" className="text-slate-800 border-slate-300">
                      {PROGRAM_TYPE_LABELS[course.program_type ?? 'training']}
                    </Badge>
                    <Badge
                      className={
                        course.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-900'
                      }
                    >
                      {course.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg text-slate-900">{course.title}</CardTitle>
                  <p className="text-xs text-slate-600 mt-1">
                    {course.enrollment_stats.admitted} admitted · {course.enrollment_stats.pending}{' '}
                    pending
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
