import Link from 'next/link'
import { ProgrammeReportView } from '@/components/student/programme-report-view'
import { Button } from '@/components/ui/button'
import { loadStudentCourseReport } from '@/lib/learning/course-report'
import { getCurrentUser } from '@/app/actions/auth-service'

export default async function StudentProgrammeReportPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const result = await loadStudentCourseReport(courseId)

  if (!result.ok) {
    return (
      <main className="min-h-screen bg-background px-4 py-16">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Programme report</h1>
          <p className="text-sm text-slate-600">{result.message}</p>
          {result.status === 'unauthenticated' ? (
            <Link href={`/auth/login?redirect=${encodeURIComponent(`/student/courses/${courseId}/report`)}`}>
              <Button className="bg-[var(--brand-navy)] text-white">Log in</Button>
            </Link>
          ) : (
            <Link href="/student/dashboard">
              <Button variant="outline" className="text-slate-800 border-slate-300">
                Back to My learning
              </Button>
            </Link>
          )}
        </div>
      </main>
    )
  }

  const user = await getCurrentUser()
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || ''

  return <ProgrammeReportView report={result.report} userName={userName} />
}
