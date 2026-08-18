import { sendEmail, escapeHtml, emailLayout } from '@/lib/email/core'
import { COMPANY } from '@/lib/company/constants'
import { getRecruitmentPublicUrl } from '@/lib/recruitment/passwordless-auth'
import { loadDocumentAttachment } from '@/lib/recruitment/documents'
import { formatCandidateApplicationStatus } from '@/lib/recruitment/types'
import type { RecruitmentApplicationStatus } from '@/lib/recruitment/types'

function employerSignInUrl(redirectPath: string) {
  const base = getRecruitmentPublicUrl()
  const params = new URLSearchParams({ redirect: redirectPath })
  return `${base}/jobs/auth/continue?${params.toString()}`
}

function candidateSignInUrl(redirectPath: string) {
  const base = getRecruitmentPublicUrl()
  const params = new URLSearchParams({ redirect: redirectPath })
  return `${base}/jobs/auth/continue?${params.toString()}`
}

function ctaButton(href: string, label: string) {
  return `<p style="margin:28px 0 12px">
    <a href="${href}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
      ${escapeHtml(label)}
    </a>
  </p>`
}

function detailRow(label: string, value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return ''
  return `<tr>
    <td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td>
    <td style="padding:6px 0;color:#0f172a">${escapeHtml(trimmed)}</td>
  </tr>`
}

function candidateCopyForStatus(input: {
  status: RecruitmentApplicationStatus
  jobTitle: string
  organizationName: string
  applicationId?: string | null
}): {
  subject: string
  title: string
  headerTone: 'primary' | 'neutral' | 'success' | 'warning'
  paragraphs: string[]
  ctaLabel: string
  ctaPath: string
} {
  const job = escapeHtml(input.jobTitle)
  const org = escapeHtml(input.organizationName)
  const assessmentPath = input.applicationId
    ? `/app/applications/${input.applicationId}/screening`
    : '/app'

  switch (input.status) {
    case 'under_review':
      return {
        subject: `Your application is under review — ${input.jobTitle}`,
        title: 'Your application is under review',
        headerTone: 'primary',
        paragraphs: [
          `Thank you for applying for <strong>${job}</strong> at <strong>${org}</strong>.`,
          'The hiring team is reviewing your application. We will email you as soon as there is a next step.',
        ],
        ctaLabel: 'View your applications',
        ctaPath: '/app',
      }
    case 'screening':
      return {
        subject: `Action required: complete your technical assessment — ${input.jobTitle}`,
        title: 'Complete your technical assessment',
        headerTone: 'primary',
        paragraphs: [
          `<strong>${org}</strong> has invited you to complete a timed technical assessment for the <strong>${job}</strong> role.`,
          'Please sign in and start the assessment when you have a quiet space and a reliable connection. Use a desktop or laptop if you can.',
          'You will see the time limit and attempt rules before you begin. Once started, the official timer is kept by our servers.',
        ],
        ctaLabel: 'Start your assessment',
        ctaPath: assessmentPath,
      }
    case 'shortlisted':
      return {
        subject: `You have been shortlisted — ${input.jobTitle}`,
        title: 'You have been shortlisted',
        headerTone: 'success',
        paragraphs: [
          `Good news — you have been shortlisted for <strong>${job}</strong> at <strong>${org}</strong>.`,
          'The hiring team may contact you about next steps. Watch your inbox for updates.',
        ],
        ctaLabel: 'View your applications',
        ctaPath: '/app',
      }
    case 'interview':
      return {
        subject: `Interview update — ${input.jobTitle}`,
        title: 'Interview stage',
        headerTone: 'primary',
        paragraphs: [
          `Your application for <strong>${job}</strong> at <strong>${org}</strong> has moved to the interview stage.`,
          'If an interview has been scheduled, you will receive a separate invitation with the date, time, and joining details.',
        ],
        ctaLabel: 'View your applications',
        ctaPath: '/app',
      }
    case 'offer':
      return {
        subject: `Offer update — ${input.jobTitle}`,
        title: 'An offer is being prepared',
        headerTone: 'success',
        paragraphs: [
          `Congratulations — <strong>${org}</strong> has moved your application for <strong>${job}</strong> to the offer stage.`,
          'The employer will share offer details separately. Please respond through the channels they provide.',
        ],
        ctaLabel: 'View your applications',
        ctaPath: '/app',
      }
    case 'hired':
      return {
        subject: `Welcome — ${input.jobTitle} at ${input.organizationName}`,
        title: 'You have been hired',
        headerTone: 'success',
        paragraphs: [
          `Congratulations! Your application for <strong>${job}</strong> at <strong>${org}</strong> is marked as hired.`,
          'The employer will contact you with onboarding details if they have not already.',
        ],
        ctaLabel: 'Open your talent dashboard',
        ctaPath: '/app',
      }
    case 'rejected':
      return {
        subject: `Update on your application — ${input.jobTitle}`,
        title: 'Application update',
        headerTone: 'neutral',
        paragraphs: [
          `Thank you for your interest in <strong>${job}</strong> at <strong>${org}</strong>.`,
          'After careful review, the hiring team will not be moving forward with your application at this time. We appreciate the time you invested and wish you every success.',
        ],
        ctaLabel: 'Browse other opportunities',
        ctaPath: '/jobs',
      }
    default:
      return {
        subject: `Application update — ${input.jobTitle}`,
        title: 'Application update',
        headerTone: 'neutral',
        paragraphs: [
          `There is an update on your application for <strong>${job}</strong> at <strong>${org}</strong>.`,
          `Current status: <strong>${escapeHtml(formatCandidateApplicationStatus(input.status))}</strong>.`,
        ],
        ctaLabel: 'View your applications',
        ctaPath: '/app',
      }
  }
}

