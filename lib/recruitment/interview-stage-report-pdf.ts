import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { COMPANY } from '@/lib/company/constants'
import type {
  EmployerReportOrganization,
  InterviewPlacementReport,
  InterviewResultsReport,
  InterviewStageReport,
} from '@/lib/recruitment/interview-stage-report-types'

const NAVY: [number, number, number] = [30, 58, 95]
const GOLD: [number, number, number] = [184, 148, 31]
const MUTED: [number, number, number] = [100, 116, 139]

function reportFileDate(iso: string): string {
  return iso.slice(0, 10)
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function drawOrgHeader(
  doc: jsPDF,
  organization: EmployerReportOrganization,
  options: { eyebrow: string; title: string; generatedAt: string }
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, pageWidth, 28, 'F')
  doc.setFillColor(...GOLD)
  doc.rect(0, 28, pageWidth, 1.2, 'F')

  let textLeft = margin
  if (organization.logoDataUrl) {
    try {
      const format = organization.logoDataUrl.includes('image/jpeg') ? 'JPEG' : 'PNG'
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(margin, 6, 20, 16, 1.5, 1.5, 'F')
      doc.addImage(organization.logoDataUrl, format, margin + 2, 7.5, 16, 13)
      textLeft = margin + 24
    } catch {
      // text-only header
    }
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(organization.name, textLeft, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(200, 210, 225)
  doc.text(options.eyebrow, textLeft, 20)

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(options.title, pageWidth - margin, 13, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(200, 210, 225)
  doc.text(new Date(options.generatedAt).toLocaleString(), pageWidth - margin, 20, {
    align: 'right',
  })

  return 36
}

function drawConfidentialFooter(doc: jsPDF, organizationName: string) {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setFontSize(7)
    doc.setTextColor(...MUTED)
    doc.text(
      `${organizationName} · Internal use · Prepared with ${COMPANY.brandName} Talent · Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    )
  }
}

function writeIntro(doc: jsPDF, startY: number, text: string): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...NAVY)
  const lines = doc.splitTextToSize(text, pageWidth - 28)
  doc.text(lines, 14, startY)
  return startY + lines.length * 4.2 + 4
}

export async function downloadInterviewStageReportPdf(report: InterviewStageReport): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const startY = drawOrgHeader(doc, report.organization, {
    eyebrow: 'Internal · Confidential',
    title: 'Interview stage',
    generatedAt: report.generatedAt,
  })
  const tableStart = writeIntro(
    doc,
    startY,
    `${report.candidateCount} candidate${report.candidateCount === 1 ? '' : 's'} in interview. Email is under the name when a name is missing.`
  )

  autoTable(doc, {
    startY: tableStart,
    margin: { left: 14, right: 14, bottom: 16 },
    head: [['Name', 'Role', 'Screening', 'Integrity']],
    body:
      report.candidates.length > 0
        ? report.candidates.map((row) => [
            [row.name, row.email].filter(Boolean).join('\n'),
            row.jobTitle,
            row.screeningLabel,
            row.integrityLabel,
          ])
        : [['—', 'No one is in the interview stage.', '—', '—']],
    theme: 'striped',
    styles: { fontSize: 9.5, cellPadding: 3, valign: 'top', overflow: 'linebreak' },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 58 },
      1: { cellWidth: 56 },
      2: { cellWidth: 28 },
      3: { cellWidth: 40 },
    },
  })

  drawConfidentialFooter(doc, report.organization.name)
  const slug = report.organization.slug || 'organization'
  triggerBrowserDownload(
    doc.output('blob'),
    `${slug}-interview-stage-${reportFileDate(report.generatedAt)}.pdf`
  )
}

export async function downloadInterviewPlacementReportPdf(
  report: InterviewPlacementReport
): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const startY = drawOrgHeader(doc, report.organization, {
    eyebrow: 'Internal schedule · Confidential',
    title: 'Interview placement',
    generatedAt: report.generatedAt,
  })
  const tableStart = writeIntro(
    doc,
    startY,
    `Who is booked, in time order. ${report.rowCount} interview${report.rowCount === 1 ? '' : 's'}. Meeting links and contact details are not printed.`
  )

  autoTable(doc, {
    startY: tableStart,
    margin: { left: 14, right: 14, bottom: 16 },
    head: [['When', 'Name', 'Role', 'Format', 'Place', 'Length', 'Status']],
    body:
      report.rows.length > 0
        ? report.rows.map((row) => [
            row.when,
            row.name,
            row.jobTitle,
            row.interviewType,
            row.place,
            row.duration,
            row.status,
          ])
        : [['—', 'No interviews on the board.', '—', '—', '—', '—', '—']],
    theme: 'striped',
    styles: { fontSize: 8.5, cellPadding: 2.4, valign: 'middle', overflow: 'linebreak' },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 46 },
      1: { cellWidth: 42 },
      2: { cellWidth: 48 },
      3: { cellWidth: 24 },
      4: { cellWidth: 48 },
      5: { cellWidth: 24 },
      6: { cellWidth: 28 },
    },
  })

  drawConfidentialFooter(doc, report.organization.name)
  const slug = report.organization.slug || 'organization'
  triggerBrowserDownload(
    doc.output('blob'),
    `${slug}-interview-placement-${reportFileDate(report.generatedAt)}.pdf`
  )
}

export async function downloadInterviewResultsReportPdf(
  report: InterviewResultsReport
): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const startY = drawOrgHeader(doc, report.organization, {
    eyebrow: 'Internal interview results · Confidential',
    title: 'Scorecard marks',
    generatedAt: report.generatedAt,
  })
  const tableStart = writeIntro(
    doc,
    startY,
    [
      `${report.organization.name} — interview scorecard marks for each candidate.`,
      'Marks are 1–5 from submitted interviewer scorecards. Private interviewer notes are not included. Scores do not hire or reject anyone.',
      `${report.rowCount} interview${report.rowCount === 1 ? '' : 's'}.`,
    ].join(' ')
  )

  const criteria = report.criteria.slice(0, 8)
  const head = ['Name', 'Role / interview', ...criteria.map((name) => `${name} /5`), 'Overall /5', 'Recommendation']
  const usableWidth = doc.internal.pageSize.getWidth() - 28
  const nameW = 38
  const roleW = 42
  const recW = 28
  const overallW = 18
  const markW = Math.max(16, (usableWidth - nameW - roleW - recW - overallW) / Math.max(criteria.length, 1))

  autoTable(doc, {
    startY: tableStart,
    margin: { left: 14, right: 14, bottom: 16 },
    head: [head],
    body:
      report.rows.length > 0
        ? report.rows.map((row) => {
            const markMap = new Map(row.criteriaMarks.map((mark) => [mark.criterion, mark.score]))
            return [
              row.name,
              [row.jobTitle, `${row.scheduledAt} · ${row.interviewType}`, row.interviewStatus]
                .filter(Boolean)
                .join('\n'),
              ...criteria.map((name) =>
                markMap.get(name) != null ? String(markMap.get(name)) : '—'
              ),
              row.overallLabel,
              row.scorecardCount
                ? `${row.recommendationLabel}\n${row.scorecardCount} scorecard${row.scorecardCount === 1 ? '' : 's'}`
                : 'No submitted scorecard',
            ]
          })
        : [[ '—', 'No interview results on file.', ...criteria.map(() => '—'), '—', '—' ]],
    theme: 'striped',
    styles: { fontSize: 7.5, cellPadding: 2, valign: 'top', overflow: 'linebreak' },
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: nameW },
      1: { cellWidth: roleW },
      ...Object.fromEntries(criteria.map((_, index) => [index + 2, { cellWidth: markW }])),
      [criteria.length + 2]: { cellWidth: overallW },
      [criteria.length + 3]: { cellWidth: recW },
    },
  })

  drawConfidentialFooter(doc, report.organization.name)
  const slug = report.organization.slug || 'organization'
  triggerBrowserDownload(
    doc.output('blob'),
    `${slug}-interview-results-${reportFileDate(report.generatedAt)}.pdf`
  )
}

export type OrgReportKind = 'interview-stage' | 'interview-results' | 'interview-placement'

export async function downloadOrgReport(
  organizationId: string,
  kind: OrgReportKind
): Promise<void> {
  const res = await fetch(`/api/recruitment/organizations/${organizationId}/reports/${kind}`, {
    credentials: 'same-origin',
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Could not build report')
  if (kind === 'interview-placement') {
    await downloadInterviewPlacementReportPdf(data.report)
    return
  }
  if (kind === 'interview-results') {
    await downloadInterviewResultsReportPdf(data.report)
    return
  }
  await downloadInterviewStageReportPdf(data.report)
}
