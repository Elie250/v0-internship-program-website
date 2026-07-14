import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AdminReportData } from '@/lib/admin/data/admin-reports'
import { COMPANY } from '@/lib/company/constants'
import {
  companyLetterheadRows,
  drawReportAuthorityAfterContent,
  drawReportFooter,
  drawReportHeader,
  loadReportAuthorityAssets,
  loadReportLogoDataUrl,
} from '@/lib/admin/data/report-branding'

type ReportRow = [section: string, metric: string, value: string | number]

export function reportFileDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function buildReportRows(report: AdminReportData): ReportRow[] {
  const { stats, coursesByStatus, programmeNotifications, content } = report

  return [
    ['Users', 'Total users', stats.users],
    ['Users', 'Students', stats.students],
    ['Users', 'Lecturers', stats.lecturers],
    ['Users', 'Engineers', stats.engineers],
    ['Users', 'Staff awaiting approval', stats.pendingStaffApprovals],
    ['Programmes', 'Total programmes', stats.courses],
    ['Programmes', 'Published', coursesByStatus.published],
    ['Programmes', 'Pending review', coursesByStatus.pendingReview],
    ['Programmes', 'Draft', coursesByStatus.draft],
    ['Programmes', 'Archived', coursesByStatus.archived],
    ['Programme action items', 'Programmes needing attention', programmeNotifications.coursesNeedingAttention],
    ['Programme action items', 'Total notification items', programmeNotifications.total],
    ['Programme action items', 'Pending enrollments (by programme)', programmeNotifications.pendingEnrollments],
    ['Programme action items', 'Pending certificates (by programme)', programmeNotifications.pendingCertificates],
    ['Enrollments & payments', 'Course enrollments', stats.courseEnrollments],
    ['Enrollments & payments', 'Admitted', stats.admittedEnrollments],
    ['Enrollments & payments', 'Pending payment review', stats.pendingEnrollments],
    ['Enrollments & payments', 'Pending payment receipts', stats.pendingPayments],
    ['Enrollments & payments', 'Pending certificates', stats.pendingCertificates],
    ['Enrollments & payments', 'Verified revenue (RWF)', stats.approvedPaymentsTotal.toLocaleString()],
    ['Enrollments & payments', 'Internship applications', stats.applications],
    ['Operations', 'Products', stats.products],
    ['Operations', 'Low-stock products', stats.lowStockProducts],
    ['Operations', 'Support tickets', stats.supportTickets],
    ['Operations', 'Announcements', stats.announcements],
    [
      'Content',
      'Energy Library items',
      `${content.libraryTotal} (${content.libraryPublished} published, ${content.libraryPendingReview} pending review)`,
    ],
    [
      'Content',
      'Field Notes articles',
      `${content.engineeringArticlesTotal} (${content.engineeringArticlesPublished} published)`,
    ],
  ]
}

function escapeCsvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`
}

async function buildAdminReportPdfDoc(report: AdminReportData): Promise<jsPDF> {
  const doc = new jsPDF()
  const [logoDataUrl, authority] = await Promise.all([
    loadReportLogoDataUrl(),
    loadReportAuthorityAssets(),
  ])
  const startY = drawReportHeader(doc, {
    title: 'Admin platform report',
    subtitle: `${COMPANY.platformName} — operations & programme summary`,
    logoDataUrl,
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(30, 58, 95)
  doc.text('Key metrics', 14, startY)

  autoTable(doc, {
    head: [['Section', 'Metric', 'Value']],
    body: buildReportRows(report),
    startY: startY + 3,
    margin: { left: 14, right: 14 },
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 95] },
    columnStyles: {
      0: { cellWidth: 52 },
      1: { cellWidth: 78 },
      2: { cellWidth: 'auto' },
    },
  })

  drawReportAuthorityAfterContent(doc, authority, startY)

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    drawReportFooter(doc, i, pageCount)
  }

  return doc
}

export function buildAdminReportCsvString(report: AdminReportData): string {
  const rows = buildReportRows(report)
  return [
    ...companyLetterheadRows(),
    ['Admin platform report', '', ''],
    ['Section', 'Metric', 'Value'],
    ...rows,
  ]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n')
}

export async function buildAdminReportPdfArrayBuffer(report: AdminReportData): Promise<ArrayBuffer> {
  const doc = await buildAdminReportPdfDoc(report)
  return doc.output('arraybuffer')
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

export async function downloadAdminReportPdf(report: AdminReportData): Promise<void> {
  const buffer = await buildAdminReportPdfArrayBuffer(report)
  const blob = new Blob([buffer], { type: 'application/pdf' })
  triggerBrowserDownload(blob, `admin-report-${reportFileDate()}.pdf`)
}

export function downloadAdminReportExcel(report: AdminReportData): void {
  const csv = buildAdminReportCsvString(report)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  triggerBrowserDownload(blob, `admin-report-${reportFileDate()}.csv`)
}
