import { sendEmail, escapeHtml, emailLayout } from '@/lib/email/core'
import { COMPANY } from '@/lib/company/constants'
import { getRecruitmentPublicUrl } from '@/lib/recruitment/public-url'
import type { RecruitmentOrgRole } from '@/lib/recruitment/types'

function statusContinueUrl(path: string) {
  const base = getRecruitmentPublicUrl()
  const params = new URLSearchParams({ redirect: path })
  return `${base}/jobs/auth/continue?${params.toString()}`
}

export async function sendEmployerRequestConfirmationEmail(input: {
  to: string
  companyName: string
  requestType: 'new_organization' | 'access_existing'
  /** Optional passwordless verify URL (auth only — does not grant hiring access). */
  verifyUrl?: string | null
}) {
  const company = escapeHtml(input.companyName)
  const isNew = input.requestType === 'new_organization'
  const ctaUrl = input.verifyUrl || statusContinueUrl('/employer/pending')

  await sendEmail({
    to: input.to,
    subject: `Hiring account received — ${COMPANY.brandName}`,
    html: emailLayout({
      title: 'Your hiring account is being set up',
      subtitle: COMPANY.brandName,
      bodyHtml: `
        <p>Your account was created successfully.</p>
        <p>
          ${
            isNew
              ? `We received your request to register <strong>${company}</strong> as a hiring partner.
                 Energy &amp; Logics will review it before you can manage jobs or applicants.`
              : `To join an existing company workspace, ask your company administrator to invite
                 <strong>${escapeHtml(input.to)}</strong>.`
          }
        </p>
        <p style="margin:24px 0">
          <a href="${ctaUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Check approval status
          </a>
        </p>
        <p style="font-size:13px;color:#64748b">
          This link only signs you in. It does not grant hiring access until your organization is approved
          or a company admin invites you.
        </p>
      `,
    }),
  })
}

export async function sendEmployerAccessApprovedEmail(input: {
  to: string
  companyName: string
}) {
  const company = escapeHtml(input.companyName)
  const ctaUrl = statusContinueUrl('/employer')
  await sendEmail({
    to: input.to,
    subject: `Hiring access approved — ${COMPANY.brandName}`,
    html: emailLayout({
      title: 'Your hiring workspace is ready',
      subtitle: COMPANY.brandName,
      bodyHtml: `
        <p>Good news — <strong>${company}</strong> has been approved.</p>
        <p>Sign in to open your employer workspace and start managing jobs and applicants.</p>
        <p style="margin:24px 0">
          <a href="${ctaUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Open employer workspace
          </a>
        </p>
        <p style="font-size:13px;color:#64748b">Access is granted by membership on an approved organization — not by this email alone.</p>
      `,
    }),
  })
}

export async function sendEmployerRequestRejectedEmail(input: {
  to: string
  companyName: string
  reason?: string | null
}) {
  const company = escapeHtml(input.companyName)
  const reason = input.reason?.trim()
    ? `<p><strong>Note:</strong> ${escapeHtml(input.reason.trim())}</p>`
    : ''
  const ctaUrl = statusContinueUrl('/employer/pending')
  await sendEmail({
    to: input.to,
    subject: `Hiring request update — ${COMPANY.brandName}`,
    html: emailLayout({
      title: 'Organization request not approved',
      subtitle: COMPANY.brandName,
      bodyHtml: `
        <p>Your request to register <strong>${company}</strong> was not approved at this time.</p>
        ${reason}
        <p>You can still use this account to browse and apply for jobs as a candidate.</p>
        <p style="margin:24px 0">
          <a href="${ctaUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            View request status
          </a>
        </p>
      `,
    }),
  })
}

export async function sendOrganizationInviteEmail(input: {
  to: string
  companyName: string
  role: RecruitmentOrgRole
  rawToken: string
}) {
  const publicUrl = getRecruitmentPublicUrl()
  const inviteUrl = `${publicUrl}/employer/invitation?token=${encodeURIComponent(input.rawToken)}`
  const company = escapeHtml(input.companyName)
  const roleLabel = escapeHtml(input.role.replace(/_/g, ' '))

  await sendEmail({
    to: input.to,
    subject: `You're invited to hire with ${input.companyName} — ${COMPANY.brandName}`,
    html: emailLayout({
      title: 'Company hiring invitation',
      subtitle: COMPANY.brandName,
      bodyHtml: `
        <p>You have been invited to join <strong>${company}</strong> as <strong>${roleLabel}</strong>.</p>
        <p>Accepting this invitation grants employer workspace access for that company only.</p>
        <p style="margin:24px 0">
          <a href="${inviteUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Review invitation
          </a>
        </p>
        <p style="font-size:13px;color:#64748b">
          You may need to Continue with Email using <strong>${escapeHtml(input.to)}</strong> before accepting.
          This link does not bypass authentication or approval rules.
        </p>
        <p style="font-size:12px;color:#94a3b8;word-break:break-all">${inviteUrl}</p>
      `,
    }),
  })
}
