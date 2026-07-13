import { Resend } from 'resend'
import { COMPANY } from '@/lib/company/constants'
import { buildAdminReportDataInternal } from '@/app/actions/admin-context'
import {
  buildAdminReportCsvString,
  buildAdminReportPdfArrayBuffer,
  reportFileDate,
} from '@/lib/admin/data/admin-report-export'

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim()
  return key ? new Resend(key) : null
}

const from = process.env.EMAIL_FROM ?? 'Energy & Logics <noreply@energyandlogics.com>'

export async function sendLeadershipReportEmail(): Promise<{ sent: boolean; skipped?: boolean }> {
  const resend = getResend()
  const recipients = (process.env.LEADERSHIP_REPORT_EMAILS ?? process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)

  if (!resend || !recipients.length) {
    return { sent: false, skipped: true }
  }

  const report = await buildAdminReportDataInternal()
  const { stats, coursesByStatus, programmeNotifications, content } = report
  const fileDate = reportFileDate()
  const pdfBase64 = Buffer.from(buildAdminReportPdfArrayBuffer(report)).toString('base64')
  const csvBase64 = Buffer.from(`\uFEFF${buildAdminReportCsvString(report)}`, 'utf-8').toString('base64')

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1e293b;max-width:640px;margin:0 auto;padding:24px">
<h1 style="color:#1e3a5f">Weekly leadership report</h1>
<p>Snapshot for ${new Date().toLocaleDateString()}.</p>
<p style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;font-size:14px">
  <strong>Attached:</strong> PDF summary and Excel-compatible CSV export. Open the PDF for the full formatted report.
</p>
<h2>Users</h2>
<ul>
<li>Total users: ${stats.users}</li>
<li>Students: ${stats.students}</li>
<li>Lecturers: ${stats.lecturers}</li>
<li>Engineers: ${stats.engineers}</li>
</ul>
<h2>Learning</h2>
<ul>
<li>Enrollments: ${stats.courseEnrollments} (${stats.admittedEnrollments} admitted)</li>
<li>Programmes published: ${coursesByStatus.published}</li>
<li>Programme action items: ${programmeNotifications.total}</li>
<li>Pending certificates: ${stats.pendingCertificates}</li>
</ul>
<h2>Operations</h2>
<ul>
<li>Pending payments: ${stats.pendingPayments}</li>
<li>Verified revenue (RWF): ${stats.approvedPaymentsTotal.toLocaleString()}</li>
<li>Support tickets: ${stats.supportTickets}</li>
<li>Low-stock products: ${stats.lowStockProducts}</li>
</ul>
<h2>Content</h2>
<ul>
<li>Energy Library: ${content.libraryTotal} (${content.libraryPendingReview} pending review)</li>
<li>Field Notes: ${content.engineeringArticlesPublished} published</li>
</ul>
<p style="margin-top:24px;font-size:13px;color:#64748b">${COMPANY.brandName}</p>
</body></html>`

  await resend.emails.send({
    from,
    to: recipients,
    subject: `Leadership report — ${COMPANY.brandName}`,
    html,
    attachments: [
      {
        filename: `admin-report-${fileDate}.pdf`,
        content: pdfBase64,
      },
      {
        filename: `admin-report-${fileDate}.csv`,
        content: csvBase64,
      },
    ],
  })

  return { sent: true }
}
