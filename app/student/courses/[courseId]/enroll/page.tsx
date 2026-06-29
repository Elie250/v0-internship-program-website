import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCourseById } from '@/lib/platform/queries'
import { getCurrentUser } from '@/app/actions/auth-service'
import { getStudentPortalData } from '@/app/actions/student-learning'
import { StudentPortalShell } from '@/components/student/student-portal-shell'
import { CourseEnrollForm } from '@/components/learning/course-enroll-form'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { isFreeProgram, PROGRAM_TYPE_LABELS, CAREER_PROGRAM_TYPES } from '@/lib/enrollment/program-types'

export default async function StudentCourseEnrollPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const course = await getCourseById(courseId)
  if (!course || course.status !== 'published') {
    redirect('/student/courses')
  }

  const user = await getCurrentUser()
  if (!user?.id) {
    redirect(`/auth/login?redirect=${encodeURIComponent(`/student/courses/${courseId}/enroll`)}`)
  }

  if (user.role !== 'student' && user.role !== 'registered') {
    redirect('/student/dashboard')
  }

  const portal = await getStudentPortalData()
  if (!portal.success) {
    redirect('/auth/login')
  }

  const catalogItem = portal.data.catalogCourses.find((c) => c.id === courseId)
  const canEnroll = catalogItem?.action === 'enroll' || catalogItem?.action === 'retry'
  const blockReason =
    catalogItem?.statusNote ??
    portal.data.enrollEligibility.reason ??
    'You cannot enroll in this course right now.'

  const userName =
    [portal.data.user.firstName, portal.data.user.lastName].filter(Boolean).join(' ') ||
    portal.data.user.email

  const price = Number(course.pricing ?? 0)
  const free = isFreeProgram(price)
  const programType = course.program_type ?? 'training'
  const backHref =
    programType === 'internship'
      ? '/student/courses?track=internship'
      : CAREER_PROGRAM_TYPES.includes(programType)
        ? `/student/courses?track=career&type=${programType}`
        : '/student/courses?track=training'

  return (
    <StudentPortalShell userName={userName}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-xl text-on-dark bg-[var(--brand-navy)] px-6 py-8">
          <p className="text-white/80 text-sm mb-1">{PROGRAM_TYPE_LABELS[programType]} enrollment</p>
          <h1 className="text-2xl font-bold text-white">{course.title}</h1>
          <p className="text-white/90 mt-2 text-sm">
            {free ? 'Free — instant access' : `${price.toLocaleString()} RWF`} · {user.email}
          </p>
        </div>

        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="text-slate-800 hover:text-slate-950">
            ← Back to programmes
          </Button>
        </Link>

        {!canEnroll ? (
          <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-950">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-700" />
            <div>
              <p className="font-semibold text-red-900">Enrollment not available</p>
              <p className="mt-1 text-red-800">{blockReason}</p>
              <Link href="/student/dashboard" className="inline-block mt-3">
                <Button size="sm" variant="outline">Go to my dashboard</Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className={`flex items-center gap-2 text-sm rounded-lg border px-3 py-2 w-fit ${
              free
                ? 'text-green-900 bg-green-50 border-green-200'
                : 'text-blue-900 bg-blue-50 border-blue-200'
            }`}>
              <CheckCircle2 className={`h-4 w-4 shrink-0 ${free ? 'text-green-700' : 'text-blue-700'}`} />
              {free
                ? 'Free programme — confirm your details to enroll instantly'
                : 'Account verified — complete MoMo payment below'}
            </div>
            <CourseEnrollForm
              course={course}
              user={{
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: portal.data.user.phone,
              }}
            />
          </>
        )}
      </div>
    </StudentPortalShell>
  )
}
