'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { getStudentPortalData, type StudentPortalData } from '@/app/actions/student-learning'
import { StudentPortalShell } from '@/components/student/student-portal-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BookOpen,
  Clock,
  ExternalLink,
  Lock,
  PlayCircle,
  Video,
} from 'lucide-react'
import { COMPANY } from '@/lib/company/constants'

export default function StudentDashboardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'courses'
  const [portal, setPortal] = useState<StudentPortalData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStudentPortalData().then((result) => {
      if (!result.success) {
        if (result.error.includes('log in')) {
          router.push('/auth/login')
          return
        }
        setError(result.error)
      } else {
        setPortal(result.data)
      }
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-muted-foreground">Loading your courses…</p>
      </div>
    )
  }

  if (error || !portal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <p className="text-destructive">{error || 'Unable to load portal'}</p>
            <Link href="/auth/login"><Button>Log in</Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const userName = [portal.user.firstName, portal.user.lastName].filter(Boolean).join(' ') || portal.user.email
  const totalLessons = portal.admittedCourses.reduce((n, c) => n + c.lessons.length, 0)

  return (
    <StudentPortalShell userName={userName}>
      {portal.pendingEnrollments.length > 0 ? (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-4 space-y-2">
            <p className="font-medium text-amber-900 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Payment pending approval
            </p>
            {portal.pendingEnrollments.map((p) => (
              <p key={p.id} className="text-sm text-amber-800">
                {p.courseTitle} — receipt under review. Materials unlock after admin approves your MoMo payment.
              </p>
            ))}
            <Link href="/payment-instructions">
              <Button size="sm" variant="outline" className="mt-1">Payment instructions</Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {tab === 'webinars' ? (
        <WebinarsTab webinars={portal.webinars} locked={portal.admittedCourses.length === 0} />
      ) : tab === 'announcements' ? (
        <AnnouncementsTab announcements={portal.announcements} />
      ) : (
        <CoursesTab courses={portal.admittedCourses} totalLessons={totalLessons} />
      )}
    </StudentPortalShell>
  )
}

function CoursesTab({
  courses,
  totalLessons,
}: {
  courses: StudentPortalData['admittedCourses']
  totalLessons: number
}) {
  if (courses.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-4 py-12">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Your learning library</h1>
        <p className="text-muted-foreground">
          Enroll in a programme, pay via MTN MoMo, and upload your receipt. Once {COMPANY.brandName} approves
          payment, your courses and materials appear here.
        </p>
        <Link href="/learning">
          <Button className="bg-[#1e3a5f]">Browse courses & apply</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Enrolled courses</p>
            <p className="text-3xl font-bold text-[#1e3a5f]">{courses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Lessons available</p>
            <p className="text-3xl font-bold text-[#1e3a5f]">{totalLessons}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Webinars</p>
            <p className="text-3xl font-bold text-[#1e3a5f]">Unlocked</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold text-[#1e3a5f]">Continue learning</h2>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {courses.map((course) => (
          <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
            {course.thumbnail ? (
              <div className="relative h-36 bg-muted">
                <Image src={course.thumbnail} alt="" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="h-36 bg-[#1e3a5f]/5 flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-[#1e3a5f]/30" />
              </div>
            )}
            <CardHeader className="pb-2">
              <Badge className="w-fit mb-2 bg-green-100 text-green-800">Enrolled</Badge>
              <CardTitle className="text-lg leading-snug">{course.title}</CardTitle>
              {course.difficulty ? (
                <p className="text-xs text-muted-foreground">{course.difficulty}</p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{course.lessons.length} lessons</span>
                  {course.duration ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {course.duration}
                    </span>
                  ) : null}
                </div>
                <Progress value={course.lessons.length ? 100 : 0} className="h-1.5" />
              </div>
              <Link href={`/student/courses/${course.id}`}>
                <Button className="w-full bg-[#1e3a5f]">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {course.lessons.length ? 'Open course' : 'View course'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function WebinarsTab({
  webinars,
  locked,
}: {
  webinars: StudentPortalData['webinars']
  locked: boolean
}) {
  if (locked) {
    return (
      <Card className="max-w-xl mx-auto mt-8">
        <CardContent className="pt-8 text-center space-y-3">
          <Video className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="font-medium">Webinars locked</p>
          <p className="text-sm text-muted-foreground">
            Webinars and live sessions unlock after your course payment is approved.
          </p>
          <Link href="/learning"><Button variant="outline">Apply for a course</Button></Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1e3a5f]">Webinars & live sessions</h2>
      {webinars.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No webinars scheduled yet.</CardContent></Card>
      ) : (
        webinars.map((w) => (
          <Card key={w.id}>
            <CardHeader>
              <CardTitle className="text-lg">{w.title}</CardTitle>
              {w.scheduled_at ? (
                <p className="text-sm text-muted-foreground">
                  {new Date(w.scheduled_at).toLocaleString()}
                </p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{w.description}</p>
              <div className="flex flex-wrap gap-2">
                {w.meeting_link ? (
                  <Button asChild size="sm" className="bg-[#1e3a5f]">
                    <a href={w.meeting_link} target="_blank" rel="noopener noreferrer">
                      Join live <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                ) : null}
                {w.recording_url ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={w.recording_url} target="_blank" rel="noopener noreferrer">
                      Watch recording
                    </a>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

function AnnouncementsTab({ announcements }: { announcements: StudentPortalData['announcements'] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1e3a5f]">Announcements</h2>
      {announcements.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No announcements.</CardContent></Card>
      ) : (
        announcements.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle className="text-base">{a.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</p>
            </CardHeader>
            <CardContent><p className="text-sm">{a.message}</p></CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
