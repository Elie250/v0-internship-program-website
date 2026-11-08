import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { StudentPortalShell } from '@/components/student/student-portal-shell'
import { Button } from '@/components/ui/button'
import { programmeReportShowsClassroomLink } from '@/lib/learning/course-report-access'
import {
  formatReportAccessDate,
  type CourseReport,
} from '@/lib/learning/course-report'

function supplied(value: string | null | undefined) {
  const text = value?.trim()
  if (!text) return <p className="text-sm text-slate-500">Not supplied</p>
  return <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{text}</p>
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-[var(--brand-navy)] mb-4">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{label}</h3>
      {supplied(value)}
    </div>
  )
}

function money(value: number | null): string | null {
  if (value == null || Number.isNaN(value)) return null
  if (value <= 0) return 'Free'
  return `${value.toLocaleString()} RWF`
}

export function ProgrammeReportView({
  report,
  userName,
  preview,
}: {
  report: CourseReport
  userName: string
  preview?: { publicationStatus: 'draft' | 'published' }
}) {
  const hasCurriculum = report.modules.length > 0 || report.ungroupedLessons.length > 0
  const profile = report.profile
  const isPreview = Boolean(preview)

  const body = (
    <>

      <div className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {report.thumbnail ? (
            <div className="course-thumb relative bg-slate-100">
              <Image src={report.thumbnail} alt="" fill className="object-cover" unoptimized />
            </div>
          ) : null}
          <div className="p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-navy)]">
              Programme report
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{report.title}</h1>
            <p className="text-sm text-slate-600 mt-2">{report.categoryName ?? 'Not supplied'}</p>
            <div className="mt-4">{supplied(report.description)}</div>
            {isPreview ? (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {preview?.publicationStatus === 'published'
                  ? 'Admin preview of the published student report. Students still need an admitted enrolment.'
                  : 'Admin preview of a draft. Admitted students do not see this editorial copy until you publish it.'}
              </p>
            ) : programmeReportShowsClassroomLink(report.enrollment.accessState) ? (
              <div className="mt-4">
                <Link href={`/student/courses/${report.courseId}`}>
                  <Button variant="outline" className="text-slate-800 border-slate-300">
                    Open course
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {report.enrollment.accessStartsAt
                  ? `Classroom access begins on ${formatReportAccessDate(report.enrollment.accessStartsAt)}.`
                  : 'Classroom access has not started.'}{' '}
                You can read this programme report now. Lessons stay locked until then.
              </p>
            )}
          </div>
        </section>

        <Section title="Programme overview">
          <div className="grid gap-4">
            <Field label="Overview" value={profile?.overview} />
            <Field label="Purpose" value={profile?.purpose} />
            <Field label="Target audience" value={profile?.targetAudience} />
            <Field label="Entry requirements" value={profile?.entryRequirements} />
          </div>
        </Section>

        <Section title="Learning objectives and outcomes">
          <div className="grid gap-4">
            <Field label="Learning objectives" value={profile?.learningObjectives} />
            <Field label="Learning outcomes" value={profile?.learningOutcomes} />
          </div>
        </Section>

        <Section title="Curriculum">
          {hasCurriculum ? (
            <div className="space-y-4">
              {report.modules.map((module) => (
                <div key={module.id}>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">{module.title}</h3>
                  <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-700">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id}>{lesson.title}</li>
                    ))}
                  </ol>
                </div>
              ))}
              {report.ungroupedLessons.length > 0 ? (
                <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-700">
                  {report.ungroupedLessons.map((lesson) => (
                    <li key={lesson.id}>{lesson.title}</li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-slate-600">Programme curriculum has not been published yet.</p>
          )}
        </Section>

        <Section title="Duration and workload">
          <div className="grid gap-4">
            <Field label="Duration" value={report.duration} />
            <Field label="Workload" value={profile?.workloadDescription} />
            <Field label="Delivery" value={profile?.deliveryMethod} />
          </div>
        </Section>

        <Section title="Trainer">
          {report.trainer ? (
            <div className="flex gap-4">
              {report.trainer.photoUrl ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <Image src={report.trainer.photoUrl} alt="" fill className="object-cover" unoptimized />
                </div>
              ) : null}
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{report.trainer.name}</p>
                {report.trainer.title ? (
                  <p className="text-sm text-slate-600">{report.trainer.title}</p>
                ) : (
                  <p className="text-sm text-slate-500">Not supplied</p>
                )}
                <div className="mt-2">{supplied(report.trainer.bio)}</div>
              </div>
            </div>
          ) : (
            supplied(null)
          )}
        </Section>

        <Section title="Timetable">
          {report.sessions.length === 0 ? (
            <p className="text-sm text-slate-600">No timetable has been published yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {report.sessions.map((session) => (
                <li key={session.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="font-medium text-slate-900">{session.topic}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {session.scheduledLabel || 'Not supplied'}
                    {session.durationMinutes ? ` · ${session.durationMinutes} min` : ''}
                    {session.location ? ` · ${session.location}` : ''}
                  </p>
                  {session.meetingLink ? (
                    <a href={session.meetingLink} className="text-sm text-[var(--brand-navy)]">
                      Meeting link
                    </a>
                  ) : null}
                  {session.recordingUrl ? (
                    <a href={session.recordingUrl} className="block text-sm text-[var(--brand-navy)]">
                      Recording
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {report.hideLiveAccess ? (
            <p className="text-xs text-slate-500 mt-3">
              Live meeting links are hidden because classroom access has ended.
            </p>
          ) : null}
        </Section>

        <Section title="Assessment and certification">
          <div className="grid gap-4">
            <Field label="Assessment" value={profile?.assessmentDescription} />
            {report.assessments.length > 0 ? (
              <ul className="space-y-1 text-sm text-slate-700">
                {report.assessments.map((item) => (
                  <li key={item.id}>
                    {item.title}
                    {item.passingScore != null ? ` · pass mark ${item.passingScore}%` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Not supplied</p>
            )}
            <Field label="Certification" value={profile?.certificationDescription} />
            {isPreview ? (
              <p className="text-sm text-slate-500">Certificates stay on each student enrolment.</p>
            ) : report.certificate ? (
              <p className="text-sm text-slate-700">
                Certificate {report.certificate.code}
                {report.certificate.programTitle ? ` · ${report.certificate.programTitle}` : ''}
                {report.certificate.issuedAt
                  ? ` · issued ${formatReportAccessDate(report.certificate.issuedAt)}`
                  : ''}
              </p>
            ) : (
              <p className="text-sm text-slate-500">No certificate has been issued for this enrolment.</p>
            )}
          </div>
        </Section>

        <Section title="Fees and enrollment">
          <div className="grid gap-4">
            <Field label="Programme price" value={report.cataloguePriceLabel || money(report.pricing)} />
            {report.packageSnapshot ? (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900">Selected package</h3>
                <p className="text-sm text-slate-700">{report.packageSnapshot.name}</p>
                <p className="text-sm text-slate-600">
                  List {money(report.packageSnapshot.listPrice)}
                  {report.packageSnapshot.discountAmount
                    ? ` · Discount ${money(report.packageSnapshot.discountAmount)}`
                    : ''}
                  {' · Agreed '}
                  {money(report.packageSnapshot.finalPrice)}
                </p>
                {report.packageSnapshot.benefits ? (
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans mt-2">
                    {report.packageSnapshot.benefits}
                  </pre>
                ) : null}
              </div>
            ) : null}
            {isPreview ? (
              <p className="text-sm text-slate-500">Amount due stays on each student enrolment.</p>
            ) : (
              <Field label="Your amount due" value={money(report.enrollment.amountDue)} />
            )}
            <p className="text-sm text-slate-600">
              Paid programmes use the existing MTN MoMo receipt review. This report does not add payment plans.
            </p>
          </div>
        </Section>

        {isPreview ? null : (
        <Section title="Your access">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Access starts" value={formatReportAccessDate(report.enrollment.accessStartsAt)} />
            <Field label="Access ends" value={formatReportAccessDate(report.enrollment.accessEndsAt)} />
          </div>
          {report.enrollment.accessState === 'active' ? (
            <p className="text-sm text-slate-600 mt-3">Your classroom is open.</p>
          ) : null}
          {report.enrollment.accessState === 'expired' ? (
            <p className="text-sm text-slate-600 mt-3">Classroom access for this enrolment has ended.</p>
          ) : null}
        </Section>
        )}

        {profile?.additionalInformation ? (
          <Section title="Additional information">{supplied(profile.additionalInformation)}</Section>
        ) : (
          <Section title="Additional information">{supplied(null)}</Section>
        )}
      </div>
    </>
  )

  if (isPreview) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Preview only. This is not the student view, and it does not change who can open the course.
        </div>
        <Link href="/admin/dashboard/programme-reports">
          <Button variant="ghost" size="sm" className="-ml-2 text-slate-800 hover:text-slate-950">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Programme reports
          </Button>
        </Link>
        {body}
      </div>
    )
  }

  return (
    <StudentPortalShell userName={userName}>
      <Link href="/student/dashboard">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-slate-800 hover:text-slate-950">
          <ChevronLeft className="h-4 w-4 mr-1" />
          My learning
        </Button>
      </Link>
      {body}
    </StudentPortalShell>
  )
}