export async function sendApplicationSubmittedEmail(input: {
  candidateEmail: string
  candidateName?: string | null
  jobTitle: string
  organizationName: string
  organizationNotificationEmail?: string | null
  applicationId?: string | null
  cvDocumentId?: string | null
  candidate?: {
    email?: string | null
    phone?: string | null
    location?: string | null
    headline?: string | null
    linkedinUrl?: string | null
    portfolioUrl?: string | null
    githubUrl?: string | null
    summary?: string | null
    skills?: string[] | null
  }
}): Promise<void> {
  const name = input.candidateName?.trim() || 'there'
  const dashboardUrl = candidateSignInUrl('/app')

  await sendEmail({
    to: input.candidateEmail,
    subject: `We received your application — ${input.jobTitle} at ${input.organizationName}`,
    html: emailLayout({
      title: 'Application received',
      subtitle: `${COMPANY.brandName} Talent`,
      headerTone: 'success',
      bodyHtml: `
        <p>Dear ${escapeHtml(name)},</p>
        <p>Thank you for applying for <strong>${escapeHtml(input.jobTitle)}</strong> at <strong>${escapeHtml(input.organizationName)}</strong>.</p>
        <p>Your application is safely on file. The hiring team will review it and we will email you when there is a next step — for example, a technical assessment or interview invitation.</p>
        ${ctaButton(dashboardUrl, 'View your applications')}
        <p style="font-size:13px;color:#64748b;margin-top:8px">If you are not signed in, use Continue with Email on that page.</p>
        <p style="font-size:13px;color:#64748b">Powered by ${escapeHtml(COMPANY.brandName)} Talent</p>
      `,
    }),
  })

  const orgEmail = input.organizationNotificationEmail?.trim()
  if (!orgEmail) return

  const applicationPath = input.applicationId
    ? `/employer/applications/${input.applicationId}`
    : '/employer/applications'
  const reviewUrl = employerSignInUrl(applicationPath)
  const workspaceUrl = employerSignInUrl('/employer')
  const candidate = input.candidate ?? {}
  const skills =
    Array.isArray(candidate.skills) && candidate.skills.length > 0
      ? candidate.skills.filter(Boolean).slice(0, 20).join(', ')
      : null
  const summary = candidate.summary?.trim()
    ? `<p style="margin-top:12px"><strong>Summary</strong></p>
       <p style="white-space:pre-wrap;color:#334155">${escapeHtml(candidate.summary.trim().slice(0, 1200))}</p>`
    : ''

  let cvNote =
    '<p style="font-size:13px;color:#64748b">Open the application in your employer workspace to download the CV securely.</p>'
  const attachments: Array<{ filename: string; content: Buffer; contentType?: string }> = []

  if (input.cvDocumentId) {
    const cv = await loadDocumentAttachment(input.cvDocumentId)
    if (cv.content && cv.filename) {
      attachments.push({
        filename: cv.filename,
        content: cv.content,
        contentType: cv.contentType,
      })
      cvNote = `<p><strong>CV attached:</strong> ${escapeHtml(cv.filename)}</p>`
    } else {
      cvNote = `<p style="font-size:13px;color:#64748b">CV could not be attached to this email${
        cv.error ? ` (${escapeHtml(cv.error)})` : ''
      }. Sign in to review it in the employer workspace.</p>`
    }
  }

  await sendEmail({
    to: orgEmail,
    subject: `New application — ${input.candidateName?.trim() || 'Candidate'} · ${input.jobTitle}`,
    replyTo: input.candidateEmail || undefined,
    attachments,
    html: emailLayout({
      title: 'New candidate application',
      subtitle: input.organizationName,
      bodyHtml: `
        <p>A candidate applied for <strong>${escapeHtml(input.jobTitle)}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
          ${detailRow('Name', input.candidateName)}
          ${detailRow('Email', candidate.email || input.candidateEmail)}
          ${detailRow('Phone', candidate.phone)}
          ${detailRow('Location', candidate.location)}
          ${detailRow('Headline', candidate.headline)}
          ${detailRow('LinkedIn', candidate.linkedinUrl)}
          ${detailRow('Portfolio', candidate.portfolioUrl)}
          ${detailRow('GitHub', candidate.githubUrl)}
          ${detailRow('Skills', skills)}
        </table>
        ${summary}
        ${cvNote}
        ${ctaButton(reviewUrl, 'Sign in to review this application')}
        <p style="font-size:13px;color:#64748b;margin:0 0 16px">
          Or open your employer workspace:
          <a href="${workspaceUrl}">${escapeHtml(workspaceUrl)}</a>
        </p>
        <p style="font-size:12px;color:#94a3b8">
          You will be asked to Continue with Email, then redirected to the application.
        </p>
      `,
    }),
  })
}

