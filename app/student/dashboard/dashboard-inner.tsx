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
  Calculator,
  Clock,
  ExternalLink,
  PlayCircle,
  Video,
} from 'lucide-react'
import { COMPANY } from '@/lib/company/constants'
import { AccessCountdown } from '@/components/student/access-countdown'
import { StudentBrowseCourses } from '@/components/student/student-browse-courses'
import { StudentAnnouncementsPanel } from '@/components/student/student-announcements-panel'
import { StudentGradesPanel } from '@/components/student/student-grades-panel'
import { NotificationBadge } from '@/components/ui/notification-badge'

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
        <p className="text-slate-600">Loading your courses…</p>
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
  const totalLessons = portal.activeCourses.reduce((n, c) => n + c.lessons.length, 0)
  const completedLessons = portal.activeCourses.reduce((n, c) => n + c.progress.completedCount, 0)

  const notificationItems = [
    ...portal.pendingEnrollments.map((p) => ({
      id: `pending-${p.id}`,
      title: p.courseTitle,
      detail: `${p.statusLabel} — unlocks after MoMo verification`,
      href: '/payment-instructions',
      count: 1,
    })),
    ...portal.rejectedEnrollments.map((p) => ({
      id: `rejected-${p.id}`,
      title: p.courseTitle,
      detail: p.rejectionReason ? `Not verified — ${p.rejectionReason}` : 'Payment not verified — resubmit',
      href: `/student/courses/${p.courseId}/enroll`,
      count: 1,
    })),
    ...portal.upcomingCourses.map((c) => ({
      id: `upcoming-${c.enrollmentId}`,
      title: c.title,
      detail: c.accessStartsAt
        ? `Access opens ${new Date(c.accessStartsAt).toLocaleString()}`
        : 'Access starts soon',
      href: `/student/courses/${c.id}`,
      count: 0,
      countdown: c.accessStartsAt,
    })),
  ]
  const actionCount = portal.pendingEnrollments.length + portal.rejectedEnrollments.length

  return (
    <StudentPortalShell userName={userName}>
      {notificationItems.length > 0 ? (
        <Card className="mb-6 border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Programme status
              </p>
              {actionCount > 0 ? <NotificationBadge count={actionCount} size="sm" /> : null}
            </div>
            <div className="divide-y divide-slate-100">
              {notificationItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 no-underline"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-950 truncate">{item.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-2">
                      <span>{item.detail}</span>
                      {'countdown' in item && item.countdown ? (
                        <>
                          <Clock className="h-3 w-3" />
                          <AccessCountdown targetIso={item.countdown as string} />
                        </>
                      ) : null}
                    </p>
                  </div>
                  {item.count > 0 ? <NotificationBadge count={item.count} size="sm" /> : null}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === 'browse' ? (
        <StudentBrowseCourses
          courses={portal.catalogCourses}
          enrollEligibility={portal.enrollEligibility}
        />
      ) : tab === 'webinars' ? (
        <WebinarsTab webinars={portal.webinars} locked={portal.activeCourses.length === 0} />
      ) : tab === 'announcements' ? (
        <StudentAnnouncementsPanel feed={portal.announcementFeed} />
      ) : tab === 'grades' ? (
        <StudentGradesPanel />
      ) : (
        <CoursesTab
          courses={portal.activeCourses}
          upcoming={portal.upcomingCourses}
          expired={portal.expiredCourses}
          totalLessons={totalLessons}
          completedLessons={completedLessons}
        />
      )}
    </StudentPortalShell>
  )
}

function CoursesTab({
  courses,
  upcoming,
  expired,
  totalLessons,
  completedLessons,
}: {
  courses: StudentPortalData['activeCourses']
  upcoming: StudentPortalData['upcomingCourses']
  expired: StudentPortalData['expiredCourses']
  totalLessons: number
  completedLessons: number
}) {
  if (courses.length === 0 && upcoming.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-4 py-12">
        <BookOpen className="h-12 w-12 mx-auto text-slate-400" />
        <h1 className="text-2xl font-bold text-[var(--brand-navy)]">Your learning library</h1>
        <p className="text-slate-600">
          Browse programmes, enroll with your account, pay via MTN MoMo, and upload your receipt. Once{' '}
          {COMPANY.brandName} approves payment, your courses appear here.
        </p>
        <Link href="/student/courses?track=training">
          <Button className="bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
            Browse programmes & enroll
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">My courses</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <p className="text-sm text-slate-600">Active courses</p>
            <p className="text-3xl font-bold text-[var(--brand-navy)]">{courses.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <p className="text-sm text-slate-600">Lessons completed</p>
            <p className="text-3xl font-bold text-[var(--brand-navy)]">
              {completedLessons}
              <span className="text-lg text-slate-500 font-normal"> / {totalLessons}</span>
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <p className="text-sm text-slate-600">Webinars</p>
            <p className="text-3xl font-bold text-[var(--brand-navy)]">
              {courses.length ? 'Unlocked' : 'Locked'}
            </p>
          </CardContent>
        </Card>
        <Link href="/student/tools" className="no-underline hover:no-underline">
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

      <h3 className="text-lg font-semibold text-slate-900">Continue learning</h3>
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
              <Badge className="w-fit mb-2 bg-green-100 text-green-800">Active</Badge>
              <CardTitle className="text-lg leading-snug text-slate-900">{course.title}</CardTitle>
              <p className="text-xs text-slate-600">{course.accessLabel}</p>
              {course.difficulty ? (
                <p className="text-xs text-slate-500">{course.difficulty}</p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 line-clamp-2">{course.description}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>
                    {course.progress.completedCount}/{course.progress.totalLessons} lessons
                  </span>
                  {course.duration ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {course.duration}
                    </span>
                  ) : null}
                </div>
                <Progress value={course.progress.percent} className="h-1.5" />
              </div>
              <Link href={`/student/courses/${course.id}`}>
                <Button className="w-full bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy)]/90">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {course.progress.percent > 0 && course.progress.percent < 100
                    ? 'Continue learning'
                    : course.lessons.length
                      ? 'Open course'
                      : 'View course'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {expired.length > 0 ? (
        <div className="mt-10 space-y-3">
          <h2 className="text-lg font-bold text-slate-700">Past courses</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {expired.map((course) => (
              <Card key={course.enrollmentId} className="opacity-75">
                <CardHeader className="pb-2">
                  <Badge variant="outline" className="w-fit mb-2">Expired</Badge>
                  <CardTitle className="text-base">{course.title}</CardTitle>
                  <p className="text-xs text-slate-600">{course.accessLabel}</p>
                </CardHeader>
                <CardContent>
                  <Link href="/contact">
                    <Button size="sm" variant="outline">Contact us to renew</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
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
          <Video className="h-10 w-10 mx-auto text-slate-500" />
          <p className="font-medium text-slate-900">Webinars locked</p>
          <p className="text-sm text-slate-600">
            Webinars and live sessions unlock after your course payment is approved.
          </p>
          <Link href="/student/courses?track=training"><Button variant="outline">Browse programmes</Button></Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900">Webinars & live sessions</h2>
      {webinars.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-slate-600">No webinars scheduled yet.</CardContent></Card>
      ) : (
        webinars.map((w) => (
          <Card key={w.id}>
            <CardHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${w.is_paid ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                  {w.is_paid ? `Paid · ${Number(w.price ?? 0).toLocaleString()} RWF` : 'Free'}
                </span>
                {w.host_name ? (
                  <span className="text-xs text-slate-600">Host: {w.host_name}</span>
                ) : null}
              </div>
              <CardTitle className="text-lg">{w.title}</CardTitle>
              {w.scheduled_at ? (
                <p className="text-sm text-slate-600">
                  {new Date(w.scheduled_at).toLocaleString()}
                </p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">{w.description}</p>
              <div className="flex flex-wrap gap-2">
                {w.meeting_link ? (
                  <Button asChild size="sm" className="bg-[var(--brand-navy)] text-white">
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
