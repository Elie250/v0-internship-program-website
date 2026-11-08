import { ProgrammeReportView } from '@/components/student/programme-report-view'
import { loadAdminProgrammeReportPreview } from '@/lib/admin/programme-reports'
import { getAdminSession } from '@/app/actions/admin-context'

export default async function AdminProgrammeReportPreviewPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const result = await loadAdminProgrammeReportPreview(courseId)
  if (!result.ok) {
    return (
      <main className="max-w-lg space-y-3">
        <h1 className="text-xl font-semibold text-slate-900">Programme report preview</h1>
        <p className="text-sm text-slate-600">{result.error}</p>
      </main>
    )
  }

  const session = await getAdminSession()
  const userName = [session?.user.firstName, session?.user.lastName].filter(Boolean).join(' ') || 'Administrator'

  return (
    <ProgrammeReportView
      report={result.preview.report}
      userName={userName}
      preview={{ publicationStatus: result.preview.publicationStatus }}
    />
  )
}
