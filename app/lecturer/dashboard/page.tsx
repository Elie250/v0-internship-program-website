'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, logoutUser } from '@/app/actions/auth-service'
import { getLecturerAssignedCourses } from '@/app/actions/lecturer-courses'
import type { Course } from '@/types/platform'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CourseLessonManager } from '@/components/learning/course-lesson-manager'
import { LecturerAssessmentsPanel } from '@/components/lecturer/lecturer-assessments-panel'
import { BookOpen, Users, LogOut, Home } from 'lucide-react'

export default function LecturerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<{ firstName?: string; lastName?: string; role: string } | null>(
    null
  )
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const currentUser = await getCurrentUser()

      if (
        !currentUser ||
        (currentUser.role !== 'lecturer' && currentUser.role !== 'instructor')
      ) {
        router.push('/auth/login?role=lecturer')
        return
      }

      setUser(currentUser)

      const result = await getLecturerAssignedCourses()
      if (!result.success) {
        setError(result.error)
      } else {
        setCourses(result.courses)
        setSelectedCourseId(result.courses[0]?.id ?? null)
      }
      setIsLoading(false)
    }

    load()
  }, [router])

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

  const publishedCount = courses.filter((c) => c.status === 'published').length
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Lecturer Dashboard</h1>
            <p className="text-sm text-slate-600">
              Welcome, {user.firstName} {user.lastName}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="text-slate-800" onClick={() => router.push('/')}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              variant="ghost"
              className="text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error ? (
          <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </p>
        ) : null}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-900">Assigned programmes</CardTitle>
              <BookOpen className="w-4 h-4 text-[var(--brand-navy)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{courses.length}</div>
              <p className="text-xs text-slate-600 mt-1">Courses assigned by admin</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-900">Published</CardTitle>
              <BookOpen className="w-4 h-4 text-[var(--brand-navy)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{publishedCount}</div>
              <p className="text-xs text-slate-600 mt-1">Live on the platform</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="courses" className="space-y-4">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="courses" className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              My programmes
            </TabsTrigger>
            <TabsTrigger value="students" className="data-[state=active]:bg-[var(--brand-navy)] data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Students
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-4">
            {courses.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="pt-6 text-center text-slate-600">
                  <p>No programmes assigned yet.</p>
                  <p className="text-sm mt-2">
                    An administrator assigns courses to your lecturer account when creating or editing
                    a programme.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-[280px_1fr] gap-6">
                <div className="space-y-2">
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
                    </button>
                  ))}
                </div>
                {selectedCourse ? (
                  <div className="space-y-6">
                    <Card className="border-slate-200">
                      <CardHeader>
                        <CardTitle className="text-slate-900">{selectedCourse.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CourseLessonManager courseId={selectedCourse.id} mode="lecturer" />
                      </CardContent>
                    </Card>
                    <LecturerAssessmentsPanel courseId={selectedCourse.id} />
                  </div>
                ) : null}
              </div>
            )}
          </TabsContent>

          <TabsContent value="students">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-900">Your students</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Enrollment lists per assigned programme — coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
