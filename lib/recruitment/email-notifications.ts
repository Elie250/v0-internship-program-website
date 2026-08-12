import { sendEmail, escapeHtml, emailLayout } from '@/lib/email/core'
import { COMPANY } from '@/lib/company/constants'
import { getRecruitmentPublicUrl } from '@/lib/recruitment/passwordless-auth'
import { formatApplicationStatus } from '@/lib/recruitment/types'
import type { RecruitmentApplicationStatus } from '@/lib/recruitment/types'

export async function sendApplicationSubmittedEmail(input: {
  candidateEmail: string
  candidateName?: string | null
  jobTitle: string
  organizationName: string
  organizationNotificationEmail?: string | null
}): Promise<void> {
  const name = input.candidateName?.trim() || 'there'
  const dashboardUrl = `${getRecruitmentPublicUrl()}/app`

  await sendEmail({
    to: input.candidateEmail,
    subject: `Application received — ${input.jobTitle} at ${input.organizationName}`,
    html: emailLayout({
      title: 'Application submitted',
      subtitle: `${COMPANY.brandName} Talent`,
      headerTone: 'success',
      bodyHtml: `
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your application for <strong>${escapeHtml(input.jobTitle)}</strong> at <strong>${escapeHtml(input.organizationName)}</strong> has been submitted.</p>
        <p>We will notify you when the employer updates your application status.</p>
        <p style="margin:24px 0"><a href="${dashboardUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View your applications</a></p>
        <p style="font-size:13px;color:#64748b">Powered by ${escapeHtml(COMPANY.brandName)} Talent</p>
      `,
    }),
  })

  if (input.organizationNotificationEmail?.trim()) {
    await sendEmail({
      to: input.organizationNotificationEmail.trim(),
      subject: `New application — ${input.jobTitle}`,
      html: emailLayout({
        title: 'New candidate application',
        subtitle: input.organizationName,
        bodyHtml: `
          <p>A candidate applied for <strong>${escapeHtml(input.jobTitle)}</strong>.</p>
          <p>Employer review tools arrive in a later phase. This is an early notification only.</p>
        `,
      }),
    })
  }
}

export async function sendApplicationStatusChangedEmail(input: {
  candidateEmail: string
  candidateName?: string | null
  jobTitle: string
  organizationName: string
  status: RecruitmentApplicationStatus
}): Promise<void> {
  const name = input.candidateName?.trim() || 'there'
  const dashboardUrl = `${getRecruitmentPublicUrl()}/app`
  const statusLabel = formatApplicationStatus(input.status)

  await sendEmail({
    to: input.candidateEmail,
    subject: `Application update — ${input.jobTitle}`,
    html: emailLayout({
      title: 'Application status updated',
      subtitle: `${COMPANY.brandName} Talent`,
      bodyHtml: `
        <p>Hi ${escapeHtml(name)},</p>
        <p>Your application for <strong>${escapeHtml(input.jobTitle)}</strong> at <strong>${escapeHtml(input.organizationName)}</strong> is now: <strong>${escapeHtml(statusLabel)}</strong>.</p>
        <p style="margin:24px 0"><a href="${dashboardUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View applications</a></p>
      `,
    }),
  })
}
