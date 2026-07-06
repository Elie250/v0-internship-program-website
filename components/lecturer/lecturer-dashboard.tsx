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
import { BookOpen, Users, LogOut, Home } from 'lucide-react'

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
  const [user, setUser] = useState<{
    firstName?: string
    lastName?: string
    role: string
    permissions?: string[]
  } | null>(null)
  const [courses, setCourses] = useState<LecturerCourse[]>([])
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

  const totalStudents = courses.reduce((sum, c) => sum + c.enrollment_stats.admitted, 0)

  const handleLogout = async () => {
    await logoutUser()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-700">Loading…</p>
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

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-900">
                <BookOpen className="w-4 h-4" /> Assigned programmes
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
              <CardTitle className="text-sm font-medium text-slate-900">Published programmes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">
                {courses.filter((c) => c.status === 'published').length}
              </p>
            </CardContent>
          </Card>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
