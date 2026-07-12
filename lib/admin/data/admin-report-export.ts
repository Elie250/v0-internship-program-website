import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AdminReportData } from '@/lib/admin/data/admin-reports'

const REPORT_TITLE = 'Energy & Logics Academy - Admin Report'

type ReportRow = [section: string, metric: string, value: string | number]

function reportFileDate(): string {
  return new Date().toISOString().split('T')[0]
}

function buildReportRows(report: AdminReportData): ReportRow[] {
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

export function downloadAdminReportPdf(report: AdminReportData): void {
  const doc = new jsPDF()
  const generated = new Date().toLocaleString()

  doc.setFontSize(16)
  doc.text(REPORT_TITLE, 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated: ${generated}`, 14, 26)
  doc.setTextColor(0)

  autoTable(doc, {
    head: [['Section', 'Metric', 'Value']],
    body: buildReportRows(report),
    startY: 34,
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

  doc.save(`admin-report-${reportFileDate()}.pdf`)
}

export function downloadAdminReportExcel(report: AdminReportData): void {
  const rows = buildReportRows(report)
  const csvContent = [
    ['Section', 'Metric', 'Value'],
    ...rows,
    ['', 'Generated', new Date().toLocaleString()],
  ]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n')

  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `admin-report-${reportFileDate()}.csv`)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