export async function sendApplicationStatusChangedEmail(input: {
  candidateEmail: string
  candidateName?: string | null
  jobTitle: string
  organizationName: string
  status: RecruitmentApplicationStatus
  applicationId?: string | null
}): Promise<void> {
  const name = input.candidateName?.trim() || 'there'
  const copy = candidateCopyForStatus({
    status: input.status,
    jobTitle: input.jobTitle,
    organizationName: input.organizationName,
    applicationId: input.applicationId,
  })
  const ctaUrl = candidateSignInUrl(copy.ctaPath)

  await sendEmail({
    to: input.candidateEmail,
    subject: copy.subject,
    html: emailLayout({
      title: copy.title,
      subtitle: `${COMPANY.brandName} Talent · ${escapeHtml(input.organizationName)}`,
      headerTone: copy.headerTone,
      bodyHtml: `
        <p>Dear ${escapeHtml(name)},</p>
        ${copy.paragraphs.map((p) => `<p>${p}</p>`).join('\n')}
        ${ctaButton(ctaUrl, copy.ctaLabel)}
        <p style="font-size:13px;color:#64748b;margin-top:8px">
          If prompted, Continue with Email using this address to open your secure talent dashboard.
        </p>
        <p style="font-size:12px;color:#94a3b8;margin-top:24px">
          This message was sent by ${escapeHtml(COMPANY.brandName)} Talent on behalf of ${escapeHtml(input.organizationName)}.
        </p>
      `,
    }),
  })
}

export type CandidateMessageType = 'general' | 'request_documents' | 'instructions'

export type CandidateMessageLink = { label: string; url: string }

export function defaultCandidateMessageSubject(
  type: CandidateMessageType,
  jobTitle: string,
  organizationName: string
): string {
  if (type === 'request_documents') {
    return `Action required: additional documents — ${jobTitle}`
  }
  if (type === 'instructions') {
    return `Next steps for your application — ${jobTitle}`
  }
  return `Message from ${organizationName} — ${jobTitle}`
}

export async function sendEmployerCandidateMessageEmail(input: {
  candidateEmail: string
  candidateName?: string | null
  jobTitle: string
  organizationName: string
  subject: string
  body: string
  messageType: CandidateMessageType
  resourceLinks?: CandidateMessageLink[]
  replyTo?: string | null
}): Promise<{ success: boolean; error?: unknown }> {
  const name = input.candidateName?.trim() || 'there'
  const dashboardUrl = candidateSignInUrl('/app')
  const links = (input.resourceLinks ?? []).filter((item) => item.url)
  const linksHtml =
    links.length > 0
      ? `<p><strong>Documents and links</strong></p>
         <ul>
           ${links
             .map(
               (item) =>
                 `<li><a href="${escapeHtml(item.url)}">${escapeHtml(item.label || item.url)}</a></li>`
             )
             .join('')}
         </ul>`
      : ''
  const typeNote =
    input.messageType === 'request_documents'
      ? '<p>Please reply to this email with the requested documents, or sign in to your talent dashboard if the employer asked you to upload them there.</p>'
      : input.messageType === 'instructions'
        ? '<p>Please follow the instructions above. Sign in to your talent dashboard if a next step is waiting there.</p>'
        : ''

  const title =
    input.messageType === 'request_documents'
      ? 'Additional documents requested'
      : input.messageType === 'instructions'
        ? 'How to proceed'
        : 'Message from the hiring team'

  return sendEmail({
    to: input.candidateEmail,
    subject: input.subject,
    replyTo: input.replyTo?.trim() || undefined,
    html: emailLayout({
      title,
      subtitle: `${COMPANY.brandName} Talent · ${escapeHtml(input.organizationName)}`,
      headerTone: input.messageType === 'request_documents' ? 'warning' : 'primary',
      bodyHtml: `
        <p>Dear ${escapeHtml(name)},</p>
        <p><strong>${escapeHtml(input.organizationName)}</strong> sent this message about your application for <strong>${escapeHtml(input.jobTitle)}</strong>.</p>
        <div style="white-space:pre-wrap;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;color:#0f172a">${escapeHtml(input.body)}</div>
        ${linksHtml}
        ${typeNote}
        ${ctaButton(dashboardUrl, 'Open your talent dashboard')}
        <p style="font-size:13px;color:#64748b;margin-top:8px">
          If prompted, Continue with Email using this address. You can reply to this email to reach the hiring team.
        </p>
        <p style="font-size:12px;color:#94a3b8;margin-top:24px">
          This message was sent by ${escapeHtml(COMPANY.brandName)} Talent on behalf of ${escapeHtml(input.organizationName)}.
        </p>
      `,
    }),
  })
}
